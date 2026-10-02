import { Link } from "react-router";

export default function Tos() {
  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 bg-base-100 rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Terms of Service
      </h1>

      <p className="mb-6">
        These Terms govern your use of the LOLRO verification
        web portal and related verification services. By
        using the service, you agree to comply with these
        Terms and the applicable Discord server rules.
        For information about personal data processing,
        see our{" "}
        <Link to="/privacy" className="text-blue-600 underline">
          Privacy Policy
        </Link>.
      </p>

      <div className="space-y-4">
        <div tabIndex={0}
          className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            1. Service and eligibility
          </div>
          <div className="collapse-content">
            <p>
              The service provides account verification for
              the League of Legends România (LOLRO) Discord
              community. You must authenticate through
              Discord and satisfy the applicable server
              membership and verification requirements.
            </p>
            <p>
              Access to channels or features that require
              verification depends on maintaining a valid
              verification state.
            </p>
          </div>
        </div>

        <div tabIndex={0}
          className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            2. Account responsibility
          </div>
          <div className="collapse-content">
            <p>
              You are responsible for maintaining the
              security of your Discord account and for
              activity carried out through it. If you
              believe your account has been compromised,
              take appropriate steps to secure it and
              notify the relevant platform or moderators.
            </p>
          </div>
        </div>

        <div tabIndex={0}
          className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            3. Acceptable use
          </div>
          <div className="collapse-content">
            <p>
              You must not use the service to evade
              moderation decisions, bypass verification,
              impersonate another person, manipulate
              verification signals, or interfere with
              the operation or security of the service.
            </p>
            <p>
              Attempts to circumvent account restrictions,
              create alternate accounts to evade bans,
              or abuse the verification process may result
              in verification denial, additional checks,
              moderation review, or server restrictions.
            </p>
          </div>
        </div>

        <div tabIndex={0}
          className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            4. Verification and access decisions
          </div>
          <div className="collapse-content">
            <p>
              The service analyzes account information,
              browser and device signals, IP associations,
              and other relevant indicators to detect
              possible alternate accounts and abuse.
            </p>
            <p>
              Verification may be granted, denied, or
              referred for additional verification or
              manual review, depending on the result.
              A verification result does not guarantee
              continued access to the Discord community.
            </p>
            <p>
              Moderators may take action under the
              community's rules and applicable moderation
              procedures.
            </p>
          </div>
        </div>

        <div tabIndex={0}
          className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            5. Data deletion and verification status
          </div>
          <div className="collapse-content">
            <p>
              You may request deletion of personal data
              in accordance with the Privacy Policy and
              applicable data protection law.
            </p>
            <p>
              If the data supporting your verification
              is erased, the associated verification
              state may also be removed. You may need
              to complete verification again to regain
              access to channels that require it.
            </p>
          </div>
        </div>

        <div tabIndex={0}
          className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            6. Suspension and termination
          </div>
          <div className="collapse-content">
            <p>
              Access may be restricted or withdrawn
              where required by server rules, security
              requirements, or moderation decisions.
              This may include situations involving
              ban evasion, abuse, or attempts to
              circumvent verification.
            </p>
            <p>
              You may stop using the web portal at
              any time. Stopping use does not
              automatically delete data already
              collected; see the Privacy Policy for
              retention and data-rights information.
            </p>
          </div>
        </div>

        <div tabIndex={0}
          className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            7. Availability and disclaimers
          </div>
          <div className="collapse-content">
            <p>
              The service is provided on an
              as-available basis. We may modify,
              suspend, or discontinue features
              for maintenance, security, or
              operational reasons.
            </p>
            <p>
              Nothing in these Terms excludes
              or limits liability or consumer
              rights where such exclusion or
              limitation is prohibited by
              applicable law.
            </p>
          </div>
        </div>

        <div tabIndex={0}
          className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            8. Changes to these Terms
          </div>
          <div className="collapse-content">
            <p>
              We may update these Terms when
              the service or its requirements
              change. Updated Terms will be
              published on this page. Where
              required, we will provide notice
              or obtain renewed agreement.
            </p>
          </div>
        </div>

        <div tabIndex={0}
          className="collapse collapse-arrow border border-gray-200 rounded-box">
          <div className="collapse-title text-lg font-semibold">
            9. Contact
          </div>
          <div className="collapse-content">
            <p>
              Questions about these Terms can
              be directed to the LOLRO community
              or by email at{" "}
              <a href="mailto:leagueoflegendsromania@proton.me"
                className="underline">
                leagueoflegendsromania@proton.me
              </a>.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-500 text-center">
        Last updated: October 2, 2026
      </p>
    </div>
  );
}