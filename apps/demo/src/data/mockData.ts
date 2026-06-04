// ─── Chart data ──────────────────────────────────────────────────────────────

export const monthlyData = [
  { label: 'Jan', sessions: 42100, users: 28400 },
  { label: 'Feb', sessions: 38600, users: 24100 },
  { label: 'Mar', sessions: 51200, users: 33800 },
  { label: 'Apr', sessions: 47300, users: 31200 },
  { label: 'May', sessions: 62400, users: 40100 },
  { label: 'Jun', sessions: 58700, users: 37300 },
  { label: 'Jul', sessions: 70100, users: 45200 },
  { label: 'Aug', sessions: 66300, users: 42100 },
  { label: 'Sep', sessions: 53800, users: 34600 },
  { label: 'Oct', sessions: 49200, users: 30400 },
  { label: 'Nov', sessions: 41400, users: 26200 },
  { label: 'Dec', sessions: 44100, users: 29300 },
];

export const channelData = [
  { label: 'Organic', visits: 28400 },
  { label: 'Paid', visits: 14200 },
  { label: 'Social', visits: 9800 },
  { label: 'Direct', visits: 7600 },
  { label: 'Email', visits: 5300 },
  { label: 'Referral', visits: 3200 },
];

export const deviceData = [
  { label: 'Desktop', value: 54, color: 'var(--pf-chart-color-1)' },
  { label: 'Mobile', value: 36, color: 'var(--pf-chart-color-2)' },
  { label: 'Tablet', value: 10, color: 'var(--pf-chart-color-3)' },
];

export const sessionDepthData = [
  { label: '1 page', depth: 3200 },
  { label: '2 pages', depth: 5800 },
  { label: '3 pages', depth: 7100 },
  { label: '4 pages', depth: 6400 },
  { label: '5 pages', depth: 4200 },
  { label: '6 pages', depth: 2600 },
  { label: '7+ pages', depth: 1900 },
];

export const radarData = [
  { label: 'Technology', thisMonth: 82, lastMonth: 74 },
  { label: 'Design', thisMonth: 71, lastMonth: 68 },
  { label: 'Business', thisMonth: 64, lastMonth: 59 },
  { label: 'Marketing', thisMonth: 78, lastMonth: 72 },
  { label: 'Education', thisMonth: 55, lastMonth: 61 },
  { label: 'Entertainment', thisMonth: 43, lastMonth: 48 },
];

// ─── KPI metrics ─────────────────────────────────────────────────────────────

export const kpiMetrics = [
  {
    heading: 'Total Sessions',
    value: '700,412',
    trendLabel: '+12.4%',
    trend: 'positive' as const,
    iconName: 'chart-bar' as const,
    description: 'vs. last period',
  },
  {
    heading: 'Unique Users',
    value: '248,903',
    trendLabel: '+8.1%',
    trend: 'positive' as const,
    iconName: 'user' as const,
    description: 'vs. last period',
  },
  {
    heading: 'Revenue',
    value: '$48,240',
    trendLabel: '+5.3%',
    trend: 'positive' as const,
    iconName: 'credit-card' as const,
    description: 'vs. last period',
  },
  {
    heading: 'Conv. Rate',
    value: '3.2%',
    trendLabel: '-0.4%',
    trend: 'negative' as const,
    iconName: 'circle-check' as const,
    description: 'vs. last period',
  },
];

// ─── Table data ───────────────────────────────────────────────────────────────

export interface Signup {
  id: string;
  name: string;
  email: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: 'Active' | 'Pending' | 'Churned';
  date: string;
  country: string;
}

export const recentSignups: Signup[] = [
  {
    id: '1',
    name: 'Sofia Reyes',
    email: 'sofia@acme.co',
    plan: 'Pro',
    status: 'Active',
    date: 'Jun 2, 2026',
    country: 'Mexico',
  },
  {
    id: '2',
    name: 'Marcus Webb',
    email: 'mwebb@startup.io',
    plan: 'Enterprise',
    status: 'Active',
    date: 'Jun 2, 2026',
    country: 'United States',
  },
  {
    id: '3',
    name: 'Yuki Tanaka',
    email: 'yuki.t@gmail.com',
    plan: 'Free',
    status: 'Pending',
    date: 'Jun 1, 2026',
    country: 'Japan',
  },
  {
    id: '4',
    name: 'Priya Sharma',
    email: 'priya@design.co',
    plan: 'Pro',
    status: 'Active',
    date: 'Jun 1, 2026',
    country: 'India',
  },
  {
    id: '5',
    name: 'Carlos Mendes',
    email: 'carlos@ventura.br',
    plan: 'Pro',
    status: 'Active',
    date: 'May 31, 2026',
    country: 'Brazil',
  },
  {
    id: '6',
    name: 'Anya Müller',
    email: 'anya.m@tech.de',
    plan: 'Free',
    status: 'Churned',
    date: 'May 30, 2026',
    country: 'Germany',
  },
  {
    id: '7',
    name: 'James Okafor',
    email: 'james@fintech.ng',
    plan: 'Enterprise',
    status: 'Active',
    date: 'May 29, 2026',
    country: 'Nigeria',
  },
  {
    id: '8',
    name: 'Lea Fontaine',
    email: 'lea.f@studio.fr',
    plan: 'Pro',
    status: 'Pending',
    date: 'May 28, 2026',
    country: 'France',
  },
];

// ─── Top pages ───────────────────────────────────────────────────────────────

export const topPages = [
  { page: '/home', views: 48200, unique: 31400, bounce: 28, avgTime: '2m 14s' },
  { page: '/pricing', views: 22100, unique: 18700, bounce: 34, avgTime: '3m 42s' },
  { page: '/docs/getting-started', views: 18400, unique: 14200, bounce: 19, avgTime: '6m 08s' },
  { page: '/blog/design-tokens', views: 14700, unique: 11900, bounce: 41, avgTime: '4m 32s' },
  { page: '/changelog', views: 11200, unique: 9400, bounce: 52, avgTime: '1m 58s' },
  { page: '/docs/components', views: 10800, unique: 8600, bounce: 22, avgTime: '5m 17s' },
  { page: '/about', views: 9300, unique: 7800, bounce: 47, avgTime: '1m 44s' },
  { page: '/contact', views: 7600, unique: 6900, bounce: 61, avgTime: '1m 12s' },
  { page: '/integrations', views: 6800, unique: 5700, bounce: 38, avgTime: '3m 05s' },
  { page: '/security', views: 5400, unique: 4800, bounce: 44, avgTime: '2m 38s' },
];

// ─── Goals ───────────────────────────────────────────────────────────────────

export const goals = [
  { label: 'Lead generation', value: 78, max: 100 },
  { label: 'Newsletter signups', value: 45, max: 100 },
  { label: 'Trial starts', value: 62, max: 100 },
  { label: 'Plan upgrades', value: 29, max: 100 },
];
