import { JoinLeagueForm } from "./JoinLeagueForm";

export default function JoinLeaguePage() {
  return (
    <div className="ps-shell">
      <div className="ps-container" style={{ maxWidth: 420 }}>
        <div className="ps-header">
          <div>
            <div className="ps-title">join league</div>
            <div className="ps-subtitle">enter a 6-character invite code</div>
          </div>
        </div>
        <JoinLeagueForm />
      </div>
    </div>
  );
}
