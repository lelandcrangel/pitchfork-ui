import { createRoot } from 'react-dom/client';
import '@pitchfork-ui/elements/styles.css';
import './main.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
