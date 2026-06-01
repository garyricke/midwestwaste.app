import { supabaseAdmin } from "./supabase";
import type { DumpsterSize } from "./types";

/** Active dumpster sizes, cheapest first. Server-side only. */
export async function getDumpsterSizes(): Promise<DumpsterSize[]> {
  const { data, error } = await supabaseAdmin
    .from("dumpster_sizes")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to load dumpster sizes: ${error.message}`);
  return (data ?? []) as DumpsterSize[];
}

export async function getDumpsterSize(size: string): Promise<DumpsterSize | null> {
  const { data, error } = await supabaseAdmin
    .from("dumpster_sizes")
    .select("*")
    .eq("size", size)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(`Failed to load dumpster size: ${error.message}`);
  return (data as DumpsterSize) ?? null;
}
