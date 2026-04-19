type Props = {
  values: number[];
  used: Set<number>;
};

export function ConfidencePool({ values, used }: Props) {
  if (values.length === 0) return null;
  return (
    <div className="ps-confidence-pool">
      {values.map((n) => (
        <div
          key={n}
          className={`ps-conf-chip${used.has(n) ? " used" : ""}`}
        >
          {n}
        </div>
      ))}
    </div>
  );
}
