import { Suspense } from "react";
import { SignUpForm } from "./SignUpForm";

export default function SignUpPage() {
  return (
    <div className="ps-shell">
      <div className="ps-container" style={{ maxWidth: 420 }}>
        <div className="ps-header">
          <div>
            <div className="ps-title">create account</div>
            <div className="ps-subtitle">Club 943 Pick&apos;em</div>
          </div>
        </div>
        <Suspense>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
