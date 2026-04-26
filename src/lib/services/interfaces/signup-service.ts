export interface SignupBeginPayload {
  readonly email: string;
}

export interface SignupBeginResponse {
  readonly email: string;
}

export interface ISignupService {
  begin(payload: SignupBeginPayload): Promise<SignupBeginResponse>;
}
