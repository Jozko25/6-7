import { redirect } from "next/navigation";
import { headers } from "next/headers";

interface VerifyMagicPageProps {
  searchParams: { token?: string; email?: string };
}

export default async function VerifyMagicPage({ searchParams }: VerifyMagicPageProps) {
  const token = searchParams.token;
  const email = searchParams.email;

  const h = await headers();
  const forwardedProto = h.get("x-forwarded-proto");
  const forwardedHost = h.get("x-forwarded-host");
  const host = forwardedHost ?? h.get("host");
  const baseUrl =
    (forwardedProto && host && `${forwardedProto}://${host}`) ||
    (process.env.NEXTAUTH_URL ?? "");

  console.info("[magic-verify-page]", {
    hasToken: !!token,
    hasEmail: !!email,
    forwardedProto,
    forwardedHost,
    host,
    baseUrl,
  });

  if (!token || !email) {
    redirect("/auth/error");
  }

  const query = new URLSearchParams({ token, email }).toString();
  if (baseUrl) {
    redirect(`${baseUrl.replace(/\/+$/, "")}/api/auth/magic/verify?${query}`);
  }
  redirect(`/api/auth/magic/verify?${query}`);
}
