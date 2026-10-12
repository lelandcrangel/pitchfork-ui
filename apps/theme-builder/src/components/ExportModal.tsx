import { PfButton } from '@pitchfork-ui/elements-react';
/*
 * TODO(pitchfork-ui): still on @pitchfork-ui/react, which is being retired.
 * Each of these needs the call site reshaped by hand -- see Foundations/Migrating in Storybook.
 *
 * - CodeSnippet: the call site changes shape: title -> needs a destination; onCodeCopy -> no matching event on pf-code-snippet; pick the right one
 * - Modal: the call site changes shape: title -> needs a destination; description -> needs a destination; footer -> needs a destination
 */
import { CodeSnippet, Modal } from '@pitchfork-ui/react';

interface Props {
  css: string;
  onClose: () => void;
}

export function ExportModal({ css, onClose }: Props) {
  function download() {
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pitchfork-theme.css';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title="Export theme"
      description="Paste this CSS after your @pitchfork-ui/react/styles.css import, or download it as a file."
      size="lg"
    >
      <CodeSnippet code={css} language="css" title="pitchfork-theme.css" />
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <PfButton variant="secondary" onClick={onClose}>
          Close
        </PfButton>
        <PfButton onClick={download}>Download .css</PfButton>
      </div>
    </Modal>
  );
}
