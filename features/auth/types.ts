export type SignupRequest = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  password: string;
  confirmPassword: string;
};

export type SignupResponse = {
  success: boolean;
  message: string;
};
