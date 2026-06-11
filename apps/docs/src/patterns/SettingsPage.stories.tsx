import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  ContentDivider,
  Input,
  SectionHeader,
  Select,
  Switch,
  Tabs,
  Textarea,
} from '@pitchfork-ui/react';

const meta = {
  title: 'Patterns/Settings Page',
  tags: ['test'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─── Shared styles ────────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  maxWidth: 720,
  width: '100%',
};

const section: React.CSSProperties = {
  display: 'grid',
  gap: 16,
  paddingTop: 16,
};

const formRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 16,
};

const saveBar: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  width: '100%',
};

const switchRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
};

const switchMeta: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const labelText: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  fontWeight: 500,
  margin: 0,
};

const hintText: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-semantic-text-muted)',
  margin: 0,
};

// ─── Tab content ──────────────────────────────────────────────────────────────

function SwitchRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={switchRow}>
      <div style={switchMeta}>
        <p style={labelText}>{label}</p>
        <p style={hintText}>{hint}</p>
      </div>
      <Switch id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </div>
  );
}

function ProfileTab() {
  return (
    <div style={section}>
      <div style={formRow}>
        <Input label="First name" defaultValue="John" />
        <Input label="Last name" defaultValue="Smith" />
      </div>
      <Input label="Display name" defaultValue="johnsmith" />
      <Input label="Email address" type="email" defaultValue="john@example.com" />
      <Select
        label="Language"
        options={[
          { value: 'en', label: 'English' },
          { value: 'es', label: 'Español' },
          { value: 'fr', label: 'Français' },
          { value: 'de', label: 'Deutsch' },
        ]}
        defaultValue="en"
      />
      <Textarea
        label="Bio"
        description="Brief description visible on your public profile."
        placeholder="Tell us about yourself…"
        rows={3}
      />
    </div>
  );
}

function NotificationsTab() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [digest, setDigest] = useState(true);
  const [push, setPush] = useState(false);
  const [security, setSecurity] = useState(true);

  return (
    <div style={section}>
      <SectionHeader eyebrow="Email" heading="" />
      <SwitchRow
        id="notif-email"
        label="Email notifications"
        hint="Receive updates and mentions in your inbox."
        checked={emailNotifs}
        onChange={setEmailNotifs}
      />
      <SwitchRow
        id="notif-digest"
        label="Weekly digest"
        hint="A summary of activity sent every Monday."
        checked={digest}
        onChange={setDigest}
      />
      <ContentDivider />
      <SectionHeader eyebrow="Push" heading="" />
      <SwitchRow
        id="notif-push"
        label="Push notifications"
        hint="Alerts in your browser or mobile app."
        checked={push}
        onChange={setPush}
      />
      <SwitchRow
        id="notif-security"
        label="Security alerts"
        hint="Sign-in attempts and account changes."
        checked={security}
        onChange={setSecurity}
      />
    </div>
  );
}

function AppearanceTab() {
  return (
    <div style={section}>
      <Select
        label="Theme"
        options={[
          { value: 'system', label: 'System default' },
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
        defaultValue="system"
      />
      <Select
        label="Density"
        options={[
          { value: 'comfortable', label: 'Comfortable' },
          { value: 'compact', label: 'Compact' },
        ]}
        defaultValue="comfortable"
      />
      <Select
        label="Font size"
        options={[
          { value: 'sm', label: 'Small' },
          { value: 'md', label: 'Medium (default)' },
          { value: 'lg', label: 'Large' },
        ]}
        defaultValue="md"
      />
    </div>
  );
}

// ─── Demo ─────────────────────────────────────────────────────────────────────

const tabs = [
  { value: 'profile', label: 'Profile', content: <ProfileTab /> },
  { value: 'notifications', label: 'Notifications', content: <NotificationsTab /> },
  { value: 'appearance', label: 'Appearance', content: <AppearanceTab /> },
];

function SettingsPageDemo() {
  return (
    <div style={page}>
      <Card>
        <CardContent>
          <Tabs items={tabs} defaultValue="profile" />
        </CardContent>
        <CardFooter>
          <div style={saveBar}>
            <Button variant="secondary">Cancel</Button>
            <Button>Save changes</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export const Default: Story = {
  render: () => <SettingsPageDemo />,
};
