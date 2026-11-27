import { useState } from 'react';
import { supabase } from '../supabase';

type Props = { onDone: () => void };

export default function AuthForm({ onDone }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'volunteer' | 'organizer'>('volunteer');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function submit() {
    setBusy(true);
    setError('');
    setInfo('');

    if (mode === 'signup') {
      // full_name and role are read by the database trigger that creates the profile
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim(), role } },
      });
      if (authError) setError(authError.message);
      else if (!data.session) setInfo('Account created. Check your email to confirm it, then log in.');
      else onDone();
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError(authError.message);
      else onDone();
    }

    setBusy(false);
  }

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setInfo('');
  }

  return (
    <section className="panel auth">
      <h1>{mode === 'login' ? 'Log in' : 'Create an account'}</h1>

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {mode === 'signup' && (
          <>
            <label>
              Full name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </label>
            <div>
              <p className="field-title">I am a...</p>
              <div className="radio">
                <label>
                  <input type="radio" name="role" checked={role === 'volunteer'} onChange={() => setRole('volunteer')} />
                  Volunteer
                </label>
                <label>
                  <input type="radio" name="role" checked={role === 'organizer'} onChange={() => setRole('organizer')} />
                  Organizer
                </label>
              </div>
            </div>
          </>
        )}

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {error && <p className="error">{error}</p>}
        {info && <p className="success">{info}</p>}

        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
      </form>

      <p className="muted">
        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button className="link" type="button" onClick={switchMode}>
          {mode === 'login' ? 'Sign up' : 'Log in'}
        </button>
      </p>
    </section>
  );
}