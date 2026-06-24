const supabase = require('../lib/supabaseClient');
const crypto = require('crypto');
const { generateDrawNumbers, simulateDraw, publishDraw } = require('../services/draw.service');

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data: users, error, count } = await supabase
      .from('User')
      .select(`
        id, name, email, role, donationPct, charityId, createdAt,
        charity:Charity (id, name),
        subscription:Subscription (planType, status, renewalDate, amount),
        scores:Score (count),
        winners:Winner (count)
      `, { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Database error fetching users' });
    }

    const formattedUsers = users.map(u => ({
      ...u,
      _count: {
        scores: u.scores?.[0]?.count || 0,
        winners: u.winners?.[0]?.count || 0
      },
      scores: undefined,
      winners: undefined
    }));

    res.json({ success: true, data: { items: formattedUsers, meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) } } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, donationPct, charityId } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (donationPct !== undefined) {
      const pct = parseInt(donationPct);
      if (pct < 10) {
        return res.status(400).json({ success: false, message: 'Donation percentage must be at least 10%' });
      }
      updates.donationPct = pct;
    }
    if (charityId !== undefined) updates.charityId = charityId || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const { data: user, error } = await supabase
      .from('User')
      .update(updates)
      .eq('id', id)
      .select('id, name, email, role, donationPct, charityId')
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Database error updating user' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('User').delete().eq('id', id);
    res.json({ success: true, data: { message: 'User deleted' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllScores = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data: scores, error, count } = await supabase
      .from('Score')
      .select('*, user:User(id, name, email)', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Database error fetching scores' });
    }

    res.json({ success: true, data: { items: scores, meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) } } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteScore = async (req, res) => {
  try {
    const { error } = await supabase.from('Score').delete().eq('id', req.params.id);
    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Database error deleting score' });
    }
    res.json({ success: true, data: { message: 'Score deleted' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const runDraw = async (req, res) => {
  try {
    const { month, year } = req.body;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const { data: existing, error: existingError } = await supabase
      .from('Draw')
      .select('*')
      .eq('month', m)
      .eq('year', y)
      .maybeSingle();

    if (existing && existing.status === 'PUBLISHED') {
      return res.status(400).json({ success: false, message: 'Draw already published for this month' });
    }

    const numbers = generateDrawNumbers();

    let draw;
    if (existing) {
      const { data, error } = await supabase
        .from('Draw')
        .update({ numbers, status: 'DRAFT' })
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) throw error;
      draw = data;
    } else {
      const { data, error } = await supabase
        .from('Draw')
        .insert([{ id: crypto.randomUUID(), month: m, year: y, numbers, status: 'DRAFT', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
        .select('*')
        .single();
      if (error) throw error;
      draw = data;
    }

    res.json({ success: true, data: { message: 'Draw numbers generated', draw } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const simulateDrawHandler = async (req, res) => {
  try {
    const { month, year } = req.body;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const result = simulateDraw(m, y);

    const { data: existing } = await supabase
      .from('Draw')
      .select('id')
      .eq('month', m)
      .eq('year', y)
      .maybeSingle();

    let draw;
    if (existing) {
      const { data, error } = await supabase
        .from('Draw')
        .update({ numbers: result.numbers, status: 'SIMULATED', updatedAt: new Date().toISOString() })
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) throw error;
      draw = data;
    } else {
      const { data, error } = await supabase
        .from('Draw')
        .insert([{ id: crypto.randomUUID(), month: m, year: y, numbers: result.numbers, status: 'SIMULATED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
        .select('*')
        .single();
      if (error) throw error;
      draw = data;
    }

    res.json({ success: true, data: { message: 'Draw simulated (not published)', draw, ...result } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const publishDrawHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await publishDraw(id);
    res.json({ success: true, data: { message: 'Draw published successfully', ...result } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

const getAllDraws = async (req, res) => {
  try {
    const { data: draws, error } = await supabase
      .from('Draw')
      .select('*, winners:Winner(count)')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Database error fetching draws' });
    }

    res.json({ success: true, data: draws.map(d => ({
      ...d,
      _count: { winners: d.winners?.[0]?.count || 0 },
      winners: undefined
    })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllWinners = async (req, res) => {
  try {
    const { data: winners, error } = await supabase
      .from('Winner')
      .select('*, user:User(id, name, email), draw:Draw(month, year, numbers)')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Database error fetching winners' });
    }

    res.json({ success: true, data: winners });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const verifyWinner = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(verificationStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }

    const { data: winner, error } = await supabase
      .from('Winner')
      .update({ verificationStatus })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Database error verifying winner' });
    }

    res.json({ success: true, data: winner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updatePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { payoutStatus } = req.body;

    if (!['PENDING', 'APPROVED', 'PAID'].includes(payoutStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payout status' });
    }

    const { data: winner, error } = await supabase
      .from('Winner')
      .update({ payoutStatus })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Database error updating payout' });
    }

    res.json({ success: true, data: winner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getCharities = async (req, res) => {
  try {
    const { data: charities, error } = await supabase
      .from('Charity')
      .select('*, users:User(count)')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Database error fetching charities' });
    }

    res.json({ success: true, data: charities.map(c => ({
      ...c,
      _count: { users: c.users?.[0]?.count || 0 },
      users: undefined
    })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createCharity = async (req, res) => {
  try {
    const { name, description, logoUrl } = req.body;
    if (!name || !description) {
      return res.status(400).json({ success: false, message: 'Name and description are required' });
    }
    const { data: charity, error } = await supabase
      .from('Charity')
      .insert([{ id: crypto.randomUUID(), name, description, logoUrl, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
      .select('*')
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Database error creating charity' });
    }
    res.status(201).json({ success: true, data: charity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateCharity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, logoUrl, isActive } = req.body;
    const { data: charity, error } = await supabase
      .from('Charity')
      .update({ name, description, logoUrl, isActive })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Database error updating charity' });
    }
    res.json({ success: true, data: charity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteCharity = async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('Charity').delete().eq('id', id);
    res.json({ success: true, data: { message: 'Charity deleted' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const pUsers = supabase.from('User').select('*', { count: 'exact', head: true });
    const pSubs = supabase.from('Subscription').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');
    const pDraws = supabase.from('Draw').select('*', { count: 'exact', head: true }).eq('status', 'PUBLISHED');
    const pWinners = supabase.from('Winner').select('*', { count: 'exact', head: true });
    const pTrans = supabase.from('Transaction').select('*, user:User(name)').order('createdAt', { ascending: false }).limit(10);
    const pRev = supabase.from('Transaction').select('amount').eq('type', 'SUBSCRIPTION');

    const [rUsers, rSubs, rDraws, rWinners, rTrans, rRev] = await Promise.all([pUsers, pSubs, pDraws, pWinners, pTrans, pRev]);

    const totalRevenue = rRev.data ? rRev.data.reduce((sum, t) => sum + t.amount, 0) : 0;

    res.json({
      success: true,
      data: {
        totalUsers: rUsers.count || 0,
        activeSubscriptions: rSubs.count || 0,
        totalDraws: rDraws.count || 0,
        totalWinners: rWinners.count || 0,
        totalRevenue,
        recentTransactions: rTrans.data || []
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getUsers, updateUser, deleteUser,
  getAllScores, deleteScore,
  runDraw, simulateDrawHandler, publishDrawHandler, getAllDraws,
  getAllWinners, verifyWinner, updatePayout,
  getCharities, createCharity, updateCharity, deleteCharity,
  getAnalytics
};
