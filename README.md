# MapParser

**MapParser** is a modern, beautiful web tool designed to bridge the gap between shared Google Maps routes and your personal Google My Maps. Use it to extract waypoints from directions links and export them for easy import into other tools.

## Features

- **Instant Analysis**: Paste any Google Maps direction link (e.g., `https://maps.app.goo.gl/...`), and MapParser instantly extracts the waypoints and coordinates.
- **Route Preview**:
  - **OpenStreetMap**: View your route immediately on an interactive OpenStreetMap (powered by Leaflet).
  - **Google Maps**: Toggle a Google Maps view for familiar navigation (requires API key).
- **Privacy First**: All processing happens on demand in your browser or via serverless functions; no personal location data is stored permanently.
- **Export Options**:
  - **CSV**: optimized for the Google My Maps "Import" feature.
  - **KML**: Standard geospatial format for Google Earth and other GIS tools.
- **Premium Design**: A dark, glassmorphism-inspired UI with smooth Framer Motion animations.

## How to use

### Prerequisites

- Node.js installed.
- (Optional) A Google Maps Javascript API Key if you want to use the Google Maps preview feature. Add it to a `.env.local` file:
  ```bash
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
  ```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/changzhiai/MapParser.git
   cd MapParser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

5. Paste a shared Google Maps link (e.g. from the mobile app's "Share Directions" button).

6. View the parsed route on the map, and download the CSV or KML file.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Maps**:
  - `leaflet` & `react-leaflet` for OpenStreetMap.
  - `@react-google-maps/api` for Google Maps integration.
- **Styling**: Vanilla CSS (CSS Modules / Global Styles) with CSS Variables.
- **Icons**: Lucide React.
- **Animations**: Framer Motion.
