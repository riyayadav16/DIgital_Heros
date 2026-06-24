const crypto = require('crypto');

const checkSubscriptionStatus = async (supabase, userId) => {
  const { data: subscription } = await supabase
    .from('Subscription')
    .select('id, status, renewalDate')
    .eq('userId', userId)
    .maybeSingle();

  if (!subscription) return null;

  if (subscription.status === 'ACTIVE' && new Date(subscription.renewalDate) < new Date()) {
    await supabase
      .from('Subscription')
      .update({ status: 'INACTIVE' })
      .eq('id', subscription.id);
    return { ...subscription, status: 'INACTIVE' };
  }

  return subscription;
};

module.exports = { checkSubscriptionStatus };
