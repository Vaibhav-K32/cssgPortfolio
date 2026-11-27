import { Router } from 'express';
import { supabase, supabaseAs } from '../supabase.js';
import { requireUser } from '../auth.js';

const router = Router();

// Turns "12" from the URL into the number 12, or null if it isn't a valid id.
function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// The database functions raise short error names. Turn them into status codes + messages.
const DB_ERRORS = {
  not_logged_in: [401, 'Not logged in'],
  not_found: [404, 'Opportunity not found'],
  event_started: [409, 'This opportunity has already started'],
  already_registered: [409, 'You are already registered for this opportunity'],
  full: [409, 'Sorry, this opportunity is full'],
  not_registered: [409, 'You are not registered for this opportunity'],
};
function sendDbError(res, error) {
  const known = DB_ERRORS[error.message];
  if (known) return res.status(known[0]).json({ error: known[1] });
  return res.status(500).json({ error: error.message });
}

// GET /api/opportunities?category=food&search=bank
// Upcoming opportunities, soonest first. Anyone can see these.
router.get('/', async (req, res) => {
  const { category, search } = req.query;

  let query = supabase
    .from('opportunities')
    .select('*, organizer:profiles(full_name)')
    .gte('ends_at', new Date().toISOString());

  if (typeof category === 'string' && category !== '') {
    query = query.eq('category', category);
  }
  if (typeof search === 'string' && search.trim() !== '') {
    query = query.ilike('title', `%${search.trim()}%`);
  }

  const { data, error } = await query.order('starts_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/opportunities/:id -> one opportunity
router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const { data, error } = await supabase
    .from('opportunities')
    .select('*, organizer:profiles(full_name)')
    .eq('id', id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Opportunity not found' });
  res.json(data);
});

// POST /api/opportunities -> create (organizers only)
router.post('/', requireUser, async (req, res) => {
  const db = supabaseAs(req.token);

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .maybeSingle();
  if (profileError) return res.status(500).json({ error: profileError.message });
  if (!profile || profile.role !== 'organizer') {
    return res.status(403).json({ error: 'Only organizers can create opportunities' });
  }

  // Server-side validation: never trust what the browser sends
  const { title, description, category, location, starts_at, ends_at, capacity } = req.body ?? {};
  const isText = (v) => typeof v === 'string' && v.trim() !== '';

  if (!isText(title) || !isText(category) || !isText(location)) {
    return res.status(400).json({ error: 'Title, category and location are required' });
  }
  const start = new Date(starts_at);
  const end = new Date(ends_at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Start and end times are required' });
  }
  if (start <= new Date()) {
    return res.status(400).json({ error: 'Start time must be in the future' });
  }
  if (end <= start) {
    return res.status(400).json({ error: 'End time must be after the start time' });
  }
  const cap = Number(capacity);
  if (!Number.isInteger(cap) || cap < 1 || cap > 1000) {
    return res.status(400).json({ error: 'Capacity must be a whole number from 1 to 1000' });
  }

  const { data, error } = await db
    .from('opportunities')
    .insert({
      organizer_id: req.user.id,
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : null,
      category: category.trim(),
      location: location.trim(),
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      capacity: cap,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE /api/opportunities/:id -> delete (only the organizer who made it)
router.delete('/:id', requireUser, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  // RLS hides other people's rows, so deleting someone else's matches 0 rows -> 404
  const { data, error } = await supabaseAs(req.token)
    .from('opportunities')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) return res.status(500).json({ error: error.message });
  if (data.length === 0) return res.status(404).json({ error: 'Opportunity not found' });
  res.status(204).end();
});

// GET /api/opportunities/:id/registrations -> attendee list (only that event's organizer)
router.get('/:id/registrations', requireUser, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const { data: opp, error: oppError } = await supabase
    .from('opportunities')
    .select('organizer_id')
    .eq('id', id)
    .maybeSingle();
  if (oppError) return res.status(500).json({ error: oppError.message });
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });
  if (opp.organizer_id !== req.user.id) {
    return res.status(403).json({ error: "Only this opportunity's organizer can see who registered" });
  }

  const { data, error } = await supabaseAs(req.token)
    .from('registrations')
    .select('id, created_at, volunteer:profiles(full_name)')
    .eq('opportunity_id', id)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/opportunities/:id/register -> sign up (capacity checked in the database)
router.post('/:id/register', requireUser, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const { error } = await supabaseAs(req.token).rpc('register_for_opportunity', {
    p_opportunity_id: id,
  });
  if (error) return sendDbError(res, error);
  res.status(201).json({ ok: true });
});

// DELETE /api/opportunities/:id/register -> cancel your registration
router.delete('/:id/register', requireUser, async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const { error } = await supabaseAs(req.token).rpc('cancel_registration', {
    p_opportunity_id: id,
  });
  if (error) return sendDbError(res, error);
  res.status(204).end();
});

export default router;