# MapBridge

**MapBridge** is a beautiful, modern web tool designed to bridge the gap between shared Google Maps routes and your personal Google My Maps. 

## Features

- **Instant Analysis**: Paste any Google Maps direction link (e.g., `https://maps.app.goo.gl/...`), and MapBridge instantly extracts the waypoints.
- **Privacy First**: All processing happens on demand; no data is stored permanently.
- **Export Options**:
  - **CSV**: Optimized for Google My Maps "Import" feature.
  - **KML**: Standard geospatial format for Google Earth and other tools.
- **Premium Design**: A dark, glassmorphism-inspired UI with smooth animations.

## How to use

1. Run the development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) with your browser.
3. Paste a shared Google Maps link.
4. Download the CSV.
5. Go to [Google My Maps](https://google.com/mymaps), create a new map, and import the CSV.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Vanilla CSS (CSS Modules / Global Styles) with CSS Variables for theming.
- **Icons**: Lucide React
- **Animations**: Framer Motion
