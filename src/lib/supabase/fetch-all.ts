import type { PostgrestError } from "@supabase/supabase-js";

/**
 * PostgREST caps every response at `max_rows` (supabase/config.toml, and the
 * hosted default) — 1000. A query past that comes back truncated with no
 * error, so anything that can return more than 1000 rows must page.
 *
 * Keep this equal to `max_rows`: a page shorter than PAGE_SIZE is how
 * fetchAll knows it reached the end. If max_rows is ever lowered below this,
 * every page would look "short" and fetchAll would stop after the first one.
 */
export const PAGE_SIZE = 1000;

/** The slice of a supabase-js select builder fetchAll needs. */
interface PageableQuery<T> extends PromiseLike<{ data: T[] | null; error: PostgrestError | null }> {
  order(column: string, options?: { ascending?: boolean }): PageableQuery<T>;
  range(from: number, to: number): PageableQuery<T>;
}

/**
 * Run a select to completion, `PAGE_SIZE` rows at a time, until a short page
 * comes back. `build` must return a fresh builder on every call (builders are
 * mutable, so one can't be re-ranged and re-awaited).
 *
 *   const { data, error } = await fetchAll(() =>
 *     supabase.from("picks").select("user_id, game_id").eq("league_id", id),
 *   );
 *
 * Rows are ordered by `orderBy` (default `id`, the PK on every table this is
 * used for), appended after any `.order()` the builder already has, so the
 * overall order is total and pages neither overlap nor skip rows. Any page
 * failing fails the whole fetch — a partial result is exactly the silent
 * truncation this exists to prevent.
 */
export async function fetchAll<T>(
  build: () => PageableQuery<T>,
  { orderBy = "id" }: { orderBy?: string } = {},
): Promise<{ data: T[] | null; error: PostgrestError | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await build()
      .order(orderBy, { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) return { data: null, error };
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return { data: rows, error: null };
  }
}
