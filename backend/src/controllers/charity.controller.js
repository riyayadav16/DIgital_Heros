const supabase = require('../lib/supabaseClient');

const getPublicCharities = async (req, res) => {
  try {
    const { data: charities, error } = await supabase
      .from('Charity')
      .select('id, name, description, logoUrl')
      .eq('isActive', true);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database error fetching charities' });
    }

    res.json(charities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getPublicCharities };
