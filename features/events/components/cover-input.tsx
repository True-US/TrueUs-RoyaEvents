"use client";

import { useState, type ChangeEvent } from "react";

import { COVER_HEIGHT, COVER_WIDTH } from "@/features/events/constants";
import { prepareCoverImage } from "@/features/events/utils/cover-image";

type CoverInputProps = {
  // Unique id for the file input (and its label).
  id: string;
  // The saved cover (edit mode), or null.
  currentCoverUrl: string | null;
  // The new, prepared cover waiting to be saved, or null.
  file: File | null;
  // Called with the prepared WebP file, or null to undo the new image.
  onFileChange: (file: File | null) => void;
  // Lets the parent block saving while an image is being prepared.
  onBusyChange?: (busy: boolean) => void;
  // An error from the parent (e.g. "required to publish").
  error?: string;
  disabled?: boolean;
};

/**
 * Cover image picker for admin forms. Shows the saved cover (or the newly
 * picked one), and turns any picked photo into a 2:1 WebP before handing it
 * to the parent. Reusable for events and adventures.
 * @param props See CoverInputProps.
 * @returns The picker.
 */
export function CoverInput({
  id,
  currentCoverUrl,
  file,
  onFileChange,
  onBusyChange,
  error,
  disabled = false,
}: CoverInputProps) {
  // The preview belongs to one file. When the parent clears or replaces the
  // file (e.g. the popup reopens), a preview for another file is ignored.
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const [preparing, setPreparing] = useState<boolean>(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);

  const newPreviewUrl: string | null = preview && file && preview.file === file ? preview.url : null;
  const shownUrl: string | null = newPreviewUrl ?? currentCoverUrl;
  const message: string | undefined = prepareError ?? error;

  /**
   * Prepares the picked photo and passes the result to the parent.
   * @param event The file input's change event.
   */
  async function handleSelect(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const picked: File | undefined = event.target.files?.[0];
    // Clear the input, so picking the same file again still fires onChange.
    event.target.value = "";
    if (!picked) {
      return;
    }

    setPreparing(true);
    onBusyChange?.(true);
    setPrepareError(null);
    try {
      const cover: File = await prepareCoverImage(picked);
      setPreview({ file: cover, url: await readAsDataUrl(cover) });
      onFileChange(cover);
    } catch (caught) {
      setPrepareError(caught instanceof Error ? caught.message : "This image can't be used.");
    } finally {
      setPreparing(false);
      onBusyChange?.(false);
    }
  }

  return (
    <div>
      <label className="text-sm font-semibold" htmlFor={id}>
        Cover Image
      </label>

      {/* No cover yet: just the button below, no empty preview box. */}
      {shownUrl && (
        <div
          className={`relative mt-1 aspect-[2/1] overflow-hidden rounded-md border bg-roya-slate/10 ${
            message ? "border-red-500" : "border-roya-slate/30"
          }`}
        >
          {/* A plain <img>: previews are local data URLs, which next/image can't optimise. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Cover preview" className="h-full w-full object-cover" src={shownUrl} />

          {newPreviewUrl && (
            <span className="absolute left-2 top-2 rounded bg-roya-sun px-2 py-0.5 text-xs font-semibold text-roya-ink">
              New, saved when you save the event
            </span>
          )}

          {preparing && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-roya-ink">
              Preparing image…
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {/* The real input is hidden; the label is styled as the button. */}
        <label
          className={`cursor-pointer rounded-md border border-roya-slate/30 bg-white px-4 py-2 text-sm font-semibold text-roya-ink hover:bg-roya-slate/5 ${
            disabled || preparing ? "pointer-events-none opacity-50" : ""
          }`}
          htmlFor={id}
        >
          {shownUrl ? "Replace image" : "Choose image"}
        </label>
        <input
          accept="image/*"
          aria-describedby={`${id}-help ${id}-error`}
          aria-invalid={Boolean(message)}
          className="sr-only"
          disabled={disabled || preparing}
          id={id}
          onChange={handleSelect}
          type="file"
        />

        {/* With no preview box yet, show the progress here. */}
        {preparing && !shownUrl && (
          <span className="text-sm font-semibold text-roya-ink">Preparing image…</span>
        )}

        {newPreviewUrl && (
          <button
            className="rounded-md px-3 py-2 text-sm font-semibold text-roya-slate hover:bg-roya-slate/10 disabled:opacity-50"
            disabled={disabled || preparing}
            onClick={() => onFileChange(null)}
            type="button"
          >
            Undo new image
          </button>
        )}
      </div>

      <p className="mt-1 text-xs text-roya-slate" id={`${id}-help`}>
        Any photo works: it is cropped to {COVER_WIDTH}×{COVER_HEIGHT} from the centre and saved as WebP.
      </p>

      {message && (
        <p aria-live="polite" className="mt-1 text-sm text-red-600" id={`${id}-error`}>
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * Reads a file as a data URL for the preview. A data URL needs no cleanup,
 * unlike URL.createObjectURL, which must be revoked to free memory.
 * @param file The prepared cover.
 * @returns The data URL.
 */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve: (url: string) => void, reject: (error: unknown) => void) => {
    const reader: FileReader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
