"use client";

import {
  useState,
  useTransition,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";

import { FieldError, FormError, invalidInputClass } from "@/components/ui/form-feedback";
import { PERSON_NAME_MAX, PHONE_MAX } from "@/features/auth/constants";
import { updateProfileSchema } from "@/features/dashboard/profile-management-schemas";
import { getFieldErrors } from "@/lib/validation/errors";
import { msg } from "@/lib/validation/messages";
import {
  deactivateManagedProfile,
  loadManagedProfilePageContaining,
  loadManagedProfilesPage,
  reactivateManagedProfile,
  updateManagedProfile,
} from "@/features/dashboard/profile-management-actions";
import {
  MANAGED_PROFILE_ROLE_IDS,
  PROFILES_PER_PAGE,
  type InitialManagedProfiles,
  type ManagedProfile,
  type ManagedProfilePage,
  type ManagedProfileRoleId,
} from "@/features/dashboard/profile-management-types";

// Same look as invalidInputClass, without the red.
const profileInputClass: string =
  "mt-1 w-full rounded-md border border-roya-slate/30 px-3 py-2";

type ManageUsersProps = {
  initialProfiles: InitialManagedProfiles;
};

function formatAuthDate(value: string | null, neverLabel = "—") {
  if (!value) return neverLabel;

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Edmonton",
  }).format(new Date(value));
}
function ProfileTable({
  data,
  setData,
  roleId,
  title,
  onRoleChanged,
}: {
  data: ManagedProfilePage;
  setData: Dispatch<SetStateAction<ManagedProfilePage>>;
  roleId: ManagedProfileRoleId;
  title: string;
  onRoleChanged: (profile: ManagedProfile) => Promise<void>;
}) {
  const [editingProfile, setEditingProfile] = useState<ManagedProfile | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  // Errors for the edit popup. They show inside it, where the admin is looking.
  const [dialogError, setDialogError] = useState<string>("");
  const [dialogFieldErrors, setDialogFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  /**
   * Opens or closes the edit popup, clearing the previous popup's errors.
   * @param profile The profile to edit, or null to close.
   */
  function openEditor(profile: ManagedProfile | null): void {
    setDialogError("");
    setDialogFieldErrors({});
    setEditingProfile(profile);
  }

  /**
   * Clears one field's error once the admin edits it.
   * @param field The input's name, e.g. "phone".
   */
  function clearDialogFieldError(field: string): void {
    setDialogFieldErrors((current: Record<string, string>) => {
      const next: Record<string, string> = { ...current };
      delete next[field];
      return next;
    });
  }

  function changePage(page: number) {
    setError(null);
    startTransition(async () => {
      try {
        setData(await loadManagedProfilesPage({ roleId, page }));
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : msg.unableTo("load profiles"),
        );
      }
    });
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProfile) return;

    const formData = new FormData(event.currentTarget);
    setDialogError("");

    // Same rules as the server action, checked here first for fast feedback.
    const parsed: ReturnType<typeof updateProfileSchema.safeParse> = updateProfileSchema.safeParse({
      id: editingProfile.id,
      currentRoleId: editingProfile.roleId,
      roleId: Number(formData.get("roleId")),
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
    });
    if (!parsed.success) {
      setDialogFieldErrors(getFieldErrors(parsed.error));
      return;
    }

    setDialogFieldErrors({});
    startTransition(async () => {
      try {
        const result = await updateManagedProfile(parsed.data);

        if (!result.success) {
          setDialogError(result.message);
          return;
        }

        setEditingProfile(null);

        if (result.profile.roleId !== roleId) {
          setData(await loadManagedProfilesPage({ roleId, page: data.page }));
          await onRoleChanged(result.profile);
        } else {
          setData((current) => ({
            ...current,
            profiles: current.profiles.map((profile) =>
              profile.id === result.profile.id ? result.profile : profile,
            ),
          }));
        }
      } catch (actionError) {
        setDialogError(
          actionError instanceof Error
            ? actionError.message
            : msg.unableTo("save the profile"),
        );
      }
    });
  }

  function deactivateProfile(profile: ManagedProfile) {
    if (
      !window.confirm(`Delete ${profile.firstName} ${profile.lastName}? Their profile will be deactivated.`)
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await deactivateManagedProfile({
          id: profile.id,
          roleId,
        });
        if (!result.success) {
          setError(result.message);
          return;
        }

        setData(await loadManagedProfilesPage({ roleId, page: data.page }));
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : msg.unableTo("deactivate the profile"),
        );
      }
    });
  }

  function reactivateProfile(profile: ManagedProfile) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await reactivateManagedProfile({
          id: profile.id,
          roleId,
        });

        if (!result.success) {
          setError(result.message);
          return;
        }

        setData(await loadManagedProfilesPage({ roleId, page: data.page }));
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : msg.unableTo("reactivate the profile"),
        );
      }
    });
  }

  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl font-bold uppercase text-roya-ink">
        {title}
      </h2>
      <p className="mt-1 text-sm text-roya-slate">
        {data.totalProfiles} profiles · {PROFILES_PER_PAGE} profiles per page
      </p>

      {error && (
        <div className="mt-4">
          <FormError message={error} />
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-roya-slate/20">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-roya-slate/5 text-roya-ink">
            <tr>
              <th className="px-4 py-3 font-semibold" scope="col">
                Name
              </th>
              <th className="px-4 py-3 font-semibold" scope="col">
                Email
              </th>
              <th className="px-4 py-3 font-semibold" scope="col">
                Phone
              </th>
              <th className="px-4 py-3 font-semibold" scope="col">
                Last sign in
              </th>
              <th className="px-4 py-3 font-semibold" scope="col">
                Status
              </th>
              <th className="px-4 py-3 text-right font-semibold" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-roya-slate/15">
            {data.profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="px-4 py-3 text-roya-ink">
                  {profile.firstName} {profile.lastName}
                </td>
                <td className="px-4 py-3 text-roya-slate">{profile.email}</td>
                <td className="px-4 py-3 text-roya-slate">
                  {profile.phone || "—"}
                </td>
                <td className="px-4 py-3 text-roya-slate">
                  {formatAuthDate(profile.lastSignInAt, "Never")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      profile.isActive
                        ? "font-medium text-green-700"
                        : "font-medium text-roya-slate"
                    }
                  >
                    {profile.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-md border border-roya-slate/30 px-3 py-1.5 font-medium text-roya-ink hover:bg-roya-slate/5 disabled:opacity-50"
                      disabled={isPending}
                      onClick={() => {
                        setError(null);
                        openEditor(profile);
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-md border border-red-300 px-3 py-1.5 font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!profile.isActive || isPending}
                      onClick={() => deactivateProfile(profile)}
                      type="button"
                    >
                      Delete
                    </button>
                    {!profile.isActive && (
                      <button
                        className="rounded-md border border-green-300 px-3 py-1.5 font-medium text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isPending}
                        onClick={() => reactivateProfile(profile)}
                        type="button"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {data.profiles.length === 0 && (
              <tr>
                <td
                  className="px-4 py-8 text-center text-roya-slate"
                  colSpan={7}
                >
                  No {title.toLowerCase()} found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          className="rounded-md border border-roya-slate/30 px-4 py-2 text-sm font-semibold text-roya-ink hover:bg-roya-slate/5 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={data.page <= 1 || isPending}
          onClick={() => changePage(data.page - 1)}
          type="button"
        >
          Previous
        </button>
        <p aria-live="polite" className="text-sm text-roya-slate">
          Page {data.page} of {data.totalPages}
        </p>
        <button
          className="rounded-md border border-roya-slate/30 px-4 py-2 text-sm font-semibold text-roya-ink hover:bg-roya-slate/5 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={data.page >= data.totalPages || isPending}
          onClick={() => changePage(data.page + 1)}
          type="button"
        >
          Next
        </button>
      </div>

      {editingProfile && (
        <div
          aria-labelledby={`edit-profile-${editingProfile.id}-title`}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
        >
          <form
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
            noValidate
            onSubmit={saveProfile}
          >
            <h3
              className="font-display text-2xl font-bold uppercase text-roya-ink"
              id={`edit-profile-${editingProfile.id}-title`}
            >
              Edit {title.slice(0, -1)}
            </h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-roya-ink" htmlFor="profile-first-name">
                  First name
                </label>
                <input
                  aria-describedby="profile-first-name-error"
                  aria-invalid={Boolean(dialogFieldErrors.firstName)}
                  className={dialogFieldErrors.firstName ? invalidInputClass : profileInputClass}
                  defaultValue={editingProfile.firstName}
                  id="profile-first-name"
                  maxLength={PERSON_NAME_MAX}
                  name="firstName"
                  onChange={() => clearDialogFieldError("firstName")}
                  required
                />
                <FieldError id="profile-first-name-error" message={dialogFieldErrors.firstName} />
              </div>
              <div>
                <label className="text-sm font-medium text-roya-ink" htmlFor="profile-last-name">
                  Last name
                </label>
                <input
                  aria-describedby="profile-last-name-error"
                  aria-invalid={Boolean(dialogFieldErrors.lastName)}
                  className={dialogFieldErrors.lastName ? invalidInputClass : profileInputClass}
                  defaultValue={editingProfile.lastName}
                  id="profile-last-name"
                  maxLength={PERSON_NAME_MAX}
                  name="lastName"
                  onChange={() => clearDialogFieldError("lastName")}
                  required
                />
                <FieldError id="profile-last-name-error" message={dialogFieldErrors.lastName} />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-roya-ink" htmlFor="profile-role">
                  Role
                </label>
                <select
                  aria-describedby="profile-role-error"
                  aria-invalid={Boolean(dialogFieldErrors.roleId)}
                  className={dialogFieldErrors.roleId ? invalidInputClass : profileInputClass}
                  defaultValue={editingProfile.roleId}
                  id="profile-role"
                  name="roleId"
                  onChange={() => clearDialogFieldError("roleId")}
                >
                  <option value={MANAGED_PROFILE_ROLE_IDS.user}>User</option>
                  <option value={MANAGED_PROFILE_ROLE_IDS.admin}>Admin</option>
                </select>
                <FieldError id="profile-role-error" message={dialogFieldErrors.roleId} />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-roya-ink" htmlFor="profile-phone">
                  Phone (optional)
                </label>
                <input
                  aria-describedby="profile-phone-error"
                  aria-invalid={Boolean(dialogFieldErrors.phone)}
                  className={dialogFieldErrors.phone ? invalidInputClass : profileInputClass}
                  defaultValue={editingProfile.phone ?? ""}
                  id="profile-phone"
                  maxLength={PHONE_MAX}
                  name="phone"
                  onChange={() => clearDialogFieldError("phone")}
                  placeholder="(780) 555-0123"
                  type="tel"
                />
                <FieldError id="profile-phone-error" message={dialogFieldErrors.phone} />
              </div>
            </div>
            <div className="mt-4">
              <FormError message={dialogError} />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-md border border-roya-slate/30 px-4 py-2 text-sm font-semibold text-roya-ink hover:bg-roya-slate/5"
                disabled={isPending}
                onClick={() => openEditor(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-roya-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export function ManageUsers({ initialProfiles }: ManageUsersProps) {
  const [users, setUsers] = useState(initialProfiles.users);
  const [admins, setAdmins] = useState(initialProfiles.admins);

  async function handleRoleChanged(profile: ManagedProfile) {
    const targetPage = await loadManagedProfilePageContaining({
      roleId: profile.roleId,
      profileId: profile.id,
    });

    if (profile.roleId === MANAGED_PROFILE_ROLE_IDS.user) {
      setUsers(targetPage);
    } else {
      setAdmins(targetPage);
    }
  }

  return (
    <div>
      <ProfileTable
        data={users}
        setData={setUsers}
        roleId={MANAGED_PROFILE_ROLE_IDS.user}
        title="Users"
        onRoleChanged={handleRoleChanged}
      />
      <ProfileTable
        data={admins}
        setData={setAdmins}
        roleId={MANAGED_PROFILE_ROLE_IDS.admin}
        title="Admins"
        onRoleChanged={handleRoleChanged}
      />
    </div>
  );
}
