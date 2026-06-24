const supabase = require('../lib/supabaseClient');
const crypto = require('crypto');
const { checkSubscriptionStatus } = require('../utils/subscription');

const PLAN_PRICES = {
  MONTHLY: 9.99,
  YEARLY: 99.99,
};

const subscribe = async (req, res) => {
  try {
    const { planType } = req.body;
    const userId = req.user.id;

    if (!['MONTHLY', 'YEARLY'].includes(planType)) {
      return res.status(400).json({ success: false, message: 'planType must be MONTHLY or YEARLY' });
    }

    const amount = PLAN_PRICES[planType];
    const renewalDate = new Date();
    if (planType === 'MONTHLY') {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    } else {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    }

    const { data: subscription, error: subError } = await supabase
      .from('Subscription')
      .upsert({
        id: crypto.randomUUID(),
        userId: userId,
        planType: planType,
        status: 'ACTIVE',
        amount,
        renewalDate: renewalDate.toISOString(),
        updatedAt: new Date().toISOString()
      }, { onConflict: 'userId' })
      .select('*')
      .single();

    if (subError) {
      console.error(subError);
      return res.status(500).json({ success: false, message: 'Database error creating subscription' });
    }

    await supabase.from('Transaction').insert([{
      id: crypto.randomUUID(),
      userId: userId,
      amount,
      type: 'SUBSCRIPTION',
      note: `${planType} subscription`
    }]);

    if (req.user.charityId) {
      const donationAmt = parseFloat((amount * (req.user.donationPct || 10) / 100).toFixed(2));
      await supabase.from('Transaction').insert([{
        id: crypto.randomUUID(),
        userId: userId,
        amount: donationAmt,
        type: 'CHARITY',
        note: `${req.user.donationPct || 10}% charity donation`
      }]);
    }

    res.json({ success: true, data: { message: 'Subscription activated', subscription } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getStatus = async (req, res) => {
  try {
    const subscription = await checkSubscriptionStatus(supabase, req.user.id);

    if (!subscription) {
      return res.json({ success: true, data: { status: 'INACTIVE' } });
    }

    res.json({ success: true, data: subscription });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const { data: subscription, error: fetchError } = await supabase
      .from('Subscription')
      .select('id')
      .eq('userId', req.user.id)
      .maybeSingle();

    if (fetchError || !subscription) {
      return res.status(404).json({ success: false, message: 'No subscription found' });
    }

    const { error: updateError } = await supabase
      .from('Subscription')
      .update({ status: 'CANCELLED' })
      .eq('userId', req.user.id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ success: false, message: 'Database error cancelling subscription' });
    }

    res.json({ success: true, data: { message: 'Subscription cancelled' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { subscribe, getStatus, cancelSubscription };
