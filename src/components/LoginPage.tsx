import React from 'react';
import { supabase } from '../lib/supabase';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      onLogin();
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: '0 8px 40px rgba(0,0,0,.08)',
      }}>
        {/* Header */}
        <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: 'var(--accent)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#1a0f08', marginBottom: 14,
          }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="5.5" /><path d="M8 5v3l2 1.5" />
            </svg>
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>Consultation Log</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Sign in to your account</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Email</span>
            <input
              type="email" required autoFocus
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                height: 38, padding: '0 12px',
                background: 'var(--surface-0)',
                border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 13,
                color: 'var(--text-1)', fontFamily: 'inherit', outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Password</span>
            <input
              type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                height: 38, padding: '0 12px',
                background: 'var(--surface-0)',
                border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 13,
                color: 'var(--text-1)', fontFamily: 'inherit', outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--border-strong)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </label>

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: 7,
              background: 'oklch(0.58 0.20 28 / 0.08)',
              border: '1px solid oklch(0.58 0.20 28 / 0.25)',
              fontSize: 12, color: 'var(--danger)',
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{
              marginTop: 4, height: 40,
              background: 'var(--accent)', color: '#fff',
              border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'opacity .12s',
            }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5 }}>
            Don't have an account? Ask your admin to set you up.
          </p>
        </form>
      </div>
    </div>
  );
}
