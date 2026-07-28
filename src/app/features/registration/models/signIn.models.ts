export interface signInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  data: SignInResponseData;
  meta: SignInResponseMeta;
}

export interface SignInResponseData {
  accessToken: string;
  refreshToken: string;
}

export interface SignInResponseMeta {
  name: string;
  description: string;
  website: string;
  location: string;
  email: string;
}
