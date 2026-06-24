const supabase = require('../lib/supabaseClient');
const crypto = require('crypto');

const generateDrawNumbers = () => {
  const nums = new Set();
  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(nums).sort((a, b) => a - b);
};

const countMatches = (userScores, drawNumbers) => {
  const drawSet = new Set(drawNumbers);
  return userScores.filter(s => drawSet.has(s.score));
};

const calculatePrizePool = (totalRevenue, jackpotCarryover = 0) => {
  const base = totalRevenue + jackpotCarryover;
  return {
    jackpot: parseFloat((base * 0.40).toFixed(2)),   
    medium:  parseFloat((base * 0.35).toFixed(2)),   
    small:   parseFloat((base * 0.25).toFixed(2)),   
  };
};

const simulateDraw = async (month, year) => {
  const numbers = generateDrawNumbers();

  const { data: users, error } = await supabase
    .from('User')
    .select(`
      id, name, email,
      subscriptions:Subscription!inner (status),
      scores:Score (id, score, date)
    `)
    .eq('subscriptions.status', 'ACTIVE');

  if (error) {
    console.error('Error fetching subscribers:', error);
    throw new Error('Database error');
  }

  const subscribers = users || [];

  const tierResults = { 5: [], 4: [], 3: [] };

  for (const user of subscribers) {
    const latestScores = (user.scores || []).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    const matched = countMatches(latestScores, numbers);
    if (matched.length >= 3) {
      const tier = Math.min(matched.length, 5);
      tierResults[tier].push({
        userId: user.id,
        name: user.name,
        email: user.email,
        matchedNumbers: matched.map(s => s.score),
        matchCount: matched.length,
        tier
      });
    }
  }

  const startOfMonth = new Date(year, month - 1, 1).toISOString();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data: transactions } = await supabase
    .from('Transaction')
    .select('amount')
    .eq('type', 'SUBSCRIPTION')
    .gte('createdAt', startOfMonth)
    .lte('createdAt', endOfMonth);

  const totalRevenue = (transactions || []).reduce((sum, t) => sum + t.amount, 0);

  return { numbers, tierResults, totalRevenue, subscribers: subscribers.length };
};

const publishDraw = async (drawId) => {
  const { data: draw, error: drawError } = await supabase
    .from('Draw')
    .select('*')
    .eq('id', drawId)
    .single();

  if (drawError || !draw) throw new Error('Draw not found');
  if (draw.status === 'PUBLISHED') throw new Error('Draw already published');

  const { data: users, error: subError } = await supabase
    .from('User')
    .select(`
      id, name, email,
      subscriptions:Subscription!inner (status),
      scores:Score (id, score, date)
    `)
    .eq('subscriptions.status', 'ACTIVE');

  if (subError) throw new Error('Database error fetching subscribers');

  const subscribers = users || [];

  const tierWinners = { 5: [], 4: [], 3: [] };

  for (const user of subscribers) {
    const latestScores = (user.scores || []).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const matched = countMatches(latestScores, draw.numbers);
    if (matched.length >= 3) {
      const tier = Math.min(matched.length, 5);
      tierWinners[tier].push({
        userId: user.id,
        matchedNumbers: matched.map(s => s.score),
        tier
      });
    }
  }

  const startOfMonth = new Date(draw.year, draw.month - 1, 1).toISOString();
  const endOfMonth = new Date(draw.year, draw.month, 0, 23, 59, 59).toISOString();

  const { data: transactions } = await supabase
    .from('Transaction')
    .select('amount')
    .eq('type', 'SUBSCRIPTION')
    .gte('createdAt', startOfMonth)
    .lte('createdAt', endOfMonth);

  const totalRevenue = (transactions || []).reduce((sum, t) => sum + t.amount, 0);
  const pools = calculatePrizePool(totalRevenue, draw.jackpotCarryover || 0);

  let newCarryover = 0;

  if (tierWinners[5].length === 0) {
    newCarryover = pools.jackpot;
    pools.jackpot = 0;
  }

  const winnerData = [];
  const tierPools = { 5: pools.jackpot, 4: pools.medium, 3: pools.small };

  for (const [tierStr, winners] of Object.entries(tierWinners)) {
    const tier = parseInt(tierStr);
    const pool = tierPools[tier];
    const prizePerWinner = winners.length > 0 ? parseFloat((pool / winners.length).toFixed(2)) : 0;

    for (const w of winners) {
      winnerData.push({
        id: crypto.randomUUID(),
        drawId: draw.id,
        userId: w.userId,
        tier,
        matchedNumbers: w.matchedNumbers,
        prizeAmount: prizePerWinner,
        verificationStatus: 'PENDING',
        payoutStatus: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  await supabase
    .from('Draw')
    .update({
      status: 'PUBLISHED',
      jackpotCarryover: newCarryover,
      totalPool: totalRevenue
    })
    .eq('id', drawId);

  if (winnerData.length > 0) {
    const { data: insertedWinners, error: winnerError } = await supabase
      .from('Winner')
      .insert(winnerData)
      .select('*');

    if (winnerError) {
      console.error('Error inserting winners:', winnerError);
    } else {
      const prizeTransactions = insertedWinners
        .filter(w => w.prizeAmount > 0)
        .map(w => ({
          id: crypto.randomUUID(),
          userId: w.userId,
          amount: w.prizeAmount,
          type: 'PRIZE',
          note: `Draw ${draw.month}/${draw.year} - ${w.tier} matches`
        }));
      
      if (prizeTransactions.length > 0) {
        await supabase.from('Transaction').insert(prizeTransactions);
      }
    }
  }

  const { data: updatedDraw } = await supabase
    .from('Draw')
    .select('*, winners:Winner(*, user:User(id, name, email))')
    .eq('id', drawId)
    .single();

  return {
    draw: updatedDraw,
    jackpotRolledOver: newCarryover > 0
  };
};

module.exports = { generateDrawNumbers, simulateDraw, publishDraw };
