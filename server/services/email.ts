import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  await resend.emails.send({
    from: options.from || process.env.EMAIL_FROM || "no-reply@example.com",
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export function passwordResetEmail({ url }: { url: string }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h2>Password reset</h2>
      <p>We received a request to reset your password. Click the button below to set a new one. This link expires in 30 minutes.</p>
      <p><a href="${url}" style="display:inline-block;padding:12px 18px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;">Reset password</a></p>
      <p>If you didn't request this, you can ignore this email.</p>
    </div>
  `;
}

export function magicLinkEmail({ url }: { url: string }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h2>Sign in</h2>
      <p>Click the button below to sign in. This link expires in 15 minutes.</p>
      <p><a href="${url}" style="display:inline-block;padding:12px 18px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;">Sign in</a></p>
    </div>
  `;
}

export function invitationEmail({ url, inviterName }: { url: string; inviterName?: string }) {
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
      <h2>You've been invited!</h2>
      <p>${inviterName ? `${inviterName} has invited you` : "You've been invited"} to join the platform. Click the button below to set up your password and activate your account.</p>
      <p>This invitation link expires in 7 days.</p>
      <p><a href="${url}" style="display:inline-block;padding:12px 18px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;">Set up your account</a></p>
      <p style="color:#64748b;font-size:14px;margin-top:24px;">If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
  `;
}
