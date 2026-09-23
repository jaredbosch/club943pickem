import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNavData } from "@/lib/nav-data";
import { AppHeader } from "@/components/nav/AppHeader";
import { AccountSection } from "@/components/me/AccountSection";

export default async function MePage({ params }: { params: { code: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const code = params.code.toUpperCase();

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, season_year")
    .eq("invite_code", code)
    .maybeSingle();
  if (!league) notFound();

  // Deduplicated with the layout's call (React cache).
  const nav = await getNavData(code);
  if (!nav?.leagues.some((l) => l.code === code)) redirect("/league");

  // Same season row the profile and dashboard pages read.
  const [{ data: seasonRow }, { count: totalPlayers }] = await Promise.all([
    supabase
      .from("standings")
      .select("total_points, rank")
      .eq("user_id", user.id)
      .eq("league_id", league.id)
      .eq("season_year", league.season_year)
      .eq("week", 0)
      .maybeSingle(),
    supabase
      .from("league_members")
      .select("*", { count: "exact", head: true })
      .eq("league_id", league.id),
  ]);

  return (
    <div className="me-shell pp-gridbg">
      <AppHeader />

      <main className="me-main">
        <section className="me-hero" aria-labelledby="me-name">
          <div className="tag">{league.name} · {league.season_year}</div>
          <h1 id="me-name" className="me-name">{nav.displayName}</h1>
          {seasonRow ? (
            <dl className="me-stats">
              <div className="me-stat">
                <dt className="tag">Rank</dt>
                <dd className="me-stat-val">
                  #{seasonRow.rank ?? "—"}
                  {totalPlayers ? <span className="me-stat-of"> of {totalPlayers}</span> : null}
                </dd>
              </div>
              <div className="me-stat">
                <dt className="tag">Points</dt>
                <dd className="me-stat-val me-stat-glow">{seasonRow.total_points}</dd>
              </div>
            </dl>
          ) : (
            <p className="me-muted">Season standings post after the first week is graded.</p>
          )}
          <Link href={`/league/${code}/picks/${user.id}`} className="me-row me-row-cta">
            <span className="me-row-label">My pick history</span>
            <span className="me-row-arrow" aria-hidden>→</span>
          </Link>
        </section>

        <section className="me-section" aria-labelledby="me-leagues-title">
          <h2 id="me-leagues-title" className="me-section-title">My leagues</h2>
          <ul className="me-rows">
            {nav.leagues.map((l) => {
              const isCurrent = l.code === code;
              return (
                <li key={l.code}>
                  <Link
                    href={`/league/${l.code}/me`}
                    className={`me-row${isCurrent ? " current" : ""}`}
                    aria-current={isCurrent ? "true" : undefined}
                  >
                    <span className="me-row-label">{l.name}</span>
                    <span className="me-row-meta">
                      {l.is_commissioner && <span className="pp-chip">Commissioner</span>}
                      <span className="me-row-year">{l.season_year}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link href="/league" className="me-row">
                <span className="me-row-label me-row-accent">+ Create or join a league</span>
              </Link>
            </li>
          </ul>
        </section>

        <AccountSection />
      </main>
    </div>
  );
}
