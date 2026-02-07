import { randomBytes, createHmac } from "crypto";
import { cookies } from "next/headers";

const CSRF_SECRET = process.env.NEXTAUTH_SECRET || "fallback-csrf-secret";
const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generate a CSRF token with timestamp for expiry validation
 */
export function generateCSRFToken(): string {
  const timestamp = Date.now().toString();
  const randomPart = randomBytes(16).toString("hex");
  const data = `${timestamp}.${randomPart}`;
  const signature = createHmac("sha256", CSRF_SECRET).update(data).digest("hex");
  return `${data}.${signature}`;
}

/**
 * Validate a CSRF token
 * @param token - The token to validate
 * @param maxAge - Maximum age in milliseconds (default: 1 hour)
 */
export function validateCSRFToken(token: string, maxAge: number = 3600000): boolean {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [timestamp, randomPart, signature] = parts;
  const data = `${timestamp}.${randomPart}`;

  // Verify signature
  const expectedSignature = createHmac("sha256", CSRF_SECRET).update(data).digest("hex");
  if (signature !== expectedSignature) return false;

  // Check expiry
  const tokenTime = parseInt(timestamp, 10);
  if (isNaN(tokenTime) || Date.now() - tokenTime > maxAge) return false;

  return true;
}

/**
 * Set CSRF token in cookie (for use in API routes)
 */
export async function setCSRFCookie(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 3600, // 1 hour
  });

  return token;
}

/**
 * Get CSRF token from cookie
 */
export async function getCSRFFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Validate CSRF from request (checks header against cookie)
 */
export async function validateCSRFFromRequest(request: Request): Promise<boolean> {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = await getCSRFFromCookie();

  if (!headerToken || !cookieToken) return false;
  if (headerToken !== cookieToken) return false;

  return validateCSRFToken(cookieToken);
}
