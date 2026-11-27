import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { getMe } from './api';
import type { Profile } from './api';
import AuthForm from './pages/AuthForm';
import Browse from './pages/Browse';
import Detail from './pages/Detail';
import Dashboard from './pages/Dashboard';
import CreateOpportunity from './pages/CreateOpportunity';

// Which "page" is showing. Simple state instead of a router library.
export type View =
  | { name: 'browse' }
  | { name: 'detail'; id: number }
  | { name: 'login' }
  | { name: 'dashboard' }
  | { name: 'create' };

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<View>({ name: 'browse' });

  // Keep track of whether someone is logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load the logged-in user's profile (name + role) from our backend
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    getMe().then(setProfile).catch(() => setProfile(null));
  }, [userId]);

  function go(next: View) {
    setView(next);
    window.scrollTo(0, 0);
  }

  async function logOut() {
    await supabase.auth.signOut();
    go({ name: 'browse' });
  }

  return (
    <div>
      <header className="navbar">
        <button className="brand" onClick={() => go({ name: 'browse' })}>VolunteerConnect</button>
        <nav>
          <button className="link" onClick={() => go({ name: 'browse' })}>Opportunities</button>
          {session ? (
            <>
              <button className="link" onClick={() => go({ name: 'dashboard' })}>My Dashboard</button>
              {profile?.role === 'organizer' && (
                <button className="link" onClick={() => go({ name: 'create' })}>+ New</button>
              )}
              {profile && <span className="who">{profile.full_name} ({profile.role})</span>}
              <button className="link" onClick={logOut}>Log out</button>
            </>
          ) : (
            <button className="primary" onClick={() => go({ name: 'login' })}>Log in</button>
          )}
        </nav>
      </header>

      <main className="container">
        {view.name === 'browse' && <Browse onOpen={(id) => go({ name: 'detail', id })} />}

        {view.name === 'detail' && (
          <Detail id={view.id} loggedIn={!!session} profile={profile} go={go} />
        )}

        {view.name === 'login' &&
          (session ? <p>You're logged in.</p> : <AuthForm onDone={() => go({ name: 'browse' })} />)}

        {view.name === 'dashboard' &&
          (session ? <Dashboard profile={profile} go={go} /> : <AuthForm onDone={() => go({ name: 'dashboard' })} />)}

        {view.name === 'create' &&
          (profile?.role === 'organizer' ? (
            <CreateOpportunity go={go} />
          ) : (
            <p className="error">Only organizers can create opportunities.</p>
          ))}
      </main>
    </div>
  );
}