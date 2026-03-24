# 🛠️ MapParser Tech Stack

This document serves as the technical single-source-of-truth for the MapParser ecosystem, covering Web, Mobile, and Backend infrastructure.

---

## 💻 Frontend (Web / App UI)

The MapParser frontend is built for high-performance rendering and a premium, responsive glassmorphism aesthetic.

*   **Core Architecture**: [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
*   **Language**: [TypeScript (Strict Mode)](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with custom glass-panel utilities.
*   **Animations**: [Framer Motion](https://www.framer.com/motion/) for micro-interactions and route transitions.
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Mobile Features**: `qrcode.react` for dynamic app-store link generation.
*   **Maps Integration**:
    *   [React Leaflet](https://react-leaflet.js.org/): For high-performance OpenStreetMap (OSM) visualizations.
    *   [@react-google-maps/api](https://www.npmjs.com/package/@react-google-maps/api): For official Google Maps interactive previews.

---

## 📱 Native Mobile (Capacitor)

We leverage Capacitor to ship a single codebase to iOS and Android while maintaining native performance and hardware API access.

*   **Runtime**: [Capacitor 8](https://capacitorjs.com/)
*   **Native Auth**: [@capgo/capacitor-social-login](https://github.com/Capgo/capacitor-social-login)
    *   Handles native Google and Apple Sign-in to bypass mobile WebView security restrictions.
*   **System Integration**:
    *   `@capacitor/status-bar`: Dynamic styling for edge-to-edge mobile layouts.
    *   `@capacitor/browser`: Optimized handling for external map deep-linking.

---

## ⚙️ Backend & API

The backend manages complex URL resolution, geocoding, and secure data persistence.

*   **Runtime**: [Node.js 20+](https://nodejs.org/)
*   **Server Framework**: [Express.js](https://expressjs.com/)
*   **Browser Automation**: [Puppeteer](https://pptr.dev/)
    *   Used to headlessly resolve short-links (`maps.app.goo.gl`) and extract waypoint names from the Google Maps DOM.
*   **Communication**: [Nodemailer](https://nodemailer.com/) for account verification and password recovery.

---

## 🗄️ Database & Persistence

*   **Engine**: [SQLite](https://www.sqlite.org/index.html) (`sqlite3`)
*   **Management**: Custom persistence layer in `server/database.js` with automatic schema migrations.
*   **Data Structure**:
    *   `users`: Secure profile management with `bcryptjs` password hashing.
    *   `trips`: Storage for routes, geo-metadata, and user notes.
    *   `verification_codes`: Transient session storage for security protocols.

---

## 🔐 Authentication & Security

*   **OAuth 2.0**: Support for Google and Apple identities.
*   **JWT Sessions**: JSON Web Tokens for secure API communication between clients and the backend.
*   **CORS & SRI**: Configured for secure cross-origin requests and sub-resource integrity.

---

## 🚀 Deployment Infrastructure

*   **Architecture**: AWS EC2 (Ubuntu 22.04 LTS)
*   **Process Management**: [PM2](https://pm2.io/) with automatic restart and cluster mode.
*   **Reverse Proxy**: [Nginx](https://www.nginx.com/) with SSL termination.
*   **SSL**: Let's Encrypt managed via Certbot.

