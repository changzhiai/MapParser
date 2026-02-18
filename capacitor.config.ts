import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.traveltracker.mapparser',
  appName: 'MapParser',
  webDir: 'dist',
  plugins: {},
  server: {
    iosScheme: 'https',
    androidScheme: 'https',
    hostname: 'localhost',
    allowNavigation: [
      'accounts.google.com',
      '*.google.com',
      '*.googleusercontent.com',
      'ssl.gstatic.com'
    ]
  }
};

export default config;
