import {createRoot} from 'react-dom/client';
import {App} from '/@/App';
import {StrictMode} from 'react';

const rootElem = document.getElementById('app');
if (!rootElem) {
  console.error('Could not find root element');
  throw new Error('Could not find root element');
}
const root = createRoot(rootElem);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
