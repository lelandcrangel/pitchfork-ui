import { useState } from 'react';
import {
  PfAvatar,
  PfBadge,
  PfButton,
  PfCard,
  PfCardContent,
  PfCardFooter,
  PfCardHeader,
  PfContentDivider,
  PfIcon,
  PfInput,
  PfKbd,
  PfLoadingDots,
  PfLoadingSkeleton,
  PfLoadingSpinner,
  PfScrollArea,
  PfTag,
  PfUtilityButton,
  PfVisuallyHidden,
} from '@pitchfork-ui/elements-react';

/**
 * Every element the library ships, used the way an application would. The
 * point is not to look good — it is that this file compiles, bundles and
 * renders styled output against the published wrapper package.
 */
export function App() {
  const [email, setEmail] = useState('ada@example.com');
  const [tags, setTags] = useState(['design', 'systems']);

  return (
    <main data-testid="app">
      <h1>
        <PfIcon name="circle-check" label="Working" /> React consumer
      </h1>

      <div className="row">
        <PfButton variant="primary">Save</PfButton>
        <PfButton variant="secondary">Cancel</PfButton>
        <PfButton variant="ghost">Skip</PfButton>
        <PfButton variant="destructive">Delete</PfButton>
        <PfButton variant="primary" loading>
          Saving
        </PfButton>
      </div>

      <div className="row">
        <PfBadge>neutral</PfBadge>
        <PfBadge variant="brand">brand</PfBadge>
        <PfBadge variant="success">success</PfBadge>
        <PfBadge variant="warning">warning</PfBadge>
        <PfBadge variant="danger">danger</PfBadge>
      </div>

      <div className="row">
        {tags.map((tag) => (
          <PfTag
            key={tag}
            variant="brand"
            dismissible
            onPfDismiss={() => setTags((current) => current.filter((t) => t !== tag))}
          >
            {tag}
          </PfTag>
        ))}
      </div>

      <div className="row">
        <PfAvatar name="Ada Lovelace" />
        <PfAvatar name="Ada Lovelace" size="lg" status="online" />
        <PfAvatar size="xl" />
      </div>

      <div className="row">
        <PfKbd>Esc</PfKbd>
        <PfKbd size="sm" keys={['⌘', 'K']} />
      </div>

      <div className="row">
        <PfInput
          label="Email"
          description="Changing this updates React state."
          value={email}
          onPfInput={(event) => setEmail(event.detail.value)}
        />
        <p data-testid="echo">{email}</p>
      </div>

      <PfContentDivider />

      <PfCard>
        <PfCardHeader>
          <strong>Card</strong>
          <PfVisuallyHidden> (a grouping surface)</PfVisuallyHidden>
        </PfCardHeader>
        <PfCardContent>
          Three sections, each its own element. A card using only some of them still renders
          correctly.
        </PfCardContent>
        <PfCardFooter>
          <PfButton variant="secondary">Dismiss</PfButton>
          <PfButton variant="primary">Confirm</PfButton>
        </PfCardFooter>
      </PfCard>

      <PfContentDivider>or</PfContentDivider>

      <PfCard>
        <PfCardContent>A card with content alone — no header, no footer.</PfCardContent>
      </PfCard>

      <div className="row">
        <PfLoadingSpinner />
        <PfLoadingSpinner size={40} label="Fetching" />
        <PfLoadingDots size="sm" />
        <PfLoadingDots />
        <PfLoadingDots size="lg" />
      </div>

      <div className="row">
        <PfLoadingSkeleton width={160} height={12} />
        <PfLoadingSkeleton width="40%" rounded />
      </div>

      <div className="row">
        {/* Icon-only, label-only and both: the three slot combinations. */}
        <PfUtilityButton label="Search">
          <PfIcon slot="icon" name="magnifying-glass" />
        </PfUtilityButton>
        <PfUtilityButton variant="brand">Archive</PfUtilityButton>
        <PfUtilityButton variant="destructive" size="sm">
          <PfIcon slot="icon" name="circle-xmark" />
          Delete
        </PfUtilityButton>
      </div>

      <PfScrollArea style={{ height: '80px', maxWidth: '280px' }}>
        <p>
          A scroll area is focusable by default, so it can be scrolled with the arrow keys even when
          it holds no focusable child.
        </p>
        <p>Its scrollbar reserves a gutter rather than overlaying this text.</p>
        <p>Third paragraph, to make sure there is something to scroll to.</p>
      </PfScrollArea>
    </main>
  );
}
