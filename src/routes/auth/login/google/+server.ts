import { redirect } from "@sveltejs/kit";

export const GET = async ({ locals: { supabase }, url }) => {
  let redirectedUrl =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    url.origin;
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectedUrl + "/auth/callback",
    },
  });

  if (data.url) {
    redirect(307, data.url);
  }

  redirect(307, "/auth/error");
};
