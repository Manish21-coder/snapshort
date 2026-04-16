import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Snapshort",
  description: "How Snapshort collects, uses, and protects your data.",
};

const LAST_UPDATED = "April 17, 2025";
const CONTACT_EMAIL = "raghavmanishprakash@gmail.com";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 pb-2 border-b border-white/10">
        {title}
      </h2>
      <div className="text-gray-400 leading-relaxed space-y-3 text-sm sm:text-base">
        {children}
      </div>
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-blue-400 shrink-0 mt-1">•</span>
      <span>{children}</span>
    </li>
  );
}

export default function PrivacyPage() {
  return (
    <main className="text-white relative min-h-screen">
      <div className="fixed inset-0 bg-gradient-to-br from-[#0d0020] via-black to-[#000d20] -z-10" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white text-sm mb-10 transition min-h-[44px]"
        >
          ← Back to Snapshort
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            Legal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
          <p className="text-gray-400 mt-4 text-sm sm:text-base">
            This Privacy Policy explains what data Snapshort collects, how we use it, and your rights
            regarding that data. We keep this simple and honest — no legalese.
          </p>
        </div>

        {/* TOC */}
        <nav className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-5 mb-12">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Contents</p>
          <ol className="flex flex-col gap-2 text-sm">
            {[
              ["#what-we-collect", "1. What data we collect"],
              ["#how-we-use", "2. How we use your data"],
              ["#third-parties", "3. Third-party services"],
              ["#retention", "4. Data retention"],
              ["#your-rights", "5. Your rights"],
              ["#cookies", "6. Cookies & local storage"],
              ["#children", "7. Children's privacy"],
              ["#changes", "8. Changes to this policy"],
              ["#contact", "9. Contact us"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-blue-400 hover:text-blue-300 transition">
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ── Sections ── */}

        <Section id="what-we-collect" title="1. What data we collect">
          <p>We collect only the minimum data needed to run the service:</p>

          <p className="text-white font-medium mt-4 mb-1">When you shorten a URL (guest or signed-in)</p>
          <ul className="space-y-2">
            <Li>The original long URL you submit</Li>
            <Li>The generated or custom short code</Li>
            <Li>The folder name (if you choose one)</Li>
            <Li>The date and time the link was created</Li>
          </ul>

          <p className="text-white font-medium mt-4 mb-1">When someone clicks your short link</p>
          <ul className="space-y-2">
            <Li>Timestamp of the click</Li>
            <Li>
              IP address — used only for analytics display in your dashboard; we do not map IPs to
              individuals or share them
            </Li>
            <Li>
              User-Agent string (browser/OS info sent automatically by every browser) — shown in the
              analytics table
            </Li>
          </ul>

          <p className="text-white font-medium mt-4 mb-1">When you sign in (Clerk authentication)</p>
          <ul className="space-y-2">
            <Li>Your Clerk user ID (an internal identifier, not your email or name)</Li>
            <Li>
              Your name, email address, and profile picture — provided by Clerk and used only to
              display your name in the Navbar
            </Li>
          </ul>

          <p className="mt-3">
            We do not collect payment information, passwords, or any sensitive personal data beyond
            what is listed above.
          </p>
        </Section>

        <Section id="how-we-use" title="2. How we use your data">
          <ul className="space-y-2">
            <Li>
              <strong className="text-white">Redirect service</strong> — we look up the short code in
              our database and redirect the visitor to the original URL
            </Li>
            <Li>
              <strong className="text-white">Analytics</strong> — click timestamps, IPs, and
              user-agents are stored and displayed back to the link owner in their dashboard
            </Li>
            <Li>
              <strong className="text-white">Authentication</strong> — your Clerk user ID links your
              short links to your account so you can manage them in the dashboard
            </Li>
            <Li>
              <strong className="text-white">Folder & alias organisation</strong> — folder names and
              custom aliases are stored so your dashboard is organised
            </Li>
          </ul>
          <p className="mt-3">
            We do <strong className="text-white">not</strong> sell your data, use it for advertising,
            share it with third parties beyond what is necessary to operate the service, or build
            profiles about visitors.
          </p>
        </Section>

        <Section id="third-parties" title="3. Third-party services">
          <p>Snapshort relies on the following third-party services to operate:</p>

          <div className="mt-4 space-y-5">
            {[
              {
                name: "Clerk",
                role: "Authentication provider",
                url: "https://clerk.com/privacy",
                detail:
                  "Handles sign-in, sign-out, and session management. Clerk stores your email, name, and profile picture. We receive only your Clerk user ID and display name.",
              },
              {
                name: "MongoDB Atlas",
                role: "Database",
                url: "https://www.mongodb.com/legal/privacy-policy",
                detail:
                  "Stores all short links, click history, and folder data. Data is hosted on MongoDB Atlas (cloud database). We control what is stored; MongoDB provides the storage infrastructure.",
              },
              {
                name: "Vercel",
                role: "Hosting & edge network",
                url: "https://vercel.com/legal/privacy-policy",
                detail:
                  "Hosts the Next.js application and serves every page request. Vercel may log request metadata (IP, user-agent) at the infrastructure level for security and performance purposes.",
              },
            ].map((s) => (
              <div
                key={s.name}
                className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-semibold text-white">{s.name}</span>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                    {s.role}
                  </span>
                </div>
                <p className="text-sm mb-2">{s.detail}</p>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  View {s.name} Privacy Policy →
                </a>
              </div>
            ))}
          </div>
        </Section>

        <Section id="retention" title="4. Data retention">
          <ul className="space-y-2">
            <Li>
              <strong className="text-white">Short links</strong> — stored indefinitely until you
              delete them from the dashboard
            </Li>
            <Li>
              <strong className="text-white">Click history</strong> — stored indefinitely as part of
              the link document; deleted when the link is deleted
            </Li>
            <Li>
              <strong className="text-white">Guest links</strong> (created without signing in) — stored
              indefinitely with no owner; we cannot associate them with you after the session ends
            </Li>
            <Li>
              <strong className="text-white">Authentication data</strong> — managed by Clerk; deleting
              your Clerk account removes your auth data from Clerk's systems
            </Li>
          </ul>
          <p className="mt-3">
            We do not currently run automated deletion schedules. If you need data removed, contact us
            (see Section 9).
          </p>
        </Section>

        <Section id="your-rights" title="5. Your rights">
          <p>You have the right to:</p>
          <ul className="space-y-2 mt-2">
            <Li>
              <strong className="text-white">Access</strong> — view all your short links and click
              analytics in the dashboard at any time
            </Li>
            <Li>
              <strong className="text-white">Edit</strong> — change the destination URL of any link
              via the Edit button in the dashboard
            </Li>
            <Li>
              <strong className="text-white">Delete links</strong> — contact us to delete specific
              links or all links associated with your account (self-service deletion is coming soon)
            </Li>
            <Li>
              <strong className="text-white">Delete your account</strong> — you can delete your Clerk
              account via Clerk's account portal, which removes your authentication data; contact us to
              also purge your Snapshort link data
            </Li>
            <Li>
              <strong className="text-white">Data portability</strong> — contact us to request an
              export of your link data in JSON format
            </Li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-blue-400 hover:text-blue-300 transition"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section id="cookies" title="6. Cookies &amp; local storage">
          <p>
            Snapshort itself does not set first-party cookies or use local storage for tracking. The
            Clerk authentication SDK sets session cookies to keep you signed in. These are strictly
            necessary for the authentication service to function and are governed by{" "}
            <a
              href="https://clerk.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition"
            >
              Clerk's Privacy Policy
            </a>
            .
          </p>
          <p>We do not use analytics cookies, ad tracking pixels, or third-party marketing tools.</p>
        </Section>

        <Section id="children" title="7. Children's privacy">
          <p>
            Snapshort is not directed at children under 13. We do not knowingly collect personal
            information from children. If you believe a child has provided us with personal data,
            contact us and we will delete it promptly.
          </p>
        </Section>

        <Section id="changes" title="8. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. The "Last updated" date at the top of
            this page will reflect any changes. For significant changes we will update the date
            visibly. Continued use of the service after changes constitutes acceptance of the updated
            policy.
          </p>
        </Section>

        <Section id="contact" title="9. Contact us">
          <p>
            If you have any questions, requests, or concerns about this Privacy Policy or your data,
            please reach out:
          </p>
          <div className="mt-4 backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-white font-semibold mb-1">Snapshort — Manish Kumar</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-blue-400 hover:text-blue-300 transition text-sm"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-600">
            We aim to respond to all privacy-related requests within 72 hours.
          </p>
        </Section>

        {/* Footer nav */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2025 Snapshort</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition">
            ← Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
