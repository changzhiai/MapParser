import type { CapacitorConfig } from '@capacitor/cli';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const config: CapacitorConfig = {
  appId: 'org.traveltracker.mapparser',
  appName: 'MapParser',
  webDir: 'dist',
  plugins: {
    SocialLogin: {
      google: {
        webClientId: process.env.VITE_GOOGLE_CLIENT_ID,
        iOSClientId: process.env.VITE_IOS_GOOGLE_CLIENT_ID,
      },
      apple: {
        clientId: process.env.VITE_APPLE_CLIENT_ID,
        useBroadcastChannel: true,
        redirectUrl: process.env.VITE_APPLE_REDIRECT_URI
      }
    },
  },



};

export default config;
