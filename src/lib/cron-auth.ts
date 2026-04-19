/**
 * Shared helper for `/api/cron/*` routes. Vercel Cron sends a bearer token
 * equal to `CRON_SECRET`.
 */
export function authorizeCron(req: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  const header = req.headers.get("authorization");
  if (header !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
