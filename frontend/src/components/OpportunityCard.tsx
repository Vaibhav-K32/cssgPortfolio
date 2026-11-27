import { formatWhen, label } from '../api';
import type { Opportunity } from '../api';

type Props = {
  opportunity: Opportunity;
  onOpen: (id: number) => void;
};

export default function OpportunityCard({ opportunity: o, onOpen }: Props) {
  const left = o.capacity - o.spots_taken;

  return (
    <article className="card">
      <span className="tag">{label(o.category)}</span>
      <h3>{o.title}</h3>
      <p className="muted">{formatWhen(o.starts_at, o.ends_at)}</p>
      <p className="muted">Location: {o.location}</p>
      <p className={left <= 0 ? 'full' : 'spots'}>
        {left <= 0 ? 'Full' : `${left} of ${o.capacity} spots left`}
      </p>
      <button onClick={() => onOpen(o.id)}>View details</button>
    </article>
  );
}