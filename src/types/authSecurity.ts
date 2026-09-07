export interface AppUserSession {
  isAuthenticated: boolean;
  userEmail: string;
  phoneNumber?: string;
  loginMethod: "PASSWORD" | "MOBILE_OTP" | "BIOMETRIC";
  sessionExpiresAt: number;
  token: string;
}

export interface SecurityConfig {
  requireAuth: boolean;
  enableOtp: boolean;
  configuredPhone: string;
  configuredEmail: string;
  passcodeHash: string; // SHA-256 or local check
  sessionDurationHours: number;
  allowBiometrics: boolean;
}

export interface BrokerOAuthBrowserState {
  isOpen: boolean;
  broker: "DHAN" | "UPSTOX" | "FYERS" | "ZERODHA" | "ANGEL_ONE";
  currentStep: "ENTER_CREDENTIALS" | "MOBILE_TOTP_VERIFICATION" | "AUTHENTICATED_LIVE";
  authUrl: string;
  brokerUserId?: string;
  brokerMobile?: string;
  brokerPin?: string;
  totpCode?: string;
  accessToken?: string;
  isConnecting: boolean;
  error?: string | null;
}
