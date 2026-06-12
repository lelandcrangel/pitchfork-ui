import { useState } from 'react';
import '@pitchfork-ui/react/styles.css';
import { Button, Switch, Tabs } from '@pitchfork-ui/react';
import { ExportModal } from './components/ExportModal';
import { useTheme } from './hooks/useTheme';
import { ColorsView } from './views/ColorsView';
import { MotionView } from './views/MotionView';
import { ShadowsView } from './views/ShadowsView';
import { SizeView } from './views/SizeView';
import { TypographyView } from './views/TypographyView';
import './App.css';

export function App() {
  const theme = useTheme();
  const [showExport, setShowExport] = useState(false);
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
          <Switch
            label="Dark mode"
            checked={theme.darkMode}
            onChange={(e) => theme.setDarkMode(e.target.checked)}
          />
          {modifiedCount > 0 && (
            <Button variant="secondary" size="sm" onClick={theme.resetAll}>
              Reset all
            </Button>
          )}
          <Button size="sm" onClick={() => setShowExport(true)}>
            Export CSS
          </Button>
        </div>
      </header>

      <Tabs
        className="app-tabs"
        defaultValue="colors"
        items={[
          {
            value: 'colors',
            label: 'Colors',
            content: <ColorsView theme={theme} />,
          },
          {
            value: 'motion',
            label: 'Motion',
            content: <MotionView theme={theme} />,
          },
          {
            value: 'shadows',
            label: 'Shadows',
            content: <ShadowsView theme={theme} />,
          },
          {
            value: 'size',
            label: 'Size',
            content: <SizeView theme={theme} />,
          },
          {
            value: 'typography',
            label: 'Typography',
            content: <TypographyView theme={theme} />,
          },
        ]}
      />

      {showExport && <ExportModal css={theme.exportCSS()} onClose={() => setShowExport(false)} />}
    </div>
  );
}
