import type { ConfidenceUsage } from "./types";

type Props = {
  values: number[];
  usage: Map<number, ConfidenceUsage>;
};

export function ConfidencePool({ values, usage }: Props) {
  if (values.length === 0) return null;
  return (
    <div className="ps-confidence-pool">
      {values.map((n) => {
        const u = usage.get(n);
        const cls = [
          "ps-conf-chip",
          u ? "used" : "free",
          u?.locked ? "locked" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <div key={n} className={cls} title={u ? `used by ${u.gameLabel}` : "available"}>
            <span className="ps-conf-chip-n">{n}</span>
            {u && <span className="ps-conf-chip-tag">{u.gameLabel}</span>}
          </div>
        );
      })}
    </div>
  );
}
