# Tech Stack

This document outlines the technologies and libraries used in the MapParser project.

## Frontend

*   **Framework**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Maps**:
    *   [React Leaflet](https://react-leaflet.js.org/) (OpenStreetMap integration)
    *   [@react-google-maps/api](https://www.npmjs.com/package/@react-google-maps/api) (Google Maps integration)

## Native Mobile (Capacitor)

*   **Runtime**: [Capacitor 8](https://capacitorjs.com/)
*   **Social Login**: [@capgo/capacitor-social-login](https://github.com/Capgo/capacitor-social-login) (Native Google and Apple authentication)
*   **Plugins**: 
    *   `@capacitor/status-bar`: Managing safe area insets and visibility
    *   `@capacitor/browser`: External map links handling

## Backend

*   **Runtime**: [Node.js 20+](https://nodejs.org/)
*   **Server Framework**: [Express.js](https://expressjs.com/)
*   **Browser Automation**: [Puppeteer](https://pptr.dev/) (Resolving complex Google Maps URLs)
*   **Email Service**: [Nodemailer](https://nodemailer.com/)

## Database

*   **Engine**: [SQLite](https://www.sqlite.org/index.html) (`sqlite3`)
*   **Management**: Custom SQL queries via `server/database.js`
*   **Data Models**:
    *   `users`: Authentication data & profiles
    *   `trips`: Saved routes, notes, and metadata
    *   `verification_codes`: Temporary codes for password resets

## Authentication Logic

*   **Web**: `@react-oauth/google` and `react-apple-signin-auth`
*   **Mobile**: Native SDKs via the `CapacitorSocialLogin` plugin
*   **Backend Verification**: JWT-based sessions and token verification for both Web and Native clients.

## Development Commands

*   **Local Dev**: `npm run dev`
*   **Build**: `npm run build`
*   **iOS Sync**: `npx cap sync ios`
