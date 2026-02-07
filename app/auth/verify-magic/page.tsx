import { redirect } from "next/navigation";

interface VerifyMagicPageProps {
  searchParams: { token?: string; email?: string };
}

export default function VerifyMagicPage({ searchParams }: VerifyMagicPageProps) {
  const token = searchParams.token;
  const email = searchParams.email;

  console.info("[magic-verify-page]", {
    hasToken: !!token,
    hasEmail: !!email,
  });

  if (!token || !email) {
    redirect("/auth/error");
  }

  const query = new URLSearchParams({ token, email }).toString();
  redirect(`/api/auth/magic/verify?${query}`);
}
