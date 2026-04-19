"use client";

import { useState } from "react";

export type AdminMember = {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string;
  is_paid: boolean;
  is_commissioner: boolean;
};

export function AdminMembersList({
  leagueId: _leagueId,
  initialMembers,
}: {
  leagueId: string;
  initialMembers: AdminMember[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [busy, setBusy] = useState<string | null>(null);

  async function togglePaid(m: AdminMember) {
    setBusy(m.id);
    const res = await fetch(`/api/admin/members/${m.id}/paid`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_paid: !m.is_paid }),
    });
    setBusy(null);
    if (!res.ok) return;
    setMembers((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, is_paid: !m.is_paid } : x)),
    );
  }

  return (
    <div className="ps-league-list">
      {members.map((m) => (
        <div key={m.id} className="ps-league-card">
          <div>
            <div className="ps-league-name">
              {m.display_name || m.email}
              {m.is_commissioner && (
                <span className="ps-paid-badge" style={{ marginLeft: 8 }}>
                  commissioner
                </span>
              )}
            </div>
            <div className="ps-league-meta">{m.email}</div>
          </div>
          <button
            type="button"
            className={`ps-pick-btn${m.is_paid ? " selected" : ""}`}
            disabled={busy === m.id}
            onClick={() => togglePaid(m)}
          >
            {m.is_paid ? "$ paid" : "unpaid"}
          </button>
        </div>
      ))}
    </div>
  );
}
