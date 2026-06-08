import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Icon,
} from '@pitchfork-ui/react';

const meta = {
  title: 'Patterns/Pricing Cards',
  tags: ['test'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─── Data ──────────────────────────────────────────────────────────────────────

interface Tier {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  recommended?: boolean;
}

const tiers: Tier[] = [
  {
    name: 'Starter',
    price: '$0',
    cadence: '/month',
    description: 'For individuals getting started.',
    features: ['1 project', 'Community support', '1 GB storage', 'Basic analytics'],
    cta: 'Get started',
  },
  {
    name: 'Pro',
    price: '$24',
    cadence: '/month',
    description: 'For growing teams that need more.',
    features: [
      'Unlimited projects',
      'Priority support',
      '100 GB storage',
      'Advanced analytics',
      'Custom domains',
    ],
    cta: 'Start free trial',
    recommended: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    description: 'For organizations at scale.',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Unlimited storage',
      'SSO & SAML',
      'Audit logs',
      'SLA guarantee',
    ],
    cta: 'Contact sales',
  },
];

// ─── Styles ────────────────────────────────────────────────────────────────────

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 24,
  // stretch (default) makes every card in a row match the tallest one on desktop;
  // when the grid collapses to a single column each card sizes to its own content.
  alignItems: 'stretch',
  maxWidth: 980,
  margin: '0 auto',
};

const cardBase: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

const recommendedCard: React.CSSProperties = {
  ...cardBase,
  borderColor: 'var(--color-semantic-action-primary)',
  boxShadow: 'var(--pf-elevation-popover-shadow)',
};

// Grows to fill the space between header and footer so the CTAs line up.
const cardContent: React.CSSProperties = {
  flex: 1,
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
};

const tierName: React.CSSProperties = {
  fontSize: 'var(--font-size-lg)',
  fontWeight: 600,
  margin: 0,
};

const priceRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 4,
  marginTop: 12,
};

const priceText: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  margin: 0,
  lineHeight: 1,
};

const cadenceText: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-semantic-text-muted)',
};

const descText: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-semantic-text-muted)',
  margin: '8px 0 0',
};

const featureList: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: 12,
};

const featureItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 'var(--font-size-sm)',
};

const checkIcon: React.CSSProperties = {
  color: 'var(--color-semantic-action-primary)',
  flexShrink: 0,
  display: 'inline-flex',
};

// ─── Card ──────────────────────────────────────────────────────────────────────

function PricingCard({ tier }: { tier: Tier }) {
  return (
    <Card style={tier.recommended ? recommendedCard : cardBase}>
      <CardHeader>
        <div style={headerRow}>
          <h3 style={tierName}>{tier.name}</h3>
          {tier.recommended ? <Badge variant="brand">Recommended</Badge> : null}
        </div>
        <div style={priceRow}>
          <p style={priceText}>{tier.price}</p>
          {tier.cadence ? <span style={cadenceText}>{tier.cadence}</span> : null}
        </div>
        <p style={descText}>{tier.description}</p>
      </CardHeader>

      <CardContent style={cardContent}>
        <ul style={featureList}>
          {tier.features.map((feature) => (
            <li key={feature} style={featureItem}>
              <span style={checkIcon}>
                <Icon name="circle-check" aria-hidden />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button variant={tier.recommended ? 'primary' : 'secondary'} fullWidth>
          {tier.cta}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Story ─────────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <div style={grid}>
      {tiers.map((tier) => (
        <PricingCard key={tier.name} tier={tier} />
      ))}
    </div>
  ),
};
