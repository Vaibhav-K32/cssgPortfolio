import { useEffect, useState } from 'react';
import { getMyRegistrations, getMyOpportunities, formatWhen } from '../api';
import type { MyRegistration, Opportunity, Profile } from '../api';
import type { View } from '../App';
import OpportunityCard from '../components/OpportunityCard';

type Props = {
  profile: Profile | null;
  go: (v: View) => void;
};

export default function Dashboard({ profile, go }: Props) {
  const [registrations, setRegistrations] = useState<MyRegistration[]>([]);
  const [hosting, setHosting] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const role = profile?.role;

  useEffect(() => {
    if (!role) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const regs = await getMyRegistrations();
        const mine = role === 'organizer' ? await getMyOpportunities() : [];
        if (!cancelled) {
          setRegistrations(regs);
          setHosting(mine);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [role]);

  if (!profile) return <p className="muted">Loading your profile...</p>;

  const open = (id: number) => go({ name: 'detail', id });
  const now = new Date();
  const upcoming = registrations.filter((r) => new Date(r.opportunity.ends_at) >= now);
  const past = registrations.filter((r) => new Date(r.opportunity.ends_at) < now);

  return (
    <section>
      <h1>Hi, {profile.full_name}</h1>
      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error">{error}</p>}

      {profile.role === 'organizer' && (
        <>
          <div className="section-head">
            <h2>Opportunities I organize</h2>
            <button className="primary" onClick={() => go({ name: 'create' })}>+ New opportunity</button>
          </div>
          {!loading && hosting.length === 0 && <p className="muted">You haven't created any yet.</p>}
          <div className="grid">
            {hosting.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} onOpen={open} />
            ))}
          </div>
        </>
      )}

      <h2>My upcoming registrations</h2>
      {!loading && upcoming.length === 0 && (
        <p className="muted">
          No upcoming registrations.{' '}
          <button className="link" onClick={() => go({ name: 'browse' })}>Browse opportunities</button>
        </p>
      )}
      <div className="grid">
        {upcoming.map((r) => (
          <OpportunityCard key={r.id} opportunity={r.opportunity} onOpen={open} />
        ))}
      </div>

      <h2>Past registrations</h2>
      {!loading && past.length === 0 && <p className="muted">Nothing yet.</p>}
      <ul>
        {past.map((r) => (
          <li key={r.id}>
            <button className="link" onClick={() => open(r.opportunity.id)}>{r.opportunity.title}</button>{' '}
            <span className="muted">{formatWhen(r.opportunity.starts_at, r.opportunity.ends_at)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}