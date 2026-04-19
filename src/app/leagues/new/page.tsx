import { NewLeagueForm } from "./NewLeagueForm";

export default function NewLeaguePage() {
  return (
    <div className="ps-shell">
      <div className="ps-container" style={{ maxWidth: 520 }}>
        <div className="ps-header">
          <div>
            <div className="ps-title">create league</div>
            <div className="ps-subtitle">commissioner sets the rules</div>
          </div>
        </div>
        <NewLeagueForm />
      </div>
    </div>
  );
}
