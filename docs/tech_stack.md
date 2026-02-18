# Tech Stack

This document outlines the technologies and libraries used in the MapParser project.

## Frontend

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Maps**:
    *   [React Leaflet](https://react-leaflet.js.org/) (OpenStreetMap integration)
    *   [@react-google-maps/api](https://www.npmjs.com/package/@react-google-maps/api) (Google Maps integration)

## Backend

*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Server Framework**: [Express.js](https://expressjs.com/) (Custom server implementation)
*   **Browser Automation**: [Puppeteer](https://pptr.dev/) (Used for scraping and resolving Google Maps URLs server-side)
*   **Email Service**: [Nodemailer](https://nodemailer.com/) (For password reset functionality)

## Database

*   **Engine**: [SQLite](https://www.sqlite.org/index.html) (`sqlite3`)
*   **Management**: Custom SQL queries via `server/database.js`
*   **Data Models**:
    *   `users`: Stores user credentials and authentication data
    *   `trips`: Stores saved routes and metadata
    *   `verification_codes`: Manages email verification codes

## Authentication

*   **Google OAuth**: via `google-auth-library` and `@react-oauth/google`
*   **Apple Sign-In**: via `apple-signin-auth` and `react-apple-signin-auth`
*   **Custom Auth**: Username/Password with `bcryptjs` for hashing

## External Services & APIs

*   **Google Maps**: Used for resolving short links and displaying interactive maps.
*   **OpenStreetMap (Nominatim)**: Used for geocoding and reverse geocoding addresses.
*   **OSRM (Open Source Routing Machine)**: Used for calculating routes and distances when using the OSM view.

## Development & Deployment

*   **Running Locally**: `npm run dev` (Runs Next.js frontend and Express backend concurrently)
*   **Deployment Target**: AWS EC2 (Ubuntu)
*   **Process Management**: PM2
*   **Web Server**: Nginx (Reverse proxy)
