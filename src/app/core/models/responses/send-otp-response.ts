export interface SendOtpResponse {

  expiresInSeconds: number;

  resendAfterSeconds: number;

  debugCode?: string | null;

}