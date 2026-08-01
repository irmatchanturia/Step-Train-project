export interface ProfileUserDetails {
  phoneNumber: string | null;
  address: string | null;
  dob: string | null;
  pictureUrl: string | null;
}

export interface ProfileUser {
  id: number;
  email: string;
  lastName: string;
  firstName: string;
  details: ProfileUserDetails | null;
}

export interface ProfileResponse {
  data: ProfileUser;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  pictureUrl: string | null;
  dateOfBirth: string | null;
}
