import React, { useState, useEffect } from 'react';
import Drawer from './drawer';
import TopBar from './topbar';

export default function Layout({ children }) {
    const [toggled, setToggled] = useState(false);

    const handleToggleSidebar = (value) => {
        setToggled(value);
    };

    return (
        <div className="app" style={{ height: '100%', display: 'flex' }}>
            <Drawer
                toggled={toggled}
                handleToggleSidebar={handleToggleSidebar}
            />
            <div style={{width: '100%'}}>
                <TopBar handleToggleSidebar={handleToggleSidebar} />
                {children}
            </div>
        </div>
    )
}