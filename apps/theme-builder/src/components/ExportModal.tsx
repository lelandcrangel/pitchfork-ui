import {
  PfButton,
  PfCodeSnippet,
  PfModal,
  PfModalBody,
  PfModalFooter,
  PfModalHeader,
} from '@pitchfork-ui/elements-react';

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
    <PfModal
      open
      label="Export theme"
      size="lg"
      onPfOpenChange={(event) => {
        if (!event.detail.open) onClose();
      }}
    >
      <PfModalHeader>
        <strong>Export theme</strong>
        <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--color-semantic-text-muted)' }}>
          Paste this CSS after your <code>@pitchfork-ui/elements/styles.css</code> import, or
          download it as a file.
        </p>
      </PfModalHeader>
      <PfModalBody>
        {/* `title` on the React component; `heading` on the element. */}
        <PfCodeSnippet code={css} language="css" heading="pitchfork-theme.css" />
      </PfModalBody>
      <PfModalFooter>
        <PfButton variant="secondary" onClick={onClose}>
          Close
        </PfButton>
        <PfButton onClick={download}>Download .css</PfButton>
      </PfModalFooter>
    </PfModal>
  );
}
