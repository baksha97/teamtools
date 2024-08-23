import type { LayoutServerLoad } from "./$types";
import { getOrCreateUserProfile } from "$lib/auth";

export const load: LayoutServerLoad = async ({ locals }) => {
  const profile = await getOrCreateUserProfile(locals);
  return {
    profile: profile,
    session: locals.session,
  };
};
