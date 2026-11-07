import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { emailHref } from '@/lib/content';
export const metadata:Metadata={title:'Privacy notice'};
export default function Page(){
  const contact=emailHref(process.env.PRIVACY_CONTACT_EMAIL??'');
  return <main id="main" className="chapter-page page-shell reading-page"><PageHeading title="Privacy notice." description="How information is used in this portfolio."/><div className="prose">
    <h2>Messages</h2><p>If the contact service is enabled, your name, email address, subject and message are stored in Supabase so the portfolio Owner can read and respond. A copy may be delivered to the Owner through Resend, and an automatic receipt may be sent to your email when enabled. Do not include passwords or sensitive information.</p>
    <h2>Accounts</h2><p>Supabase Auth handles account credentials and email verification. The site stores a display name, assigned role, account state and security session timestamps. Session cookies are used for sign-in. New accounts receive read-only Viewer access.</p>
    <h2>Preferences and protection</h2><p>Audio, theme and motion preferences are stored in your browser. Cloudflare Turnstile processes browser and connection signals to verify contact submissions. Request limits use hashed identifiers; raw client addresses are not stored in the application&apos;s rate-limit table. Hosting and service providers may retain their own access and security logs.</p>
    <h2>Retention and deletion</h2><p>Messages remain until the Owner deletes them. Deleting a message removes its linked notifications and queued email jobs. Already delivered email follows the recipient mailbox&apos;s retention. This version does not run an automatic message-retention cleanup. Security audit entries omit message text and email addresses and remain available to the Owner.</p>
    {contact?<p>To ask about your information or request deletion, <a href={contact}>contact the portfolio Owner</a>.</p>:<p>A privacy contact must be configured before the contact form is enabled.</p>}
    <p>No advertising or analytics tracker is included. Your theme and audio preferences can be cleared through your browser&apos;s site-data settings.</p>
  </div></main>;
}
