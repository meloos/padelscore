import Link from "next/link";
import { Trophy } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion — PadelScore",
};

export default function DataDeletionPage() {
  return (
    <div className="court-bg min-h-screen flex flex-col">
      <header className="max-w-6xl mx-auto w-full px-4 py-6 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-lg gradient-text">PadelScore</span>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-black mb-2">Data Deletion Instructions</h1>
        <p className="text-muted-foreground mb-10">Last updated: June 8, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <p>
              You have the right to request deletion of all personal data PadelScore holds about you.
              There are two ways to do this:
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">Option 1 — Delete via your profile</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Sign in to your PadelScore account.</li>
              <li>Go to <span className="text-foreground font-medium">Profile</span> in the navigation.</li>
              <li>Scroll to the bottom and select <span className="text-foreground font-medium">Delete account</span>.</li>
              <li>Confirm the deletion when prompted.</li>
            </ol>
            <p className="mt-3">
              Your account, profile data, and all associated tournament records are permanently deleted immediately.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">Option 2 — Submit a deletion request by email</h2>
            <p>
              If you are unable to access your account, send an email to{" "}
              <a href="mailto:contact@michallemke.com" className="text-primary hover:underline">contact@michallemke.com</a>{" "}
              with the subject line <span className="text-foreground font-medium">"Data Deletion Request"</span> and include:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>The email address associated with your PadelScore account.</li>
              <li>Your full name (as registered).</li>
            </ul>
            <p className="mt-3">
              We will process your request and permanently delete your data within <span className="text-foreground font-medium">30 days</span>.
              We will send a confirmation email once deletion is complete.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">What gets deleted</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Your account credentials (email, hashed password).</li>
              <li>Your profile information (name, date of birth).</li>
              <li>All tournaments you created and their associated match data.</li>
              <li>Your player statistics accumulated across tournaments.</li>
              <li>Any active sessions.</li>
            </ul>
            <p className="mt-3">
              Deletion is permanent and cannot be undone.
              Aggregate, anonymised statistics that do not identify you are not subject to deletion.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground mb-3">Questions</h2>
            <p>
              For any questions about your data or this process, contact us at{" "}
              <a href="mailto:contact@michallemke.com" className="text-primary hover:underline">contact@michallemke.com</a>{" "}
              or read our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
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
