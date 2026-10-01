import { useState } from 'react';
import {
  PfAvatar,
  PfBadge,
  PfButton,
  PfIcon,
  PfInput,
  PfKbd,
  PfTag,
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
    </main>
  );
}
