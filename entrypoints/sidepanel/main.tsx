// entrypoints/sidepanel/main.tsx
// React mount point for the LCO side panel dashboard.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { setStorage, type StorageArea } from '../../lib/conversation-store';
import App from './App';
import './dashboard.css';

// Initialize the storage backend before rendering.
// The side panel is an extension page with full chrome.* access.
setStorage(chrome.storage.local as unknown as StorageArea);

const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
