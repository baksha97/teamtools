import { getOrCreateUserProfile } from "$lib/auth";
import { db } from "$lib/db/index.js";
import { profileTable } from "$lib/db/schema.js";
import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { zfd } from "zod-form-data";

export const load = async ({ parent, locals }) => {
  const parentData = await parent();
  console.log("[routes/profile/+page.server.ts] parentData ", parentData);
  return {
    ...parentData,
  };
};

export const actions = {};
