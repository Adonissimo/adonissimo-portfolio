import type { Metadata } from 'next';
import { PageHeading } from '@/components/page-heading';
import { ContactForm } from '@/components/contact-form';
import { contactConfigured } from '@/lib/backend/config';
export const metadata: Metadata = { title: 'Send a letter.' };
export default function Page() { return <main id="main" data-realm="fields" className="chapter-page contact-page page-shell"><PageHeading realm="fields" title={'Send a letter.'} description={'Have a project or an idea? Start a conversation.'}/><div className="contact-sheet"><ContactForm enabled={contactConfigured()}/></div></main>; }
