import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App'

import { SocialLogin } from '@capgo/capacitor-social-login';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

if (!googleClientId) {
    console.warn('Google Client ID is missing! Google Login will not work.');
} else {
    console.log('Google Client ID loaded:', googleClientId.substring(0, 10) + '...');
}

// Initialize Social Login
SocialLogin.initialize({
    google: {
        webClientId: googleClientId,
        iOSClientId: import.meta.env.VITE_IOS_GOOGLE_CLIENT_ID, // Optional but good for explicit config
    },
    apple: {
        clientId: 'org.traveltracker.mapparser',
    }
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={googleClientId}>
            <App />
        </GoogleOAuthProvider>
    </StrictMode>,
)
