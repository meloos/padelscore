import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — PadelScore",
};

export default function PrivacyPage() {
  return (
    <div className="court-bg min-h-screen flex flex-col">
      <header className="max-w-6xl mx-auto w-full px-4 py-6 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/icon.png" alt="PadelScore" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-lg gradient-text">PadelScore</span>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-black mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: June 8, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">1. Who we are</h2>
            <p>
              PadelScore is a Mexicano padel tournament tracker operated by Michał Lemke
              (<a href="mailto:contact@michallemke.com" className="text-primary hover:underline">contact@michallemke.com</a>).
              This policy explains what personal data we collect, why we collect it, and your rights regarding it.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">2. Data we collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><span className="text-foreground font-medium">Account data</span> — name, email address, and date of birth provided at registration.</li>
              <li><span className="text-foreground font-medium">Password</span> — stored as a bcrypt hash; we never store or transmit plain-text passwords.</li>
              <li><span className="text-foreground font-medium">Tournament and match data</span> — tournaments you create, rounds, scores, and player statistics accumulated across tournaments.</li>
              <li><span className="text-foreground font-medium">Session data</span> — a short-lived session token stored in a secure HTTP-only cookie to keep you signed in.</li>
            </ul>
            <p className="mt-3">We do not collect payment information, device identifiers, or location data.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">3. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide and operate the PadelScore service.</li>
              <li>To display your player profile and statistics within the app.</li>
              <li>To authenticate you and keep your session secure.</li>
              <li>To respond to support requests you send us.</li>
            </ul>
            <p className="mt-3">We do not sell your data, use it for advertising, or share it with third parties except as required by law.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">4. Data retention</h2>
            <p>
              Your data is retained for as long as your account is active. If you request deletion of your account,
              all personal data and associated tournament records are permanently deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">5. Your rights</h2>
            <p>Depending on your jurisdiction you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data via your profile settings.</li>
              <li>Request deletion of your data (see our <Link href="/data-deletion" className="text-primary hover:underline">data deletion instructions</Link>).</li>
              <li>Object to or restrict certain processing.</li>
              <li>Lodge a complaint with your local data protection authority.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{" "}
              <a href="mailto:contact@michallemke.com" className="text-primary hover:underline">contact@michallemke.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">6. Security</h2>
            <p>
              We use industry-standard practices including hashed passwords, secure session cookies,
              and HTTPS to protect your data. No method of transmission or storage is 100% secure;
              use a strong, unique password for your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">7. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be announced on this page
              with an updated date. Continued use of PadelScore after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">8. Contact</h2>
            <p>
              Questions or concerns? Contact us at{" "}
              <a href="mailto:contact@michallemke.com" className="text-primary hover:underline">contact@michallemke.com</a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-muted-foreground border-t border-border">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>PadelScore · Mexicano tournament tracker</span>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link href="/data-deletion" className="hover:text-primary transition-colors">Data Deletion</Link>
        </div>
      </footer>
    </div>
  );
}
