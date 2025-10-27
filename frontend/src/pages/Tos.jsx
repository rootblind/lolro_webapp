import { Link } from "react-router"

export default function Tos() {
  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 bg-base-100 rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6 text-center">Terms of Service</h1>
      <p className="mb-6">
        By accessing or using this webapp, you agree to the following Terms of Service. Please read carefully. For details on how we handle your data, see our{" "}
        <Link to="/privacy" className="text-blue-600 underline">
          Privacy Policy
        </Link>.
      </p>

      {/* Accordion Sections */}
      <div className="space-y-4">
        <div tabIndex={0} className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            1. Eligibility
          </div>
          <div className="collapse-content">
            <p>
              To access the full features of this webapp, you must log in via Discord OAuth. Only verified users who are not banned from our Discord server may access the full content.
            </p>
          </div>
        </div>

        <div tabIndex={0} className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            2. User Accounts
          </div>
          <div className="collapse-content">
            <p>
              You are responsible for your account and Discord login. Notify us immediately if your account is compromised.
              <br />We reserve the right to suspend or terminate accounts for violations.
            </p>
          </div>
        </div>

        <div tabIndex={0} className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            3. Acceptable Use
          </div>
          <div className="collapse-content">
            <p>
              Do not engage in illegal, harmful, or disruptive activities. 
              Harassment, spamming, cheating, or bypassing anti-alt verification is prohibited.
              <br />Violations may result in permanent bans.
            </p>
          </div>
        </div>

        <div tabIndex={0} className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            4. Privacy
          </div>
          <div className="collapse-content">
            <p>
              We collect limited information via Discord OAuth for verification purposes.
              <br />We do not share your personal data beyond what is necessary to enforce these Terms.
              <br />See our Privacy Policy for full details.
            </p>
          </div>
        </div>

        <div tabIndex={0} className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            5. Termination
          </div>
          <div className="collapse-content">
            <p>
              We may suspend or terminate your access at our discretion, including violations of these Terms or Discord bans. You may also stop using the webapp at any time.
            </p>
          </div>
        </div>

        <div tabIndex={0} className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            6. Disclaimers
          </div>
          <div className="collapse-content">
            <p>
              The webapp is provided "as-is." We are not responsible for data loss, technical issues, or other damages resulting from your use.
            </p>
          </div>
        </div>

        <div tabIndex={0} className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            7. Changes to Terms
          </div>
          <div className="collapse-content">
            <p>
              We may update these Terms at any time. Updated Terms will be posted on this page. Continued use constitutes acceptance of the new Terms.
            </p>
          </div>
        </div>

        <div tabIndex={0} className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            8. Contact
          </div>
          <div className="collapse-content">
            <p>
              Questions about these Terms can be directed via our Discord server.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-500 text-center">
        Last updated: October 27, 2025
      </p>
    </div>
  );
}
