import { forwardRef } from 'react';
import {
  PfAlert,
  PfAvatar,
  PfBadge,
  PfButton,
  PfCard,
  PfCardContent,
  PfCardHeader,
  PfCheckbox,
  PfInput,
  PfLoadingDots,
  PfLoadingSkeleton,
  PfLoadingSpinner,
  PfOption,
  PfRadioButton,
  PfRadioGroup,
  PfSelect,
  PfSwitch,
  PfTag,
} from '@pitchfork-ui/elements-react';
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
              <PfButton>Primary</PfButton>
              <PfButton variant="secondary">Secondary</PfButton>
              <PfButton variant="ghost">Ghost</PfButton>
              <PfButton variant="destructive">Destructive</PfButton>
              <PfButton disabled>Disabled</PfButton>
            </Row>
            <Row wrap>
              <PfButton size="sm">Small</PfButton>
              <PfButton size="sm" variant="secondary">
                Small secondary
              </PfButton>
              <PfButton size="lg">Large</PfButton>
            </Row>
          </Section>
        )}

        {show('Form Controls') && (
          <Section title="Form Controls">
            <Row align="start">
              <PfInput label="Email address" placeholder="you@example.com" />
              {/*
                `value`, not `defaultValue`: the element holds its own value,
                so there is no uncontrolled/controlled pair to choose between.
                Nothing re-renders this canvas, so nothing writes it back.
              */}
              <PfInput label="Error state" value="bad input" error="This field is required." />
            </Row>
            <Row align="start">
              <PfSelect label="Country" value="us">
                <PfOption value="us">United States</PfOption>
                <PfOption value="gb">United Kingdom</PfOption>
                <PfOption value="ca">Canada</PfOption>
              </PfSelect>
              {/*
                A form-associated custom element gets no radio grouping from
                the browser, so `pf-radio-group` is the form control: it holds
                the one `name` and the one `value`, and each
                `pf-radio-button` only asks to be chosen.
              */}
              <PfRadioGroup legend="Plan" name="plan" value="pro">
                <PfRadioButton value="free">Free</PfRadioButton>
                <PfRadioButton value="pro">Pro</PfRadioButton>
                <PfRadioButton value="enterprise">Enterprise</PfRadioButton>
              </PfRadioGroup>
            </Row>
            <Row>
              <PfCheckbox label="Remember me" checked />
              <PfCheckbox label="Send notifications" />
              <PfSwitch label="Dark mode" />
              <PfSwitch label="Auto-save" checked />
            </Row>
          </Section>
        )}

        {show('Alerts') && (
          <Section title="Alerts">
            <PfAlert
              variant="info"
              heading="Heads up"
              description="Your trial expires in 3 days."
            />
            <PfAlert
              variant="success"
              heading="Changes saved"
              description="Your profile has been updated."
            />
            <PfAlert
              variant="warning"
              heading="Storage low"
              description="You have used 90% of your quota."
            />
            <PfAlert
              variant="danger"
              heading="Action required"
              description="Verify your email to continue."
            />
          </Section>
        )}

        {show('Badges & Tags') && (
          <Section title="Badges & Tags">
            <Row wrap>
              <PfBadge variant="brand">Brand</PfBadge>
              <PfBadge variant="success">Success</PfBadge>
              <PfBadge variant="warning">Warning</PfBadge>
              <PfBadge variant="danger">Danger</PfBadge>
              <PfBadge variant="neutral">Neutral</PfBadge>
            </Row>
            <Row wrap>
              <PfTag variant="brand">Brand</PfTag>
              <PfTag variant="success">Success</PfTag>
              <PfTag variant="warning">Warning</PfTag>
              <PfTag variant="danger">Danger</PfTag>
              <PfTag variant="neutral">Neutral</PfTag>
            </Row>
          </Section>
        )}

        {show('Avatar') && (
          <Section title="Avatar">
            <Row>
              <PfAvatar name="John Smith" size="sm" />
              <PfAvatar name="John Smith" size="md" />
              <PfAvatar name="John Smith" size="lg" />
              <PfAvatar name="John Smith" size="xl" />
            </Row>
            <Row>
              <PfAvatar name="Online" status="online" />
              <PfAvatar name="Away" status="away" />
              <PfAvatar name="Busy" status="busy" />
              <PfAvatar name="Offline" status="offline" />
            </Row>
          </Section>
        )}

        {show('Card') && (
          <Section title="Card">
            <div className="canvas__card-row">
              <PfCard>
                <div className="canvas__card-content">
                  <p className="canvas__card-title">Monthly Revenue</p>
                  <p className="canvas__card-value">$12,430</p>
                  <p className="canvas__card-sub">+8.2% from last month</p>
                  <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                    <PfButton size="sm">View report</PfButton>
                    <PfButton size="sm" variant="ghost">
                      Dismiss
                    </PfButton>
                  </div>
                </div>
              </PfCard>
              <PfCard>
                <div className="canvas__card-content">
                  <p className="canvas__card-title">New signups</p>
                  <p className="canvas__card-value">1,284</p>
                  <p className="canvas__card-sub">+3.1% from last month</p>
                  <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                    <PfButton size="sm">View users</PfButton>
                    <PfButton size="sm" variant="ghost">
                      Dismiss
                    </PfButton>
                  </div>
                </div>
              </PfCard>
            </div>
          </Section>
        )}

        {show('Loading') && (
          <Section title="Loading">
            <Row>
              <PfLoadingSpinner size={16} />
              <PfLoadingSpinner size={24} />
              <PfLoadingSpinner size={32} />
              <PfLoadingDots />
              <PfLoadingSkeleton style={{ width: 120, height: 16, borderRadius: 4 }} />
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
    <PfCard>
      <PfCardHeader>
        <span className="canvas__section-title">{title}</span>
      </PfCardHeader>
      <PfCardContent style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </PfCardContent>
    </PfCard>
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
