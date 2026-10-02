

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 bg-base-100 rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-3">Privacy Policy</h1>
      <p className="mb-4 text-sm text-gray-500">
        Last updated: October 2, 2026
      </p>

      <p className="mb-4">
        This Privacy Policy explains how League of Legends România
        (LOLRO) processes personal data when you use its Discord
        verification service and related web portal.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        1. Data controller
      </h2>
      <p className="mb-4">
        The service is operated by <strong>oppolymorph</strong>,
        associated with the League of Legends România (LOLRO)
        Discord community.
      </p>
      <p className="mb-4">
        Contact:{" "}
        <a href="mailto:leagueoflegendsromania@proton.me"
          className="underline">
          leagueoflegendsromania@proton.me
        </a>
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        2. Purpose of processing
      </h2>
      <p className="mb-4">
        We process personal data to operate a verification system
        that protects the community from alternate accounts,
        ban evasion, and other forms of abuse.
      </p>
      <p className="mb-4">
        The system assesses account and browser-related signals
        to identify possible relationships between accounts.
        These assessments support verification decisions and
        moderation.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        3. Personal data we process
      </h2>
      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>
          <strong>Discord account information:</strong> Discord
          user ID, username, display name, account creation time,
          verification status, ban status, and relevant security
          or account indicators provided through Discord.
        </li>
        <li>
          <strong>Email identifier:</strong> A keyed or
          cryptographic hash derived from your email address,
          used to identify email addresses shared across accounts.
          The raw email address is not retained in the anti-alt
          database if it is not needed for another purpose.
        </li>
        <li>
          <strong>IP address:</strong> Your IP address, associated
          with your Discord account for detecting account
          relationships and suspicious activity.
        </li>
        <li>
          <strong>Browser and device signals:</strong> Selected
          browser and device characteristics used to generate
          fingerprint hashes. After hashing, the system retains
          hashes and availability indicators rather than the
          original normalized values.
        </li>
        <li>
          <strong>Correlation data:</strong> Matching signals,
          relationships between accounts, comparison results,
          and related account identifiers.
        </li>
        <li>
          <strong>Risk assessments:</strong> Scores, risk levels,
          evidence summaries, related accounts, and recommended
          verification actions.
        </li>
        <li>
          <strong>Session data:</strong> Session identifiers and
          information required to maintain your login and
          verification session.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        4. Legal basis
      </h2>
      <p className="mb-4">
        Our intended legal basis for anti-abuse and verification
        processing is legitimate interests under Article 6(1)(f)
        GDPR. Our interests include protecting the community,
        preventing ban evasion, and maintaining reliable access
        verification.
      </p>
      <p className="mb-4">
        We seek to limit processing to information relevant to
        those purposes and apply retention limits. You may object
        to processing based on legitimate interests, subject to
        the conditions and exceptions provided by the GDPR.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        5. Automated analysis and verification
      </h2>
      <p className="mb-4">
        The system compares fingerprint hashes, IP associations,
        email identifiers, and relevant Discord account
        indicators. It uses these signals to calculate risk
        assessments and determine whether verification can
        proceed, requires additional checks, or should be
        referred for moderation.
      </p>
      <p className="mb-4">
        Depending on the result, an account may be verified,
        required to undergo additional verification, referred
        for manual review, or denied verification. These
        outcomes can affect access to channels that require
        verification.
      </p>
      <p className="mb-4">
        You may contact us to request information about an
        assessment or raise concerns about a verification
        outcome.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        6. Retention
      </h2>
      <p className="mb-4">
        We apply defined retention periods to the data used
        by the anti-alt system:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>
          <strong>IP observations:</strong> Up to 90 days,
          measured from the first observation.
        </li>
        <li>
          <strong>Fingerprint observations:</strong> Up to
          3 years.
        </li>
        <li>
          <strong>Fingerprint relationships:</strong> Up to
          3 years, measured from their first detection.
        </li>
        <li>
          <strong>Risk assessments:</strong> Up to 3 years.
        </li>
        <li>
          <strong>Account records:</strong> Retained while
          necessary for the relevant verification and
          account-management purposes, subject to applicable
          deletion requests and other retention requirements.
        </li>
      </ul>
      <p className="mb-4">
        Expired records are removed through scheduled cleanup
        processes. Account records used only as references
        for the anti-alt system are removed when no longer
        referenced by retained data.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        7. Data sharing
      </h2>
      <p className="mb-4">
        We use Discord and relevant infrastructure providers
        to operate the service. Data may be processed by
        service providers where necessary to provide hosting,
        authentication, database, or related technical
        services.
      </p>
      <p className="mb-4">
        Relevant verification findings and account associations
        may be made available to authorized community moderators
        for moderation and abuse-prevention purposes.
      </p>
      <p className="mb-4">
        We do not sell personal data. We may disclose data
        where required by applicable law.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        8. Your rights
      </h2>
      <p className="mb-4">
        Depending on the circumstances and applicable GDPR
        conditions, you may have the right to:
      </p>
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>Access your personal data.</li>
        <li>Correct inaccurate or incomplete data.</li>
        <li>Request erasure of your personal data.</li>
        <li>Request restriction of processing.</li>
        <li>Object to processing based on legitimate interests.</li>
        <li>Receive portable data where the right applies.</li>
        <li>
          Lodge a complaint with a competent supervisory
          authority.
        </li>
      </ul>
      <p className="mb-4">
        To exercise your rights, contact us using the details
        below. We may need to verify your identity before
        processing a request.
      </p>
      <p className="mb-4">
        We handle requests without undue delay and within
        the time limits required by the GDPR. Where erasure
        applies, we remove the associated verification and
        anti-alt data. As a consequence, the associated
        verification state may also end, and you may need
        to verify again to regain access to verification-gated
        channels.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        9. Cookies and sessions
      </h2>
      <p className="mb-4">
        The web portal uses session cookies to maintain
        authentication and verification sessions. These
        cookies are used for the operation and security
        of the service.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        10. Security
      </h2>
      <p className="mb-4">
        We use technical and organizational measures
        intended to protect personal data against
        unauthorized access, loss, alteration, or disclosure.
        Access to stored information is restricted to
        processes and individuals that require it for
        service operation and administration.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        11. International processing
      </h2>
      <p className="mb-4">
        Discord and infrastructure providers may process
        data in locations outside your country or the
        European Economic Area. Where applicable, transfers
        are subject to the safeguards required by data
        protection law.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        12. Contact and complaints
      </h2>
      <p className="mb-4">
        For privacy questions or requests:
        <br />
        <strong>Email:</strong>{" "}
        <a href="mailto:leagueoflegendsromania@proton.me"
          className="underline">
          leagueoflegendsromania@proton.me
        </a>
        <br />
        <strong>Discord:</strong>{" "}
        <a href="https://discord.gg/lolro"
          target="_blank"
          rel="noreferrer"
          className="underline">
          discord.gg/lolro
        </a>
      </p>
      <p className="mb-4">
        You may also lodge a complaint with the competent
        data protection supervisory authority.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        13. Changes to this policy
      </h2>
      <p className="mb-4">
        We may update this policy when our processing
        activities or legal requirements change. The
        updated version will be published on this page.
      </p>
    </div>
  );
};

export default PrivacyPolicy;