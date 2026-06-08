import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Button,
  Input,
  Modal,
  ProgressSteps,
  Select,
  Switch,
  Textarea,
  type ProgressStepItem,
} from '@pitchfork-ui/react';

const meta = {
  title: 'Patterns/Multi-step Wizard',
  tags: ['test'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─── Styles ────────────────────────────────────────────────────────────────────

const stepBody: React.CSSProperties = {
  display: 'grid',
  gap: 16,
  paddingTop: 8,
};

const formRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 16,
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

const footerBar: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  gap: 8,
};

const reviewList: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  fontSize: 'var(--font-size-sm)',
  margin: 0,
};

const reviewRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  color: 'var(--color-semantic-text-muted)',
};

// ─── Step definitions ──────────────────────────────────────────────────────────

const STEP_LABELS = [
  { title: 'Account', description: 'Your details' },
  { title: 'Workspace', description: 'Team setup' },
  { title: 'Review', description: 'Confirm & finish' },
];

// ─── Wizard ────────────────────────────────────────────────────────────────────

function WizardModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [step, setStep] = useState(0);

  // Form state (carried across steps and shown in review).
  const [name, setName] = useState('Leland Rangel');
  const [email, setEmail] = useState('hello@lelandrangel.com');
  const [workspace, setWorkspace] = useState('Pitchfork');
  const [plan, setPlan] = useState('pro');
  const [invites, setInvites] = useState(true);

  const lastStep = STEP_LABELS.length - 1;
  const isLast = step === lastStep;

  const steps: ProgressStepItem[] = STEP_LABELS.map((s, i) => ({
    title: s.title,
    description: s.description,
    status: i < step ? 'complete' : i === step ? 'current' : 'upcoming',
  }));

  const close = () => {
    onOpenChange(false);
    // Reset after the close animation so reopening starts fresh.
    setTimeout(() => setStep(0), 250);
  };

  const planLabel = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' }[plan] ?? plan;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Set up your account"
      size="lg"
      footer={
        <div style={footerBar}>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            {isLast ? (
              <Button onClick={close}>Finish</Button>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
            )}
          </div>
        </div>
      }
    >
      <ProgressSteps steps={steps} />

      {step === 0 ? (
        <div style={stepBody}>
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      ) : null}

      {step === 1 ? (
        <div style={stepBody}>
          <div style={formRow}>
            <Input
              label="Workspace name"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
            />
            <Select
              label="Plan"
              options={[
                { value: 'free', label: 'Free' },
                { value: 'pro', label: 'Pro' },
                { value: 'enterprise', label: 'Enterprise' },
              ]}
              value={plan}
              onValueChange={setPlan}
            />
          </div>
          <Textarea label="What will you use it for?" placeholder="Optional…" rows={2} />
          <div style={switchRow}>
            <div style={switchMeta}>
              <p style={labelText}>Invite your team</p>
              <p style={hintText}>Send invitations after setup completes.</p>
            </div>
            <Switch
              id="wizard-invites"
              checked={invites}
              onChange={(e) => setInvites(e.target.checked)}
            />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div style={stepBody}>
          <dl style={reviewList}>
            <div style={reviewRow}>
              <dt>Name</dt>
              <dd style={{ margin: 0 }}>{name}</dd>
            </div>
            <div style={reviewRow}>
              <dt>Email</dt>
              <dd style={{ margin: 0 }}>{email}</dd>
            </div>
            <div style={reviewRow}>
              <dt>Workspace</dt>
              <dd style={{ margin: 0 }}>{workspace}</dd>
            </div>
            <div style={reviewRow}>
              <dt>Plan</dt>
              <dd style={{ margin: 0 }}>{planLabel}</dd>
            </div>
            <div style={reviewRow}>
              <dt>Invite team</dt>
              <dd style={{ margin: 0 }}>{invites ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </Modal>
  );
}

function WizardDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Start setup</Button>
      <WizardModal open={open} onOpenChange={setOpen} />
    </>
  );
}

export const Default: Story = {
  render: () => <WizardDemo />,
};
