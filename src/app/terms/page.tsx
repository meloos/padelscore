import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — PadelScore",
};

export default function TermsPage() {
  return (
    <div className="court-bg min-h-screen flex flex-col">
      <header className="max-w-6xl mx-auto w-full px-4 py-6 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/icon.png" alt="PadelScore" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-lg gradient-text">PadelScore</span>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-black mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: June 8, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">1. Acceptance</h2>
            <p>
              By creating an account or using PadelScore, you agree to these Terms of Service.
              If you do not agree, do not use the service.
              PadelScore is operated by Michał Lemke (<a href="mailto:contact@michallemke.com" className="text-primary hover:underline">contact@michallemke.com</a>).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">2. The service</h2>
            <p>
              PadelScore provides tools for creating and tracking Mexicano padel tournaments,
              including match scheduling, score entry, and player statistics.
              The service is provided free of charge and on an "as-is" basis.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">3. Your account</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must be at least 13 years old to create an account.</li>
              <li>You are responsible for keeping your credentials confidential.</li>
              <li>You must provide accurate information and keep it up to date.</li>
              <li>You may not share your account or create accounts on behalf of others without their consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">4. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Use the service for any unlawful purpose.</li>
              <li>Attempt to gain unauthorised access to other users' data or to PadelScore's systems.</li>
              <li>Interfere with the availability or integrity of the service.</li>
              <li>Scrape, copy, or redistribute content from the service without permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">5. Content</h2>
            <p>
              You retain ownership of any content you submit (tournament names, player names, scores).
              By submitting content you grant PadelScore a limited licence to store and display it
              as part of operating the service. You are responsible for ensuring your content
              does not infringe third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">6. Availability</h2>
            <p>
              We aim to keep PadelScore available but make no uptime guarantees. We may suspend,
              modify, or discontinue the service at any time with reasonable notice where possible.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">7. Disclaimer of warranties</h2>
            <p>
              PadelScore is provided "as is" and "as available" without warranties of any kind,
              express or implied. We do not warrant that the service will be error-free, uninterrupted,
              or fit for any particular purpose.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">8. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, PadelScore and its operator shall not be liable
              for indirect, incidental, special, or consequential damages arising from your use of
              (or inability to use) the service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">9. Termination</h2>
            <p>
              You may delete your account at any time. We reserve the right to suspend or terminate
              accounts that violate these terms. Upon termination your data will be deleted in
              accordance with our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">10. Changes</h2>
            <p>
              We may update these terms. We will post changes on this page with an updated date.
              Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">11. Contact</h2>
            <p>
              Questions? Contact us at{" "}
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
