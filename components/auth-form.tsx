'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client-api';
import { CinematicLink as Link } from './cinematic-link';

export function AuthForm({ mode, enabled, callbackError = false }: { mode: 'login' | 'signup' | 'forgot-password' | 'reset-password'; enabled: boolean; callbackError?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState(callbackError ? 'Sign-in could not be completed. Start a fresh sign-in from this page. If it happens again, contact the portfolio Owner.' : '');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setPending(true); setNotice('');
    try {
      const result = await api<{ message?: string }>(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify({ email: data.get('email'), name: data.get('name'), password: data.get('password') }) });
      if (mode === 'login') { router.replace('/admin'); router.refresh(); }
      else { setNotice(result.message || 'The request completed.'); form.reset(); if (mode === 'reset-password') { router.replace('/login?notice=reset'); router.refresh(); } }
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setPending(false); }
  }
  async function oauth(provider: 'github' | 'google') {
    setPending(true); setNotice('');
    try { const result = await api<{ url: string }>('/api/auth/oauth', { method: 'POST', body: JSON.stringify({ provider }) }); window.location.assign(result.url); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Sign-in could not start.'); setPending(false); }
  }
  return <div className="auth-sheet">
    {!enabled && <p role="status" className="preview-note">Sign-in is not available yet. Please try again later.</p>}
    <form className="field-form auth-form" onSubmit={submit} method="post">
      {mode === 'signup' && <label>Display name<input name="name" autoComplete="name" required minLength={2} maxLength={80}/></label>}
      {mode !== 'reset-password' && <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>}
      {mode !== 'forgot-password' && <label>{mode === 'reset-password' ? 'New password' : 'Password'}<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 12} maxLength={128} required/>{mode !== 'login' && <small>Use at least 12 characters.</small>}</label>}
      <button className="button" disabled={pending || !enabled}>{pending ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : mode === 'reset-password' ? 'Update password' : 'Send recovery link'}</button>
    </form>
    {notice && <p role="status" className="preview-note">{notice}</p>}
    {mode === 'login' && <div className="oauth-actions"><button type="button" disabled={pending || !enabled} onClick={() => void oauth('github')}>Continue with GitHub</button><button type="button" disabled={pending || !enabled} onClick={() => void oauth('google')}>Continue with Google</button></div>}
    {mode === 'signup' && <p className="preview-note">New accounts receive read-only Viewer access. The portfolio Owner assigns editing permissions.</p>}
    <div className="auth-links"><Link href="/login">Sign in</Link><Link href="/signup">Sign up</Link><Link href="/forgot-password">Forgot password</Link></div>
  </div>;
}
