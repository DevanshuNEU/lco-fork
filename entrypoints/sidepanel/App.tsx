// entrypoints/sidepanel/App.tsx
// Top-level dashboard component. Uses useDashboardData for all state.

import React from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import Header from './components/Header';
import CollapsibleSection from './components/CollapsibleSection';
import TodayCard from './components/TodayCard';
import ActiveConversation from './components/ActiveConversation';
import ConversationList from './components/ConversationList';

export default function App() {
    const { today, activeConv, activeHealth, conversations, loading } = useDashboardData();

    if (loading) {
        return (
            <div className="lco-dash">
                <Header />
                <div className="lco-dash-loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="lco-dash">
            <Header />

            <CollapsibleSection title="Today" storageKey="today" defaultOpen>
                <TodayCard summary={today} />
            </CollapsibleSection>

            <CollapsibleSection title="Active Conversation" storageKey="active" defaultOpen>
                <ActiveConversation conv={activeConv} health={activeHealth} />
            </CollapsibleSection>

            <CollapsibleSection title="History" storageKey="history" defaultOpen>
                <ConversationList conversations={conversations} />
            </CollapsibleSection>
        </div>
    );
}
