const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 bg-base-100 rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-3">Privacy Policy</h1>
      <p className="mb-4 text-sm text-gray-500">Last updated: 27.10.2025</p>

      <p className="mb-4">
        <strong>League of Legends România</strong>(LOLRO) 
        ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy
        explains what personal data we collect when you interact with our Discord
        bot and web portal, how we use that data, our legal bases for processing
        it, how long we keep it, and the rights available to you under the GDPR.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Who we are</h2>
      <p className="mb-4">
        This service (LOLRO) is
        operated by <strong>oppolymorph</strong> on Discord.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Scope of this policy</h2>
      <p className="mb-4">
        This policy applies to:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>The opjustice bot and verification service.</li>
        <li>The LOLRO web portal (verification UI and admin tools).</li>
        <li>Any related services provided by our operator (e.g. hosted APIs).</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Personal data we collect</h2>
      <p className="mb-4">
        Depending on how you interact with our service, we may collect the
        following personal data:
      </p>

      <ul className="list-disc list-inside mb-4">
        <li>
          <strong>Discord data</strong> — Discord user ID (collected when you
          click the verification or OAuth link), username, and other profile
          fields if requested/scoped by OAuth.
        </li>
        <li>
          <strong>IP address</strong> — collected when you initiate verification
          or interact with the web portal; linked to your Discord ID for
          detection of alt accounts / fraud prevention.
        </li>
        <li>
          <strong>Browser / device data</strong> — user agent, browser
          attributes and derived device integrity signals; these may be cached
          briefly to assist anti‑abuse checks.
        </li>
        <li>
          <strong>Cookies & session identifiers</strong> — a session cookie may
          be set to link your browser session to your Discord verification
          attempt.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">How we use your data</h2>
      <p className="mb-4">
        We use the data we collect for the following purposes:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>Detecting alternate / fraudulent accounts and preventing ban evasion.</li>
        <li>Supporting community moderation and enforcement of server rules.</li>
        <li>Linking a browser session to a Discord account for verification.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Legal basis for processing</h2>
      <p className="mb-4">
        Our primary legal basis for processing the data described above is
        <strong> legitimate interests</strong> (Article 6(1)(f) GDPR): protecting
        community integrity, preventing abuse, and maintaining reliable
        verification. We balance these interests against your privacy rights and
        apply technical and organisational safeguards to minimise impact.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Data sharing during verification</h2>
      <p className="mb-4">
        When a verification attempt indicates a match or association with other
        flagged accounts, the system will send a secure log message to the
        relevant Discord server (via the Discord API) to inform server
        moderators. That message includes Discord usernames and user IDs of the
        account attempting verification and the associated account(s). This is
        only shared with the server where the verification occurred and is used
        solely to assist moderation and abuse prevention.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Retention</h2>
      <p className="mb-4">
        We retain data necessary to detect abuse until you request deletion. 
        After deletion, a non-reversible hashed identifier may be kept solely to prevent repeated abuse.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Security and encryption</h2>
      <p className="mb-4">
        We take technical and organisational measures to protect personal data.
        All personal data processed by our automated systems is encrypted in
        transit and at rest (e.g., AES‑128 CBC or stronger). Access to raw
        personal data is restricted to authorised system processes; no human
        operator has routine access to unencrypted personal identifiers.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Cookies, tracking & fingerprinting</h2>
      <p className="mb-4">
        We use essential cookies to maintain sessions required for verification.
        <br />Non‑essential cookies and device fingerprinting are used to strengthen
        anti‑alt detection.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Automated decision‑making</h2>
      <p className="mb-4">
        Our system performs automated analyses to detect likely alternate or
        abusive accounts and generate verification results. These automated
        processes are intended to assist moderators; they do automatically
        take moderation actions based on scoring alternate detection.
        <br />Users may be flagged as alternate accounts, resulting in a permnanent ban, 
        be flagged as potential alternate and require manual human verification or be successfully verified and given full access 
        to our services.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Your rights</h2>
      <p className="mb-4">
        Under the GDPR you have rights including:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>The right to access personal data we hold about you.</li>
        <li>The right to request rectification of inaccurate data.</li>
        <li>The right to request erasure of your personal data (subject to lawful
          grounds for retaining limited anonymised or hashed identifiers to
          prevent ban evasion).</li>
        <li>The right to object to processing based on legitimate interests.</li>
        <li>The right to withdraw consent where processing is based on consent.</li>
        <li>The right to lodge a complaint with your local Data Protection Authority.</li>
      </ul>

      <p className="mb-4">
        To exercise any of these rights, contact us using the details below. If
        you request deletion, we will remove personal data such as usernames and
        profiles but may retain a non-reversible hashed identifier solely for
        the purpose of preventing banned users from rejoining and detecting alt
        accounts.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Data processors and third parties</h2>
      <p className="mb-4">
        We do not sell your personal data. We may share data with trusted
        service providers (e.g., hosting providers) who
        process data on our behalf under contract. We may disclose data where
        required by law or to respond to lawful requests by public authorities.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Contact & complaints</h2>
      <p className="mb-4">
        If you have questions or wish to exercise your rights, contact:
      </p>
      <p className="mb-4">
        <strong>Email:</strong> <a href="mailto:leagueoflegendsromania@proton.me" className="underline">leagueoflegendsromania@proton.me</a>
        <br />
        <strong>
          Our Discord server:
          <a href="http://discord.gg/lolro" target="_blank" className="underline">
            discord.gg/lolro
          </a>
        </strong>
        <br />
        <strong>Discord:</strong> <strong>oppolymorph</strong> (operator's account)
        
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Changes to this policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy to reflect changes in our services or
        legal requirements. When we make significant changes we will update the
        "Last updated" date at the top of this page and notify users as
        appropriate.
      </p>
    </div>
  );
};

export default PrivacyPolicy;
