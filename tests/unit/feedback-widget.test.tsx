// @vitest-environment happy-dom

// vi.hoisted runs before static imports, so chrome is defined before FeedbackWidget
// evaluates its module-level VERSION constant.
import { vi, describe, it, expect, afterEach } from 'vitest';

vi.hoisted(() => {
    (globalThis as unknown as Record<string, unknown>).chrome = {
        runtime: { getManifest: () => ({ version: '0.1.0' }) },
    };
});

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FeedbackWidget from '../../entrypoints/sidepanel/components/FeedbackWidget';

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('FeedbackWidget', () => {
    it('renders the idle trigger link on mount', () => {
        render(<FeedbackWidget />);
        expect(screen.getByText('Having an issue? Send feedback')).toBeTruthy();
    });

    it('opens the form when the trigger is clicked', () => {
        render(<FeedbackWidget />);
        fireEvent.click(screen.getByText('Having an issue? Send feedback'));
        expect(screen.getByPlaceholderText("What's wrong? Describe the issue.")).toBeTruthy();
    });

    it('Send button is disabled when textarea is empty', () => {
        render(<FeedbackWidget />);
        fireEvent.click(screen.getByText('Having an issue? Send feedback'));
        expect((screen.getByText('Send') as HTMLButtonElement).disabled).toBe(true);
    });

    it('does not POST when message is only whitespace', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        render(<FeedbackWidget />);
        fireEvent.click(screen.getByText('Having an issue? Send feedback'));
        fireEvent.change(screen.getByPlaceholderText("What's wrong? Describe the issue."), {
            target: { value: '   ' },
        });
        await act(async () => { fireEvent.click(screen.getByText('Send')); });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not POST when message exceeds 2000 characters', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        render(<FeedbackWidget />);
        fireEvent.click(screen.getByText('Having an issue? Send feedback'));
        fireEvent.change(screen.getByPlaceholderText("What's wrong? Describe the issue."), {
            target: { value: 'a'.repeat(2001) },
        });
        await act(async () => { fireEvent.click(screen.getByText('Send')); });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('shows sent state after a successful POST', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
        render(<FeedbackWidget />);
        fireEvent.click(screen.getByText('Having an issue? Send feedback'));
        fireEvent.change(screen.getByPlaceholderText("What's wrong? Describe the issue."), {
            target: { value: 'Something is broken' },
        });
        await act(async () => { fireEvent.click(screen.getByText('Send')); });
        expect(screen.getByText("Sent. We'll fix it fast.")).toBeTruthy();
    });

    it('resets to idle 4 seconds after sent', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
        render(<FeedbackWidget />);
        fireEvent.click(screen.getByText('Having an issue? Send feedback'));
        fireEvent.change(screen.getByPlaceholderText("What's wrong? Describe the issue."), {
            target: { value: 'Something is broken' },
        });
        await act(async () => { fireEvent.click(screen.getByText('Send')); });
        expect(screen.getByText("Sent. We'll fix it fast.")).toBeTruthy();
        act(() => { vi.advanceTimersByTime(4000); });
        expect(screen.getByText('Having an issue? Send feedback')).toBeTruthy();
    });

    it('does not throw when unmounted while the 4s reset timer is pending', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
        const { unmount } = render(<FeedbackWidget />);
        fireEvent.click(screen.getByText('Having an issue? Send feedback'));
        fireEvent.change(screen.getByPlaceholderText("What's wrong? Describe the issue."), {
            target: { value: 'test' },
        });
        await act(async () => { fireEvent.click(screen.getByText('Send')); });
        expect(screen.getByText("Sent. We'll fix it fast.")).toBeTruthy();
        unmount();
        expect(() => act(() => { vi.advanceTimersByTime(4000); })).not.toThrow();
    });

    it('shows error state when fetch throws (network offline)', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
        render(<FeedbackWidget />);
        fireEvent.click(screen.getByText('Having an issue? Send feedback'));
        fireEvent.change(screen.getByPlaceholderText("What's wrong? Describe the issue."), {
            target: { value: 'broken' },
        });
        await act(async () => { fireEvent.click(screen.getByText('Send')); });
        expect(screen.getByText('Failed to send. Try again?')).toBeTruthy();
    });

    it('shows error state when server returns non-ok status', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422 }));
        render(<FeedbackWidget />);
        fireEvent.click(screen.getByText('Having an issue? Send feedback'));
        fireEvent.change(screen.getByPlaceholderText("What's wrong? Describe the issue."), {
            target: { value: 'broken' },
        });
        await act(async () => { fireEvent.click(screen.getByText('Send')); });
        expect(screen.getByText('Failed to send. Try again?')).toBeTruthy();
    });

    it('Cancel resets to idle without POSTing', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        render(<FeedbackWidget />);
        fireEvent.click(screen.getByText('Having an issue? Send feedback'));
        fireEvent.change(screen.getByPlaceholderText("What's wrong? Describe the issue."), {
            target: { value: 'typed something' },
        });
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.getByText('Having an issue? Send feedback')).toBeTruthy();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('POSTs with message, version, and correct subject line', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true });
        vi.stubGlobal('fetch', fetchMock);
        render(<FeedbackWidget />);
        fireEvent.click(screen.getByText('Having an issue? Send feedback'));
        fireEvent.change(screen.getByPlaceholderText("What's wrong? Describe the issue."), {
            target: { value: 'overlay not showing' },
        });
        await act(async () => { fireEvent.click(screen.getByText('Send')); });
        expect(fetchMock).toHaveBeenCalledOnce();
        const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
        const body = JSON.parse(options.body as string);
        expect(body.message).toBe('overlay not showing');
        expect(body.version).toBe('0.1.0');
        expect(body._subject).toBe('Saar Feedback v0.1.0');
    });
});
