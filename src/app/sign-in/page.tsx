import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export default function SignInPage() {
  return (
    <div className="ps-shell">
      <div className="ps-container" style={{ maxWidth: 420 }}>
        <div className="ps-header">
          <div>
            <div className="ps-title">sign in</div>
            <div className="ps-subtitle">Club 943 Pick&apos;em</div>
          </div>
        </div>
        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
