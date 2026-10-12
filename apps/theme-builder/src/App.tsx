import { useState } from 'react';
import '@pitchfork-ui/elements/styles.css';
import { PfButton, PfSwitch, PfTab, PfTabPanel, PfTabs } from '@pitchfork-ui/elements-react';
import { ExportModal } from './components/ExportModal';
import { useTheme } from './hooks/useTheme';
import { ColorsView } from './views/ColorsView';
import { ComponentsView } from './views/ComponentsView';
import { MotionView } from './views/MotionView';
import { ShadowsView } from './views/ShadowsView';
import { SizeView } from './views/SizeView';
import { TypographyView } from './views/TypographyView';
import './App.css';

/*
 * One list, so the strip and the panels cannot disagree about which views
 * exist -- the `items` array did that job for the React `Tabs` and nothing
 * does it once the two become separate children.
 */
const VIEWS = [
  { value: 'colors', label: 'Colors', View: ColorsView },
  { value: 'motion', label: 'Motion', View: MotionView },
  { value: 'shadows', label: 'Shadows', View: ShadowsView },
  { value: 'size', label: 'Size', View: SizeView },
  { value: 'typography', label: 'Typography', View: TypographyView },
  { value: 'components', label: 'Components', View: ComponentsView },
] as const;

export function App() {
  const theme = useTheme();
  const [showExport, setShowExport] = useState(false);
  const [view, setView] = useState<string>(VIEWS[0].value);
  const modifiedCount = Object.keys(theme.overrides).length;

  return (
    <div className="app">
      <header className="toolbar">
        <div className="toolbar__brand">
          <span className="toolbar__title">Pitchfork UI — Theme Builder</span>
          {modifiedCount > 0 && (
            <span className="toolbar__count">
              {modifiedCount} override{modifiedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="toolbar__actions">
          <PfSwitch
            label="Dark mode"
            checked={theme.darkMode}
            onPfChange={(event) => theme.setDarkMode(event.detail.checked)}
          />
          {modifiedCount > 0 && (
            <PfButton variant="secondary" size="sm" onClick={theme.resetAll}>
              Reset all
            </PfButton>
          )}
          <PfButton size="sm" onClick={() => setShowExport(true)}>
            Export CSS
          </PfButton>
        </div>
      </header>

      {/*
       * The React `Tabs` took an `items` array of `{ value, label, content }`.
       * `pf-tabs` takes the strip and the panels as children, written
       * interleaved -- `pf-tab` assigns itself `slot="tab"` in
       * `connectedCallback`, which is what lets one pair per view land in two
       * different places.
       */}
      <PfTabs className="app-tabs" value={view} onPfChange={(event) => setView(event.detail.value)}>
        {VIEWS.map(({ value, label }) => (
          <PfTab key={value} value={value}>
            {label}
          </PfTab>
        ))}
        {VIEWS.map(({ value, View }) => (
          <PfTabPanel key={value} value={value}>
            <View theme={theme} />
          </PfTabPanel>
        ))}
      </PfTabs>

      {showExport && <ExportModal css={theme.exportCSS()} onClose={() => setShowExport(false)} />}
    </div>
  );
}
