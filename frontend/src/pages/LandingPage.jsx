import { Link } from 'react-router-dom';
import { Zap, Shield, Trophy, Heart, Star, ArrowRight, CheckCircle, TrendingUp, Users, Gift } from 'lucide-react';

const features = [
  { icon: Trophy, title: 'Monthly Lucky Draw', desc: 'Submit your scores and automatically enter every monthly draw. Match 3, 4, or 5 numbers to win prize tiers.' },
  { icon: Heart, title: 'Charity First', desc: 'A portion of every subscription goes directly to your chosen charity. Make an impact while you play.' },
  { icon: Shield, title: 'Verified Payouts', desc: 'All winners are verified by our admin team. Transparent, fair, and fully audited prize distribution.' },
  { icon: TrendingUp, title: 'Track Everything', desc: 'Your personal dashboard shows scores, draw history, winnings, and charity contributions in real-time.' },
  { icon: Users, title: 'Community Pool', desc: 'Prize pools grow with every subscriber. The more members, the bigger the jackpot.' },
  { icon: Gift, title: 'Jackpot Rollover', desc: 'No 5-match winner? The jackpot rolls over to next month, building a massive prize for lucky winners.' },
];

const plans = [
  {
    name: 'Monthly',
    price: '$9.99',
    period: '/month',
    desc: 'Perfect for trying out the platform',
    features: ['5 score submissions/month', 'Monthly draw participation', 'Charity contributions', 'Draw history & analytics'],
    cta: 'Start Monthly',
    popular: false,
  },
  {
    name: 'Yearly',
    price: '$99.99',
    period: '/year',
    desc: 'Save 17% — best value',
    features: ['5 score submissions/month', 'Priority draw participation', 'Charity contributions', 'Advanced analytics', '2 months free'],
    cta: 'Get Yearly',
    popular: true,
  }
];

const stats = [
  { value: '10K+', label: 'Active Members' },
  { value: '$2.4M', label: 'Total Prizes Paid' },
  { value: '48+', label: 'Monthly Draws Run' },
  { value: '$380K+', label: 'Donated to Charity' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-900 animated-bg relative overflow-hidden">
      {/* Background Orbs */}
      <div className="orb orb-purple w-96 h-96 top-20 -left-48" />
      <div className="orb orb-cyan w-80 h-80 top-40 right-0" />
      <div className="orb orb-pink w-64 h-64 bottom-40 left-1/2" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">Digital Heroes</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-white/60 text-sm font-medium">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#charity" className="hover:text-white transition-colors">Charity</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary text-sm py-2 px-4">Log In</Link>
          <Link to="/signup" className="btn-primary text-sm py-2 px-4">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 text-center px-6 pt-20 pb-32 max-w-5xl mx-auto animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300 text-sm font-medium mb-8">
          <Star className="w-4 h-4" />
          <span>New: Jackpot Rollover — Now $48,000+</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Win Big.{' '}
          <span className="gradient-text">Give Back.</span>
          <br />
          Score Higher.
        </h1>

        <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          The platform where your numbers matter. Submit scores, enter monthly draws, win prizes — and automatically fund the charities you care about.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup" className="btn-primary text-base py-4 px-8 flex items-center gap-2 justify-center">
            Start Winning Today
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="btn-secondary text-base py-4 px-8">
            View Dashboard
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
          {stats.map((s, i) => (
            <div key={i} className="glass-card p-5 text-center">
              <div className="text-3xl font-extrabold gradient-text mb-1">{s.value}</div>
              <div className="text-white/40 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything you need to <span className="gradient-text">win smarter</span></h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">Built for serious players who want full transparency, verified payouts, and a cause worth playing for.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="glass-card-hover p-6 group cursor-default animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))', border: '1px solid rgba(99,102,241,0.3)' }}>
                <f.icon className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-24 bg-surface-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">How the <span className="gradient-text">Draw Works</span></h2>
          <p className="text-white/50 mb-16">Every month, 5 numbers are drawn. Match yours to win.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Submit Your Scores', desc: 'Enter your number (1–45) with a date. Keep your latest 5 active scores for the draw.' },
              { step: '02', title: 'Monthly Draw', desc: '5 random numbers between 1–45 are generated. Your scores are compared automatically.' },
              { step: '03', title: 'Collect Your Prize', desc: 'Match 3, 4, or 5 numbers to win small, medium, or jackpot prizes from the subscription pool.' },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="glass-card p-8 text-center">
                  <div className="text-5xl font-black gradient-text opacity-60 mb-4">{s.step}</div>
                  <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-white/50 text-sm">{s.desc}</p>
                </div>
                {i < 2 && <div className="hidden md:block absolute top-1/2 -right-4 text-white/20 text-2xl">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 px-6 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Simple, <span className="gradient-text">Transparent Pricing</span></h2>
          <p className="text-white/50">Your subscription funds the prize pool AND your chosen charity.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <div key={i} className={`relative p-8 rounded-2xl border transition-all duration-300 ${plan.popular
              ? 'border-primary-500/50 glow-primary'
              : 'border-white/10'
            }`} style={{ background: plan.popular ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)' }}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                    MOST POPULAR
                  </span>
                </div>
              )}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-white/40 text-sm mb-4">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="text-white/40">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className={plan.popular ? 'btn-primary w-full block text-center' : 'btn-secondary w-full block text-center'}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Charity CTA */}
      <section id="charity" className="relative z-10 px-6 py-24">
        <div className="max-w-4xl mx-auto text-center gradient-border p-12">
          <Heart className="w-16 h-16 mx-auto mb-6 text-pink-400" />
          <h2 className="text-4xl font-bold mb-4">Play with <span className="gradient-text-gold">Purpose</span></h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Choose a charity you believe in during signup. Every month, a portion of your subscription goes directly to that cause — automatically, transparently, no extra steps.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm text-white/50">
            {['Children First Foundation', 'Ocean Conservation', 'Mental Health Matters', 'Green Earth Initiative'].map(c => (
              <span key={c} className="px-4 py-2 rounded-full border border-white/10 bg-white/5">{c}</span>
            ))}
          </div>
          <Link to="/signup" className="btn-accent inline-flex items-center gap-2">
            Choose Your Charity
            <Heart className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-8 py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text text-sm">Digital Heroes</span>
          </div>
          <p className="text-white/30 text-sm">© 2026 Digital Heroes. Built for impact.</p>
          <div className="flex gap-6 text-white/40 text-sm">
            <a href="#" className="hover:text-white/70 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/70 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
