export interface AuthUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: "admin" | "user";
  readonly workType: "services" | "sales" | "hybrid";
  readonly createdAt: string;
}

export interface LoginResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: AuthUser;
}

export interface WhatsAppOAuthInit {
  readonly state: string;
}

export interface IAuthService {
  login(email: string, password: string): Promise<LoginResponse>;
  logout(): Promise<void>;
  getSession(): Promise<AuthUser | null>;
  initWhatsAppOAuth(): Promise<WhatsAppOAuthInit>;
}
