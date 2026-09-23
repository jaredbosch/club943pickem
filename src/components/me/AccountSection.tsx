import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SignOutButton } from "@/components/ui/SignOutButton";

/** Settings · Theme · Help · Sign out (always last). Used on ME and /home. */
export function AccountSection() {
  return (
    <section className="me-section" aria-labelledby="me-account-title">
      <h2 id="me-account-title" className="me-section-title">Account</h2>
      <ul className="me-rows">
        <li>
          <Link href="/settings" className="me-row">
            <span className="me-row-label">Settings</span>
            <span className="me-row-arrow" aria-hidden>→</span>
          </Link>
        </li>
        <li className="me-row me-row-static">
          <span className="me-row-label">Theme</span>
          <ThemeToggle />
        </li>
        <li>
          <Link href="/support" className="me-row">
            <span className="me-row-label">Help</span>
            <span className="me-row-arrow" aria-hidden>→</span>
          </Link>
        </li>
        <li className="me-row me-row-static">
          <span className="me-row-label">Sign out</span>
          <SignOutButton />
        </li>
      </ul>
    </section>
  );
}
