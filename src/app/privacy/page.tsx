import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | thepickempool",
  description: "Privacy policy for thepickempool.com",
};

export default function PrivacyPage() {
  return (
    <div className="legal-shell">
      <header className="legal-header">
        <Link href="/" className="legal-logo">
          <div className="app-nav-badge" style={{ fontSize: 13, padding: "4px 8px" }}>TPP</div>
          <span style={{ fontFamily: "var(--font-disp)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>thepickempool</span>
        </Link>
      </header>

      <main className="legal-body">
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-meta">Last updated: May 15, 2026</p>

        <p className="legal-p">
          thepickempool.com (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the website at thepickempool.com, an NFL ATS confidence pick&apos;em platform for private leagues. This Privacy Policy explains how we collect, use, and share information about you when you use our service.
        </p>

        <h2 className="legal-h2">Information We Collect</h2>

        <h3 className="legal-h3">Account information</h3>
        <p className="legal-p">When you create an account, we collect your email address and any display name you choose. Your email is used solely for authentication and service-related communications.</p>

        <h3 className="legal-h3">Gameplay data</h3>
        <p className="legal-p">We store the picks you submit (team selections and confidence points), your weekly results, standings, and tiebreaker guesses as part of the core service.</p>

        <h3 className="legal-h3">Optional profile information</h3>
        <p className="legal-p">If you choose to provide a phone number or Venmo handle in your league profile, that information is stored and visible to your league commissioner. This is entirely voluntary.</p>

        <h3 className="legal-h3">Usage data</h3>
        <p className="legal-p">We use Google Analytics to understand how the site is used (pages visited, session duration, device type). This data is aggregated and does not identify you personally. See <a className="legal-link" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a> for details on how Google handles this data.</p>

        <h2 className="legal-h2">Advertising</h2>
        <p className="legal-p">
          We use Google AdSense to display advertisements on this site. Google AdSense may use cookies and similar technologies to serve ads based on your prior visits to this and other websites. You can opt out of personalized advertising by visiting <a className="legal-link" href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google&apos;s Ad Settings</a>.
        </p>
        <p className="legal-p">
          For more information about how Google uses data from sites that use its services, visit <a className="legal-link" href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses data when you use our partners&apos; sites or apps</a>.
        </p>

        <h2 className="legal-h2">Affiliate Links</h2>
        <p className="legal-p">
          This site may contain affiliate links to third-party sports betting and fantasy sports platforms. If you click an affiliate link and create an account or make a deposit, we may receive a commission at no additional cost to you. These relationships do not influence our content. Affiliate links are identified where they appear.
        </p>

        <h2 className="legal-h2">Cookies</h2>
        <p className="legal-p">We use the following types of cookies:</p>
        <ul className="legal-ul">
          <li><strong>Authentication cookies</strong> — session tokens managed by Supabase to keep you logged in.</li>
          <li><strong>Analytics cookies</strong> — Google Analytics to understand site usage.</li>
          <li><strong>Advertising cookies</strong> — Google AdSense to deliver and measure ads.</li>
        </ul>
        <p className="legal-p">You can disable cookies in your browser settings, though some features (such as staying logged in) may not function correctly.</p>

        <h2 className="legal-h2">How We Use Your Information</h2>
        <ul className="legal-ul">
          <li>To provide and operate the pick&apos;em pool service</li>
          <li>To calculate standings, scores, and weekly results</li>
          <li>To send account-related emails (e.g., password reset)</li>
          <li>To improve the site through aggregated analytics</li>
          <li>To display relevant advertising</li>
        </ul>

        <h2 className="legal-h2">Data Sharing</h2>
        <p className="legal-p">We do not sell your personal information. We share data only with:</p>
        <ul className="legal-ul">
          <li><strong>Supabase</strong> — our database and authentication provider, located in the United States.</li>
          <li><strong>Google</strong> — for analytics and advertising services.</li>
          <li><strong>Your league commissioner</strong> — your display name, picks, and any profile information you voluntarily provide are visible within your league.</li>
          <li><strong>Other league members</strong> — your picks are visible to other members after games kick off, as part of the core service.</li>
        </ul>

        <h2 className="legal-h2">Data Retention</h2>
        <p className="legal-p">We retain your account and gameplay data for as long as your account is active. Season results are archived and remain accessible through the app. You may request deletion of your account and associated data at any time by contacting us.</p>

        <h2 className="legal-h2">Children&apos;s Privacy</h2>
        <p className="legal-p">thepickempool.com is not directed at children under 18. We do not knowingly collect personal information from minors. Because this service involves NFL football and sports wagering context, users must be 18 or older.</p>

        <h2 className="legal-h2">Your Rights</h2>
        <p className="legal-p">You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at the address below. If you are in the European Economic Area, you may also have additional rights under GDPR.</p>

        <h2 className="legal-h2">Changes to This Policy</h2>
        <p className="legal-p">We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top of this page reflects the most recent changes. Continued use of the service after changes constitutes acceptance of the updated policy.</p>

        <h2 className="legal-h2">Contact</h2>
        <p className="legal-p">
          Questions about this policy? Email us at <a className="legal-link" href="mailto:privacy@thepickempool.com">privacy@thepickempool.com</a>.
        </p>
      </main>

      <footer className="legal-footer">
        <Link href="/" className="legal-link">← Back to thepickempool</Link>
        <span>·</span>
        <span>© {new Date().getFullYear()} thepickempool.com</span>
      </footer>
    </div>
  );
}
