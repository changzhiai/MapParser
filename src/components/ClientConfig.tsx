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
                // Manually extract query params because URL constructor can be picky with custom schemes
                const urlStr = data.url;
                const searchIndex = urlStr.indexOf('?');
                const search = searchIndex !== -1 ? urlStr.substring(searchIndex) : '';

                // Navigate to root with the search params
                navigate('/' + search, { replace: true });
            });
        }
    }, [navigate]);

    return null;
}
