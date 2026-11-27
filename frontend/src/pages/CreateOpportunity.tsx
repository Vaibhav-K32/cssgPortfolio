import { useState } from 'react';
import { createOpportunity, CATEGORIES, label } from '../api';
import type { View } from '../App';

type Props = { go: (v: View) => void };

export default function CreateOpportunity({ go }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [capacity, setCapacity] = useState('10');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    if (!startsAt || !endsAt) {
      setError('Please pick a start and end time.');
      return;
    }
    setBusy(true);
    try {
      const created = await createOpportunity({
        title,
        description,
        category,
        location,
        // The time picker gives local time; convert it to a full timestamp for the database
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        capacity: Number(capacity),
      });
      go({ name: 'detail', id: created.id });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h1>New volunteer opportunity</h1>

      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label>
          Description
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <div className="row">
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{label(c)}</option>
              ))}
            </select>
          </label>
          <label>
            Capacity
            <input type="number" min={1} max={1000} value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
          </label>
        </div>

        <label>
          Location
          <input value={location} onChange={(e) => setLocation(e.target.value)} required />
        </label>

        <div className="row">
          <label>
            Starts
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
          </label>
          <label>
            Ends
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
          </label>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button className="primary" type="submit" disabled={busy}>
            {busy ? 'Creating...' : 'Create opportunity'}
          </button>
          <button type="button" onClick={() => go({ name: 'dashboard' })}>Cancel</button>
        </div>
      </form>
    </section>
  );
}