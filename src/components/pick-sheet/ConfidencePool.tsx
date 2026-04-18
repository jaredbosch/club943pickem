import { confidenceValues, usedConfidence } from "./week7-data";

export function ConfidencePool() {
  return (
    <>
      <div className="ps-section-label">confidence points available</div>
      <div className="ps-confidence-pool">
        {confidenceValues.map((n) => (
          <div
            key={n}
            className={`ps-conf-chip${usedConfidence.has(n) ? " used" : ""}`}
          >
            {n}
          </div>
        ))}
      </div>
    </>
  );
}
