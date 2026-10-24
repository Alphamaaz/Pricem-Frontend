import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bug, Mail, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Price Am",
  description: "Contact Price Am customer care for marketplace help, feedback, technical issues, or security concerns.",
};

const SUPPORT_EMAIL = "support@priceam.ng";

export default function ContactPage() {
  return (
    <article className="info-page contact-page">
      <div className="info-page-back"><Link href="/"><ArrowLeft /> Back to marketplace</Link></div>
      <header className="info-page-hero">
        <span>Support</span>
        <h1>Contact Us – Price Am</h1>
        <p>The Price Am customer support team is ready to answer your questions and provide the assistance you need.</p>
      </header>

      <section className="contact-grid" aria-label="Contact options">
        <article className="contact-card">
          <div className="contact-card-icon"><Mail /></div>
          <div>
            <p className="contact-card-label">Customer care</p>
            <h2>Questions, suggestions or feedback</h2>
            <p>We’re happy to hear from you and are committed to providing a helpful and reliable marketplace experience.</p>
            <a className="contact-email" href={`mailto:${SUPPORT_EMAIL}?subject=Price%20Am%20Customer%20Care`}>{SUPPORT_EMAIL}</a>
          </div>
        </article>

        <article className="contact-card">
          <div className="contact-card-icon contact-card-icon-security"><Bug /></div>
          <div>
            <p className="contact-card-label">Technical issues &amp; security</p>
            <h2>Report a bug or security concern</h2>
            <p>If you discover a bug, experience a technical issue, or have a security-related question or concern, please contact our team.</p>
            <a className="contact-email" href={`mailto:${SUPPORT_EMAIL}?subject=Price%20Am%20Technical%20or%20Security%20Issue`}>{SUPPORT_EMAIL}</a>
          </div>
        </article>
      </section>

      <section className="contact-help">
        <div><ShieldCheck /></div>
        <div>
          <h2>Help us assist you faster</h2>
          <p>Include the email address connected to your account and, where relevant, the listing link or order reference. Screenshots can help explain a technical issue.</p>
          <strong>Never email your password, one-time code, card PIN, or other sensitive security information.</strong>
        </div>
      </section>

      <p className="contact-closing">At Price Am, we value your feedback and are committed to making your buying and selling experience as smooth, safe, and convenient as possible.</p>
    </article>
  );
}
