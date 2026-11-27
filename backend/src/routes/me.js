import { Router } from 'express';
import { supabase, supabaseAs } from '../supabase.js';
import { requireUser } from '../auth.js';

const router = Router();

// Every /api/me route needs a logged-in user
router.use(requireUser);

// GET /api/me -> my profile (name + role)
router.get('/', async (req, res) => {
  const { data, error } = await supabaseAs(req.token)
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', req.user.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Profile not found' });
  res.json({ ...data, email: req.user.email });
});

// GET /api/me/registrations -> what I signed up for, soonest first
router.get('/registrations', async (req, res) => {
  const { data, error } = await supabaseAs(req.token)
    .from('registrations')
    .select('id, created_at, opportunity:opportunities(*)')
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  data.sort((a, b) => new Date(a.opportunity.starts_at) - new Date(b.opportunity.starts_at));
  res.json(data);
});

// GET /api/me/opportunities -> events I organize (including past ones)
router.get('/opportunities', async (req, res) => {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('organizer_id', req.user.id)
    .order('starts_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;