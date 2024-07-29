import {
  createBrowserClient,
  createServerClient,
  isBrowser,
  parse,
} from "@supabase/ssr";

import {
  PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_SUPABASE_URL,
} from "$env/static/public";

import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ parent, data }) => {
  const parentdata = await parent();
  // console.log("[/routes/apps/poker/rooms/[roomId]/+layout.ts] parentdata", parentdata);
  // console.log("[/routes/apps/poker/rooms/[roomId]/+layout.ts] data", data);
  return { 
      // ...data,
      ...parentdata
  };
};
