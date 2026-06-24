const crypto = require('crypto');
const supabase = require('../lib/supabaseClient');

const submitScore = async (req, res) => {
  try {
    const { score, date } = req.body;
    const userId = req.user.id;

    const scoreNum = parseInt(score);
    if (!scoreNum || scoreNum < 1 || scoreNum > 45) {
      return res.status(400).json({ success: false, message: 'Score must be between 1 and 45' });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    const scoreDate = new Date(date);
    if (isNaN(scoreDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const { data: subscription, error: subError } = await supabase
      .from('Subscription')
      .select('*')
      .eq('userId', userId)
      .maybeSingle();

    if (subError || !subscription || subscription.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Active subscription required to submit scores' });
    }

    const { data: newScore, error: insertError } = await supabase
      .from('Score')
      .insert([{ id: crypto.randomUUID(), userId: userId, score: scoreNum, date: scoreDate.toISOString() }])
      .select('*')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(409).json({ success: false, message: 'You already submitted a score for this date' });
      }
      console.error('Insert Error:', insertError);
      return res.status(500).json({ success: false, message: 'Database error while submitting score' });
    }

    const { data: allScores, error: fetchError } = await supabase
      .from('Score')
      .select('id')
      .eq('userId', userId)
      .order('date', { ascending: false });

    if (fetchError) {
      console.error('Fetch Error:', fetchError);
    } else if (allScores && allScores.length > 5) {
      const toDelete = allScores.slice(5).map(s => s.id);
      await supabase.from('Score').delete().in('id', toDelete);
    }

    res.status(201).json({ success: true, data: { message: 'Score submitted successfully', score: newScore } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMyScores = async (req, res) => {
  try {
    const { data: scores, error } = await supabase
      .from('Score')
      .select('*')
      .eq('userId', req.user.id)
      .order('date', { ascending: false })
      .limit(5);

    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Database error fetching scores' });
    }

    res.json({ success: true, data: scores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, date } = req.body;
    const userId = req.user.id;

    const scoreNum = parseInt(score);
    if (!scoreNum || scoreNum < 1 || scoreNum > 45) {
      return res.status(400).json({ success: false, message: 'Score must be between 1 and 45' });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    const scoreDate = new Date(date);
    if (isNaN(scoreDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('Score')
      .select('*')
      .eq('id', id)
      .eq('userId', userId)
      .maybeSingle();

    if (fetchError || !existing) {
      return res.status(404).json({ success: false, message: 'Score not found' });
    }

    const { data: updatedScore, error: updateError } = await supabase
      .from('Score')
      .update({ score: scoreNum, date: scoreDate.toISOString() })
      .eq('id', id)
      .eq('userId', userId)
      .select('*')
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return res.status(409).json({ success: false, message: 'You already submitted a score for this date' });
      }
      console.error('Update Error:', updateError);
      return res.status(500).json({ success: false, message: 'Database error updating score' });
    }

    res.json({ success: true, data: { message: 'Score updated successfully', score: updatedScore } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteScore = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: existing, error: fetchError } = await supabase
      .from('Score')
      .select('id')
      .eq('id', id)
      .eq('userId', userId)
      .maybeSingle();

    if (fetchError || !existing) {
      return res.status(404).json({ success: false, message: 'Score not found' });
    }

    const { error: deleteError } = await supabase
      .from('Score')
      .delete()
      .eq('id', id)
      .eq('userId', userId);

    if (deleteError) {
      console.error('Delete Error:', deleteError);
      return res.status(500).json({ success: false, message: 'Database error deleting score' });
    }

    res.json({ success: true, data: { message: 'Score deleted successfully' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { submitScore, getMyScores, updateScore, deleteScore };
