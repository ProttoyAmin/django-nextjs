// ClubsPage.tsx
'use client';

import React from "react";
import Tabs from "../../components/atoms/Tabs";
import ListUserClubs from "./components/ListUserClubs";

const ClubsPage = () => {
    const [activeTab, setActiveTab] = React.useState('your-clubs');

    const items = [
        {
            id: 'feed',
            label: 'Feed',
            content: (
                <div className="p-6 text-center text-gray-500">
                    <h3 className="text-lg font-medium mb-2">Club Feed</h3>
                    <p>Your club feed will appear here</p>
                </div>
            ),
        },
        {
            id: 'your-clubs',
            label: 'Your Clubs',
            content: <ListUserClubs />,
        },
        {
            id: 'all-clubs',
            label: 'All Clubs',
            content: (
                <div className="p-6 text-center text-gray-500">
                    <h3 className="text-lg font-medium mb-2">All Clubs</h3>
                    <p>Browse all available clubs here</p>
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Page Header */}

                {/* Tabs */}
                <div className="rounded-xl shadow-sm p-1">
                    <Tabs
                        items={items}
                        defaultActiveTab={activeTab}
                        onTabChange={(tabId) => setActiveTab(tabId)}
                        variant="underline"
                        orientation="horizontal"
                        size="lg"
                        lazyLoad={true}
                        keepMounted={false}
                    />
                </div>
            </div>
        </div>
    );
};

export default ClubsPage;