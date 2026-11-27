import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  getOpportunity,
  getMyRegistrations,
  getAttendees,
  register,
  cancelRegistration,
  deleteOpportunity,
  formatWhen,
  label,
} from '../api';
import type { Attendee, Opportunity, Profile } from '../api';
import type { View } from '../App';

type Props = {
  id: number;
  loggedIn: boolean;
  profile: Profile | null;
  go: (v: View) => void;
};

export default function Detail({ id, loggedIn, profile, go }: Props) {
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // bump this to reload the page's data
  const userId = profile?.id;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const o = await getOpportunity(id);

        let registered = false;
        if (loggedIn) {
          const mine = await getMyRegistrations();
          registered = mine.some((r) => r.opportunity.id === id);
        }

        let people: Attendee[] | null = null;
        if (userId && o.organizer_id === userId) {
          people = await getAttendees(id);
        }

        if (!cancelled) {
          setOpp(o);
          setIsRegistered(registered);
          setAttendees(people);
        }
      } catch (err) {
        if (!cancelled) setLoadError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, loggedIn, userId, reloadKey]);

  // Runs register/cancel, shows the result, then reloads the numbers
  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setBusy(true);
    setActionError('');
    setMessage('');
    try {
      await action();
      setMessage(successMessage);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy(false);
      setReloadKey((k) => k + 1);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this opportunity? Its registrations will be removed too.')) return;
    setBusy(true);
    setActionError('');
    try {
      await deleteOpportunity(id);
      go({ name: 'dashboard' });
    } catch (err) {
      setActionError((err as Error).message);
      setBusy(false);
    }
  }

  if (loading && !opp) return <p className="muted">Loading...</p>;

  if (loadError) {
    return (
      <section>
        <button className="link" onClick={() => go({ name: 'browse' })}>← Back</button>
        <p className="error">{loadError}</p>
      </section>
    );
  }

  if (!opp) return null;

  const left = opp.capacity - opp.spots_taken;
  const started = new Date(opp.starts_at) <= new Date();
  const isOrganizer = !!userId && opp.organizer_id === userId;

  // Decide which register/cancel controls to show
  let registerArea: ReactNode;
  if (isOrganizer) {
    registerArea = <span className="muted">You organize this opportunity.</span>;
  } else if (!loggedIn) {
    registerArea = (
      <button className="primary" onClick={() => go({ name: 'login' })}>Log in to register</button>
    );
  } else if (isRegistered) {
    registerArea = (
      <>
        <span className="success">✓ You're registered</span>
        {!started && (
          <button
            className="danger"
            disabled={busy}
            onClick={() => runAction(() => cancelRegistration(id), 'Your registration was canceled.')}
          >
            Cancel registration
          </button>
        )}
      </>
    );
  } else if (started) {
    registerArea = <span className="muted">This opportunity has already started.</span>;
  } else if (left <= 0) {
    registerArea = <span className="full">This opportunity is full.</span>;
  } else {
    registerArea = (
      <button
        className="primary"
        disabled={busy}
        onClick={() => runAction(() => register(id), "You're registered!")}
      >
        {busy ? 'Registering...' : 'Register'}
      </button>
    );
  }

  return (
    <section>
      <button className="link" onClick={() => go({ name: 'browse' })}>← Back to opportunities</button>

      <div className="panel">
        <span className="tag">{label(opp.category)}</span>
        <h1 className="detail-title">{opp.title}</h1>
        <p className="muted">{formatWhen(opp.starts_at, opp.ends_at)}</p>
        <p className="muted">Location: {opp.location}</p>
        {opp.organizer && <p className="muted">Organized by {opp.organizer.full_name}</p>}
        {opp.description && <p>{opp.description}</p>}
        <p className={left <= 0 ? 'full' : 'spots'}>
          {left <= 0 ? 'Full' : `${left} of ${opp.capacity} spots left`}
        </p>

        <div className="actions">{registerArea}</div>
        {message && <p className="success">{message}</p>}
        {actionError && <p className="error">{actionError}</p>}
      </div>

      {isOrganizer && (
        <div className="panel">
          <h2 className="panel-title">Registered volunteers ({attendees?.length ?? 0})</h2>
          {attendees && attendees.length === 0 && <p className="muted">No one has registered yet.</p>}
          {attendees && attendees.length > 0 && (
            <ol className="attendees">
              {attendees.map((a) => (
                <li key={a.id}>
                  {a.volunteer?.full_name ?? 'Unknown'}{' '}
                  <span className="muted">· signed up {new Date(a.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ol>
          )}
          <div className="actions spaced">
            <button className="danger" disabled={busy} onClick={handleDelete}>Delete opportunity</button>
          </div>
        </div>
      )}
    </section>
  );
}