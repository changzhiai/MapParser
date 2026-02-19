'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';

export function ClientConfig() {
    const navigate = useNavigate();

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            StatusBar.setStyle({ style: Style.Dark }); // Light content
            if (Capacitor.getPlatform() === 'android') {
                StatusBar.setOverlaysWebView({ overlay: true });
            }

            // Handle Deep Links
            CapApp.addListener('appUrlOpen', data => {
                console.log('App opened with URL:', data.url);
                // Extract the path and query from the URL
                // Example: org.traveltracker.mapparser://?token=... -> /?token=...
                const url = new URL(data.url);
                const path = url.pathname || '/';
                const search = url.search || '';
                navigate(path + search, { replace: true });
            });
        }
    }, [navigate]);

    return null;
}
