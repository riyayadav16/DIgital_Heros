const supabase = require('../lib/supabaseClient');

const getPublishedDraws = async (req, res) => {
  try {
    const { data: draws, error } = await supabase
      .from('Draw')
      .select(`
        *,
        winners:Winner (*, user:User(id, name))
      `)
      .eq('status', 'PUBLISHED')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database error fetching published draws' });
    }

    res.json(draws);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyDrawHistory = async (req, res) => {
  try {
    const { data: winners, error } = await supabase
      .from('Winner')
      .select('*, draw:Draw(*)')
      .eq('userId', req.user.id)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database error fetching draw history' });
    }

    res.json(winners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const uploadProof = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: winner, error: fetchError } = await supabase
      .from('Winner')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !winner || winner.userId !== req.user.id) {
      return res.status(404).json({ error: 'Winner record not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const proofUrl = `/uploads/${req.file.filename}`;
    
    const { error: updateError } = await supabase
      .from('Winner')
      .update({ proofUrl })
      .eq('id', id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ error: 'Database error updating proof URL' });
    }

    res.json({ message: 'Proof uploaded successfully', proofUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getPublishedDraws, getMyDrawHistory, uploadProof };
