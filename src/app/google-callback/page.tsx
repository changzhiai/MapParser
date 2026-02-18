'use client';

import { useEffect } from 'react';

export default function GoogleCallback() {
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            console.log('Token found, attempting redirect...');
            const appUrl = `org.traveltracker.mapparser://oauth-callback${hash}`;

            // Attempt auto-redirect
            window.location.href = appUrl;

            // Always show the button after a short delay
            setTimeout(() => {
                const btn = document.getElementById('manual-redirect');
                if (btn) {
                    btn.style.opacity = '1';
                    btn.style.transform = 'translateY(0)';
                }
            }, 500);
        }
    }, []);

    const handleManualRedirect = () => {
        const hash = window.location.hash;
        window.location.href = `org.traveltracker.mapparser://oauth-callback${hash}`;
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#09090b',
            color: '#fff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            textAlign: 'center',
            padding: '20px'
        }}>
            <div style={{ maxWidth: '400px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
                <h2 style={{ marginBottom: '10px', fontSize: '24px' }}>Login Successful</h2>
                <p style={{ color: '#a1a1aa', marginBottom: '40px', lineHeight: '1.5' }}>
                    We've verified your account. Please tap the button below to return to the MapParser app.
                </p>

                <button
                    id="manual-redirect"
                    onClick={handleManualRedirect}
                    style={{
                        opacity: '0',
                        transform: 'translateY(10px)',
                        transition: 'all 0.4s ease',
                        padding: '16px 32px',
                        backgroundColor: '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '18px',
                        width: '100%',
                        boxShadow: '0 10px 25px -3px rgba(79, 70, 229, 0.4)'
                    }}
                >
                    Return to MapParser App
                </button>
            </div>
        </div>
    );
}
