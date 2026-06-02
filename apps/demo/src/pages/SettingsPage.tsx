import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CreditCard,
  Input,
  PageHeader,
  Select,
  SectionHeader,
  Switch,
  Tabs,
  Textarea,
} from '@pitchfork-ui/react';
import { useNotifications } from '../context/NotificationContext';

const timezoneOptions = [
  { value: 'utc-8', label: 'Pacific Time (UTC-8)' },
  { value: 'utc-5', label: 'Eastern Time (UTC-5)' },
  { value: 'utc+0', label: 'UTC' },
  { value: 'utc+1', label: 'Central European Time (UTC+1)' },
  { value: 'utc+5:30', label: 'India Standard Time (UTC+5:30)' },
  { value: 'utc+9', label: 'Japan Standard Time (UTC+9)' },
];

function ProfileTab() {
  const { push } = useNotifications();
  const [name, setName] = useState('Leland Rangel');
  const [email, setEmail] = useState('lelandrangel@proton.me');
  const [company, setCompany] = useState('Pitchfork Labs');
  const [timezone, setTimezone] = useState('utc-8');
  const [bio, setBio] = useState('');

  const handleSave = () => {
    push({ variant: 'success', heading: 'Profile saved', description: 'Your changes have been applied.' });
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)', maxWidth: 560 }}>
      <div className="demo-grid-2">
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
      <Select
        label="Timezone"
        options={timezoneOptions}
        value={timezone}
        onValueChange={setTimezone}
      />
      <Textarea
        label="Bio"
        description="A short description shown on your public profile."
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={4}
        placeholder="Tell us a bit about yourself…"
      />
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Button onClick={handleSave}>Save changes</Button>
        <Button variant="secondary" onClick={() => {}}>Cancel</Button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const { push } = useNotifications();
  const [prefs, setPrefs] = useState({
    weeklyDigest: true,
    productUpdates: true,
    newSignups: false,
    goalAlerts: true,
    securityAlerts: true,
    marketingEmails: false,
  });

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    push({ variant: 'success', heading: 'Preferences saved', description: 'Notification settings updated.' });
  };

  const items: { key: keyof typeof prefs; label: string; description: string }[] = [
    { key: 'weeklyDigest', label: 'Weekly digest', description: 'A summary of your key metrics every Monday.' },
    { key: 'productUpdates', label: 'Product updates', description: 'New features, improvements, and changelog entries.' },
    { key: 'newSignups', label: 'New signups', description: 'Notify me whenever a new user creates an account.' },
    { key: 'goalAlerts', label: 'Goal alerts', description: 'Alert me when a goal reaches its threshold.' },
    { key: 'securityAlerts', label: 'Security alerts', description: 'Unusual login activity or API key usage.' },
    { key: 'marketingEmails', label: 'Marketing emails', description: 'Tips, case studies, and promotional content.' },
  ];

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)', maxWidth: 560 }}>
      <Card>
        <CardContent>
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {items.map((item, i) => (
              <div key={item.key}>
                {i > 0 && (
                  <div style={{ borderTop: '1px solid var(--color-semantic-border-default)', marginBottom: 'var(--space-4)' }} />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                  <div>
                    <div style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>{item.label}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-semantic-text-muted)', marginTop: 'var(--space-1)' }}>{item.description}</div>
                  </div>
                  <Switch
                    checked={prefs[item.key]}
                    onChange={() => toggle(item.key)}
                    aria-label={item.label}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div>
        <Button onClick={handleSave}>Save preferences</Button>
      </div>
    </div>
  );
}

function BillingTab() {
  const { push } = useNotifications();

  const handleUpgrade = () => {
    push({ variant: 'info', heading: 'Coming soon', description: 'Plan management will be available shortly.' });
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-5)', maxWidth: 560 }}>
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-semantic-text-muted)', marginBottom: 'var(--space-1)' }}>Current plan</div>
              <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>Pro</span>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-semantic-text-muted)', marginLeft: 'var(--space-2)' }}>$49 / month</span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleUpgrade}>Upgrade to Enterprise</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-semantic-text-muted)', marginBottom: 'var(--space-3)' }}>Included in your plan</div>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {['Up to 5 team members', '100k sessions / month', '12-month data retention', 'Email support'].map((feat) => (
              <div key={feat} style={{ fontSize: 'var(--font-size-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-semantic-text-success)' }}>✓</span>
                {feat}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="secondary" onClick={() => push({ variant: 'info', heading: 'Coming soon', description: 'Billing portal launching soon.' })}>
            Manage billing
          </Button>
          <Button variant="ghost" onClick={() => push({ variant: 'info', heading: 'Coming soon', description: 'Invoice download coming soon.' })}>
            Download invoices
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader><SectionHeader heading="Payment method" /></CardHeader>
        <CardContent>
          <CreditCard
            brand="visa"
            cardNumber="4111111111111111"
            cardholderName="Leland Rangel"
            expiry="09/28"
            masked
          />
        </CardContent>
      </Card>

    </div>
  );
}

export function SettingsPage() {
  const tabItems = [
    { value: 'profile', label: 'Profile', content: <ProfileTab /> },
    { value: 'notifications', label: 'Notifications', content: <NotificationsTab /> },
    { value: 'billing', label: 'Billing', content: <BillingTab /> },
  ];

  return (
    <div className="demo-section" style={{ gap: 'var(--space-6)' }}>
      <PageHeader
        heading="Settings"
        description="Manage your account, preferences, and billing."
      />
      <Tabs items={tabItems} defaultValue="profile" />
    </div>
  );
}
