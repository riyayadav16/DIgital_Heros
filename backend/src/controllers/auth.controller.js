const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../lib/supabaseClient');
const { checkSubscriptionStatus } = require('../utils/subscription');

const signup = async (req, res) => {
  try {
    const { name, email, password, charityId, donationPct } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const pct = parseInt(donationPct) || 10;
    if (pct < 10) {
      return res.status(400).json({ success: false, message: 'Donation percentage must be at least 10%' });
    }

    const { data: existing } = await supabase.from('User').select('id').eq('email', email).maybeSingle();
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    let validatedCharityId = null;
    if (charityId) {
      const { data: charityCheck } = await supabase.from('Charity').select('id').eq('id', charityId).eq('isActive', true).maybeSingle();
      if (!charityCheck) {
        return res.status(400).json({ success: false, message: 'Selected charity does not exist or is inactive' });
      }
      validatedCharityId = charityId;
    }

    const hashed = await bcrypt.hash(password, 12);

    const { data: user, error: insertError } = await supabase.from('User').insert([{
      id: crypto.randomUUID(),
      name,
      email,
      password: hashed,
      charityId: validatedCharityId,
      donationPct: pct,
      role: 'USER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }]).select('id, name, email, role, donationPct, charityId, createdAt').single();

    if (insertError) {
      console.error('Insert Error:', insertError);
      return res.status(500).json({ success: false, message: 'Database error during signup' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({ success: true, data: { token, user } });
  } catch (err) {
    console.error('[Auth Controller] Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const { data: user, error: userError } = await supabase.from('User').select('*').eq('email', email).maybeSingle();
    if (userError || !user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const userOut = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      donationPct: user.donationPct,
      charityId: user.charityId,
      createdAt: user.createdAt
    };

    res.json({ success: true, data: { token, user: userOut } });
  } catch (err) {
    console.error('[Auth Controller] Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

const getMe = async (req, res) => {
  try {
    const { data: user, error: userError } = await supabase.from('User').select('*').eq('id', req.user.id).single();
    if (userError) throw userError;

    const subscription = await checkSubscriptionStatus(supabase, user.id);

    let charity = null;
    if (user.charityId) {
      const { data } = await supabase.from('Charity').select('id, name, description').eq('id', user.charityId).maybeSingle();
      charity = data;
    }

    const { data: scores } = await supabase.from('Score').select('*').eq('userId', user.id).order('date', { ascending: false }).limit(5);

    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      donationPct: user.donationPct,
      charityId: user.charityId,
      createdAt: user.createdAt,
      charity,
      subscription: subscription ? {
        id: subscription.id,
        planType: subscription.planType,
        status: subscription.status,
        renewalDate: subscription.renewalDate,
        amount: subscription.amount
      } : null,
      scores: (scores || []).map(s => ({
        id: s.id,
        score: s.score,
        date: s.date
      }))
    };

    res.json({ success: true, data: formattedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, charityId, donationPct } = req.body;
    const userId = req.user.id;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (charityId !== undefined) {
      if (charityId && charityId !== '') {
        const { data: charityCheck } = await supabase.from('Charity').select('id').eq('id', charityId).maybeSingle();
        if (!charityCheck) {
          return res.status(400).json({ success: false, message: 'Selected charity does not exist' });
        }
        updates.charityId = charityId;
      } else {
        updates.charityId = null;
      }
    }
    if (donationPct !== undefined) {
      const pct = parseInt(donationPct);
      if (pct < 10) {
        return res.status(400).json({ success: false, message: 'Donation percentage must be at least 10%' });
      }
      updates.donationPct = pct;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    updates.updatedAt = new Date().toISOString();

    const { data: user, error: updateError } = await supabase
      .from('User')
      .update(updates)
      .eq('id', userId)
      .select('id, name, email, role, donationPct, charityId, createdAt')
      .single();

    if (updateError || !user) {
      console.error('Profile Update Error:', updateError);
      return res.status(500).json({ success: false, message: 'Database error updating profile' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('[Auth Controller] Update profile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Old password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const { data: user, error: userError } = await supabase.from('User').select('password').eq('id', userId).single();
    if (userError || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    const { error: updateError } = await supabase
      .from('User')
      .update({ password: hashed, updatedAt: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Password Change Error:', updateError);
      return res.status(500).json({ success: false, message: 'Database error updating password' });
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('[Auth Controller] Change password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const { data: user } = await supabase.from('User').select('id').eq('email', email).maybeSingle();
    if (!user) {
      return res.status(404).json({ success: false, message: 'If that email exists, a reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 3600000).toISOString();

    const { error } = await supabase
      .from('User')
      .update({ resetToken, resetExpiry })
      .eq('id', user.id);

    if (error) {
      console.error('Forgot Password Error:', error);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    res.json({ success: true, message: 'If that email exists, a reset link has been sent', resetToken });
  } catch (err) {
    console.error('[Auth Controller] Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, resetExpiry')
      .eq('resetToken', token)
      .maybeSingle();

    if (userError || !user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (new Date(user.resetExpiry) < new Date()) {
      return res.status(400).json({ success: false, message: 'Reset token has expired' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    const { error: updateError } = await supabase
      .from('User')
      .update({ password: hashed, resetToken: null, resetExpiry: null, updatedAt: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Reset Password Error:', updateError);
      return res.status(500).json({ success: false, message: 'Database error resetting password' });
    }

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('[Auth Controller] Reset password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { signup, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword };
