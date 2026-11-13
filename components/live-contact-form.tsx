'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, RequestError } from '@/lib/client-api';
import { Turnstile } from './turnstile';
import { CinematicLink as Link } from './cinematic-link';

export function LiveContactForm({ enabled }: { enabled: boolean }) {
  const [token, setToken] = useState(''); const [resetKey, setResetKey] = useState(0); const [submissionId, setSubmissionId] = useState('');
  const [errors, setErrors] = useState<Record<string,string>>({}); const [notice, setNotice] = useState(''); const [sent, setSent] = useState(false); const [pending, setPending] = useState(false);
  const errorSummary = useRef<HTMLDivElement>(null);
  const fieldErrors = ['name', 'email', 'subject', 'body', 'consent'].filter(key => errors[key]);
  useEffect(() => {
    if (notice && !pending && !sent) errorSummary.current?.focus();
  }, [notice, pending, sent]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setPending(true); setNotice(''); setErrors({});
    try {
      const bytes = new Uint8Array(16); crypto.getRandomValues(bytes); bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
      const hex = [...bytes].map(value => value.toString(16).padStart(2,'0')).join('');
      const id = submissionId || `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`; setSubmissionId(id);
      const result = await api<{ message: string }>('/api/contact', { method: 'POST', body: JSON.stringify({ name: data.get('name'), email: data.get('email'), subject: data.get('subject'), body: data.get('body'), consent: data.get('consent') === 'on', token, submissionId: id }) });
      setSent(true); setNotice(result.message); form.reset();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Your message could not be sent. Please try again.');
      if (error instanceof RequestError) { setErrors(error.fields); if (error.status === 409) setSubmissionId(''); }
      setToken(''); setResetKey(value => value + 1);
    } finally { setPending(false); }
  }
  return <>
    {!enabled && <p className="preview-note" role="status">The message service is not available yet. Please try again later.</p>}
    {sent ? <div className="success-state" role="status"><h2>Your letter arrived.</h2><p>{notice}</p><button onClick={() => { setSent(false); setNotice(''); setSubmissionId(''); setToken(''); setResetKey(value => value + 1); }}>Write another message</button></div> : <form className="field-form contact-form" onSubmit={submit} method="post" onChange={() => { if (!pending) setSubmissionId(''); }}>
      {notice && <div ref={errorSummary} tabIndex={-1} className="preview-note contact-error-summary" aria-labelledby="contact-error-title">
        <h2 id="contact-error-title">Your message could not be sent.</h2>
        <p>{notice}</p>
        {fieldErrors.length ? <ul>{fieldErrors.map(key => <li key={key}><a href={`#contact-${key}`} onClick={event => { event.preventDefault(); document.getElementById(`contact-${key}`)?.focus(); }}>{key === 'body' ? 'Message' : key[0].toUpperCase() + key.slice(1)}: {errors[key]}</a></li>)}</ul> : <p>Please try again. Your message is still in the form.</p>}
      </div>}
      {(['name','email','subject','body'] as const).map(key => <label key={key} className={`contact-field contact-field-${key}`} htmlFor={`contact-${key}`}>{key === 'body' ? 'Message' : key[0].toUpperCase()+key.slice(1)}{key === 'body' ? <textarea id={`contact-${key}`} name={key} disabled={pending} rows={5} minLength={10} maxLength={4000} required aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `error-${key}` : undefined}/> : <input id={`contact-${key}`} name={key} disabled={pending} type={key === 'email' ? 'email' : 'text'} autoComplete={key === 'name' ? 'name' : key === 'email' ? 'email' : undefined} minLength={key === 'name' ? 2 : 3} maxLength={key === 'name' ? 80 : key === 'email' ? 254 : 120} required aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `error-${key}` : undefined}/>}{errors[key] && <span className="field-error" id={`error-${key}`}>{errors[key]}</span>}</label>)}
      <label className="check-row"><input id="contact-consent" name="consent" type="checkbox" disabled={pending} required aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? 'error-consent' : undefined}/>I agree to the <Link href="/privacy">privacy notice</Link> and processing of this message.</label>
      {enabled && <Turnstile onToken={setToken} resetKey={resetKey}/>}
      {errors.consent && <p id="error-consent" className="field-error">{errors.consent}</p>}
      <button className="button" disabled={!enabled || !token || pending}>{pending ? 'Sending…' : 'Send message'}</button>
    </form>}
  </>;
}
