import { getOrCreateUserProfile } from "$lib/auth";
import { db } from "$lib/db/index.js";
import { profileTable } from "$lib/db/schema.js";
import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { zfd } from "zod-form-data";

export const load = async ({ locals }) => {
  const profile = await getOrCreateUserProfile(locals);
  console.log("[routes/+page.server.ts::load] profile", profile);
  return {
    profile,
  };
};

export const actions = {
  default: async ({ request, locals }) => {
    const profile = await getOrCreateUserProfile(locals);

    if (!profile) {
      error(401, "You need to be logged in!");
    }

    const schema = zfd.formData({
      firstName: zfd.text(),
      lastName: zfd.text(),
      email: zfd.text(),
    });

    const { data } = schema.safeParse(await request.formData());

    if (!data) {
      error(400, "Invalid form data");
    }

    await db.update(profileTable).set({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    }).where(eq(profileTable.id, profile.id));

    return { success: true };
  },
};
