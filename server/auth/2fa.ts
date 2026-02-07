import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

export function generateTOTPSecret(email: string) {
  const totp = new OTPAuth.TOTP({
    issuer: "CarCompany",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });

  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  };
}

export async function generateQRCode(uri: string): Promise<string> {
  return await QRCode.toDataURL(uri);
}

export function verify2FAToken(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });

  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}
