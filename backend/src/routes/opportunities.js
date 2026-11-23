import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// GET /api/opportunities -> list all opportunities, soonest first
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('starts_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;