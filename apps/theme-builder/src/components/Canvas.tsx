import { forwardRef } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Input,
  LoadingDots,
  LoadingSkeleton,
  LoadingSpinner,
  RadioGroup,
  Select,
  Switch,
  Tag,
} from '@pitchfork-ui/react';
import './Canvas.css';

interface CanvasProps {
  sections?: string[];
  children?: React.ReactNode;
}

export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({ sections, children }, ref) => {
  const show = (name: string) => !sections || sections.includes(name);

  return (
    <div className="canvas" ref={ref}>
      <div className="canvas__inner">
        {show('Buttons') && (
          <Section title="Buttons">
            <Row wrap>
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button disabled>Disabled</Button>
            </Row>
            <Row wrap>
              <Button size="sm">Small</Button>
              <Button size="sm" variant="secondary">
                Small secondary
              </Button>
              <Button size="lg">Large</Button>
            </Row>
          </Section>
        )}

        {show('Form Controls') && (
          <Section title="Form Controls">
            <Row align="start">
              <Input label="Email address" placeholder="you@example.com" />
              <Input label="Error state" defaultValue="bad input" error="This field is required." />
            </Row>
            <Row align="start">
              <Select
                label="Country"
                options={[
                  { value: 'us', label: 'United States' },
                  { value: 'gb', label: 'United Kingdom' },
                  { value: 'ca', label: 'Canada' },
                ]}
                defaultValue="us"
              />
              <RadioGroup
                legend="Plan"
                name="plan"
                defaultValue="pro"
                options={[
                  { value: 'free', label: 'Free' },
                  { value: 'pro', label: 'Pro' },
                  { value: 'enterprise', label: 'Enterprise' },
                ]}
              />
            </Row>
            <Row>
              <Checkbox label="Remember me" defaultChecked />
              <Checkbox label="Send notifications" />
              <Switch label="Dark mode" />
              <Switch label="Auto-save" defaultChecked />
            </Row>
          </Section>
        )}

        {show('Alerts') && (
          <Section title="Alerts">
            <Alert variant="info" title="Heads up" description="Your trial expires in 3 days." />
            <Alert
              variant="success"
              title="Changes saved"
              description="Your profile has been updated."
            />
            <Alert
              variant="warning"
              title="Storage low"
              description="You have used 90% of your quota."
            />
            <Alert
              variant="danger"
              title="Action required"
              description="Verify your email to continue."
            />
          </Section>
        )}

        {show('Badges & Tags') && (
          <Section title="Badges & Tags">
            <Row wrap>
              <Badge variant="brand">Brand</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="neutral">Neutral</Badge>
            </Row>
            <Row wrap>
              <Tag variant="brand">Brand</Tag>
              <Tag variant="success">Success</Tag>
              <Tag variant="warning">Warning</Tag>
              <Tag variant="danger">Danger</Tag>
              <Tag variant="neutral">Neutral</Tag>
            </Row>
          </Section>
        )}

        {show('Avatar') && (
          <Section title="Avatar">
            <Row>
              <Avatar name="John Smith" size="sm" />
              <Avatar name="John Smith" size="md" />
              <Avatar name="John Smith" size="lg" />
              <Avatar name="John Smith" size="xl" />
            </Row>
            <Row>
              <Avatar name="Online" status="online" />
              <Avatar name="Away" status="away" />
              <Avatar name="Busy" status="busy" />
              <Avatar name="Offline" status="offline" />
            </Row>
          </Section>
        )}

        {show('Card') && (
          <Section title="Card">
            <div className="canvas__card-row">
              <Card>
                <div className="canvas__card-content">
                  <p className="canvas__card-title">Monthly Revenue</p>
                  <p className="canvas__card-value">$12,430</p>
                  <p className="canvas__card-sub">+8.2% from last month</p>
                  <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                    <Button size="sm">View report</Button>
                    <Button size="sm" variant="ghost">
                      Dismiss
                    </Button>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="canvas__card-content">
                  <p className="canvas__card-title">New signups</p>
                  <p className="canvas__card-value">1,284</p>
                  <p className="canvas__card-sub">+3.1% from last month</p>
                  <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                    <Button size="sm">View users</Button>
                    <Button size="sm" variant="ghost">
                      Dismiss
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </Section>
        )}

        {show('Loading') && (
          <Section title="Loading">
            <Row>
              <LoadingSpinner size={16} />
              <LoadingSpinner size={24} />
              <LoadingSpinner size={32} />
              <LoadingDots />
              <LoadingSkeleton style={{ width: 120, height: 16, borderRadius: 4 }} />
            </Row>
          </Section>
        )}

        {children}
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <span className="canvas__section-title">{title}</span>
      </CardHeader>
      <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </CardContent>
    </Card>
  );
}

function Row({
  children,
  wrap,
  align = 'center',
}: {
  children: React.ReactNode;
  wrap?: boolean;
  align?: 'center' | 'start';
}) {
  return (
    <div
      className="canvas__row"
      style={{
        flexWrap: wrap ? 'wrap' : 'nowrap',
        alignItems: align === 'start' ? 'flex-start' : 'center',
      }}
    >
      {children}
    </div>
  );
}
