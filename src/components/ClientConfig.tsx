'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export function ClientConfig() {
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            StatusBar.setStyle({ style: Style.Dark }); // Light content
            if (Capacitor.getPlatform() === 'android') {
                StatusBar.setOverlaysWebView({ overlay: true });
            }
        }
    }, []);

    return null;
}
