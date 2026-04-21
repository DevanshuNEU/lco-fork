// entrypoints/sidepanel/components/FeedbackWidget.tsx
// Inline feedback widget for the side panel footer.
// Three states: idle (trigger link) -> open (textarea + send) -> sent (confirmation).
// POSTs to Formspree; version is read once at module load from the manifest.

import React, { useState, useEffect } from 'react';

const FORMSPREE_URL = 'https://formspree.io/f/xkokqgal';
const MAX_MESSAGE_LENGTH = 2000;
const VERSION = chrome.runtime.getManifest().version;

type WidgetState = 'idle' | 'open' | 'sending' | 'sent' | 'error';

export default function FeedbackWidget(): React.JSX.Element {
    const [state, setState] = useState<WidgetState>('idle');
    const [message, setMessage] = useState('');

    // Auto-reset to idle 4s after a successful send. Cleans up on unmount.
    useEffect(() => {
        if (state !== 'sent') return;
        const timer = setTimeout(() => setState('idle'), 4000);
        return () => clearTimeout(timer);
    }, [state]);

    const trimmed = message.trim();

    async function submit(): Promise<void> {
        if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return;
        setState('sending');
        try {
            const res = await fetch(FORMSPREE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    message: trimmed,
                    version: VERSION,
                    _subject: `Saar Feedback v${VERSION}`,
                }),
            });
            if (res.ok) {
                setMessage('');
                setState('sent');
            } else {
                setState('error');
            }
        } catch {
            setState('error');
        }
    }

    function reset(): void {
        setMessage('');
        setState('idle');
    }

    if (state === 'idle') {
        return (
            <div className="lco-dash-feedback">
                <button className="lco-dash-feedback-trigger" onClick={() => setState('open')}>
                    Having an issue? Send feedback
                </button>
            </div>
        );
    }

    if (state === 'sent') {
        return (
            <div className="lco-dash-feedback">
                <p className="lco-dash-feedback-sent">Sent. We'll fix it fast.</p>
            </div>
        );
    }

    return (
        <div className="lco-dash-feedback">
            {state === 'error' && (
                <p className="lco-dash-feedback-error">Failed to send. Try again?</p>
            )}
            <textarea
                className="lco-dash-feedback-textarea"
                placeholder="What's wrong? Describe the issue."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                maxLength={MAX_MESSAGE_LENGTH}
                autoFocus
            />
            <div className="lco-dash-feedback-actions">
                <button className="lco-dash-feedback-cancel" onClick={reset}>
                    Cancel
                </button>
                <button
                    className="lco-dash-feedback-send"
                    onClick={submit}
                    disabled={!trimmed || state === 'sending'}
                >
                    {state === 'sending' ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
}
