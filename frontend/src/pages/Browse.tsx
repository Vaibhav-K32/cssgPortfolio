import { useEffect, useState } from 'react';
import { getOpportunities, CATEGORIES, label } from '../api';
import type { Opportunity } from '../api';
import OpportunityCard from '../components/OpportunityCard';

type Props = { onOpen: (id: number) => void };

export default function Browse({ onOpen }: Props) {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // "cancelled" ignores old responses that arrive late (a race condition)
    let cancelled = false;
    setLoading(true);
    setError('');

    // Wait 300ms after typing stops before asking the server
    const timer = setTimeout(() => {
      getOpportunities(category, search)
        .then((data) => {
          if (!cancelled) setItems(data);
        })
        .catch((err: Error) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [category, search]);

  return (
    <section>
      <h1>Volunteer opportunities</h1>

      <div className="filters">
        <input
          type="search"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{label(c)}</option>
          ))}
        </select>
      </div>

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="muted">No upcoming opportunities match.</p>
      )}

      <div className="grid">
        {items.map((o) => (
          <OpportunityCard key={o.id} opportunity={o} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}