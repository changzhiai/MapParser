'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { generateCSV, generateKML, parseMapUrl, Waypoint } from '@/lib/map-parser';
import { MapPinned, ArrowRight, Loader2, CheckCircle, Link as LinkIcon, AlertCircle, FileText, Globe, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// MapView must be loaded dynamically because Leaflet depends on 'window'
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] rounded-xl bg-white/5 animate-pulse flex items-center justify-center text-gray-400">Loading Map...</div>
});

const GoogleMapView = dynamic(() => import('@/components/GoogleMapView'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] rounded-xl bg-white/5 animate-pulse flex items-center justify-center text-gray-400">Loading Google Maps...</div>
});

function MapParserContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [error, setError] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const [mapProvider, setMapProvider] = useState<'osm' | 'google'>('osm');
  const [googleMapMode, setGoogleMapMode] = useState<'embed' | 'interactive'>('interactive');

  const handleAnalyze = async (urlOverride?: string, useBrowser: boolean = false) => {
    const targetUrl = urlOverride || url;
    if (!targetUrl) return;

    setLoading(true);
    setError('');
    setWaypoints([]);
    setAnalyzed(false);

    try {
      // 1. Resolve URL
      // If useBrowser is true (deep link case), use Puppeteer mode. Otherwise default fast mode.
      const apiUrl = `/api/resolve?url=${encodeURIComponent(targetUrl)}${useBrowser ? '&mode=browser' : ''}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to resolve URL');

      // 2. Parse
      const points = parseMapUrl(data.resolvedUrl);

      if (points.length === 0) {
        throw new Error('No waypoints found. Ensure it is a valid Directions link.');
      }

      setWaypoints(points);

      // If we have names but no coordinates (e.g. from a raw directions link), switch to Google Maps 
      // because OSM (Leaflet) requires coordinates, while Google Directions Service can geocode names.
      if (points.length > 0 && !points.some(wp => wp.coords)) {
        setMapProvider('google');
      }

      setAnalyzed(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const queryUrl = searchParams.get('url');
    if (queryUrl) {
      // Reconstruct the URL if it was split by unencoded characters (common issue with deep links)
      let fullUrl = queryUrl;

      // Assume any other query parameters belong to the target URL
      searchParams.forEach((value, key) => {
        if (key !== 'url') {
          fullUrl += `&${key}=${value}`;
        }
      });

      setUrl(fullUrl);

      // DEEP LINK CASE: Use Browser (Puppeteer) mode to ensure detailed expansion
      handleAnalyze(fullUrl, true);
    }
  }, [searchParams]);

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const simpleRouteTitle = waypoints.length > 0
    ? waypoints.map(wp => wp.name).join(' → ')
    : '';

  const labeledRouteTitle = waypoints.length > 0
    ? waypoints.map((wp, i) => `${wp.name} (${String.fromCharCode(65 + i)})`).join(' → ')
    : '';

  const googleMapsUrl = waypoints.length > 0
    ? (url || `https://www.google.com/maps/dir/${waypoints.map(wp => wp.coords ? `${wp.coords.lat},${wp.coords.lng}` : '').filter(Boolean).join('/')}`)
    : '#';

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "MapParser",
            "url": "https://mapparser.travel-tracker.org",
            "creator": "Changzhi Ai",
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "Any",
            "description": "Easily parse and export Google Maps routes to CSV, or KML. Visualize multiple routes and export for Google My Maps.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": "Parse Google Maps URL, Export to KML, Export to CSV, Visualize Route"
          })
        }}
      />
      <div className="background-glow">
        <div className="glow-blob glow-1" />
        <div className="glow-blob glow-2" />
      </div>

      <div className="container">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="hero"
        >
          <div className="title-row">
            <div className="icon-wrapper">
              <MapPinned className="w-10 h-10 text-indigo-400" size={40} color="#818cf8" />
            </div>

            <h1 className="title">
              Map Parser
            </h1>
          </div>

          <p className="subtitle">
            Parse your Google Maps routes<br />
          </p>
        </motion.div>

        <motion.div
          className="search-bar glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <LinkIcon className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="e.g. https://maps.app.goo.gl/..."
            className="search-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <button
            onClick={() => handleAnalyze()}
            disabled={loading || !url}
            className="btn-primary"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Analyze <ArrowRight size={20} /></>}
          </button>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="error-msg"
            >
              <AlertCircle size={24} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {analyzed && waypoints.length > 0 && (
            <div className="w-full max-w-5xl space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel results-section"
              >
                <div className="results-header">
                  <h2 className="results-title">
                    <CheckCircle className="text-emerald-400" size={28} color="#10b981" />
                    Found {waypoints.length} Locations
                  </h2>
                  <div className="btn-group">
                    <button
                      onClick={() => downloadFile(generateCSV(waypoints), 'map-route.csv', 'text/csv')}
                      className="btn-secondary"
                    >
                      <FileText size={18} /> Download CSV
                    </button>
                    <button
                      onClick={() => downloadFile(generateKML(waypoints), 'map-route.kml', 'application/vnd.google-earth.kml+xml')}
                      className="btn-secondary"
                    >
                      <Globe size={18} /> Download KML
                    </button>
                  </div>
                </div>

                <div className="waypoints-list">
                  {waypoints.map((wp, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={i}
                      className="waypoint-item"
                    >
                      <div className="waypoint-index">
                        {i + 1}
                      </div>
                      <span className="waypoint-name text-white">{wp.name}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="summary-panel">
                  <h3 className="instructions-title">Route Summary</h3>
                  <p className="text-gray-300 mb-0 leading-relaxed font-light text-lg">
                    {simpleRouteTitle}
                  </p>
                </div>

                <div className="instructions">
                  <h3 className="instructions-title">Transfer to Your Own Google My Maps</h3>
                  <div className="steps-grid">
                    <div className="step-card">
                      <strong>1. Download CSV</strong>
                      <p>Click &quot;Download CSV&quot; above. This file is formatted for Google My Maps.</p>
                    </div>
                    <div className="step-card">
                      <strong>2. Go to My Maps</strong>
                      <p>Open <a href="https://www.google.com/mymaps" target="_blank" className="link">google.com/mymaps</a> and create a new map.</p>
                    </div>
                    <div className="step-card">
                      <strong>3. Import</strong>
                      <p>Click &quot;Import&quot; in the map legend and upload the CSV file.</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="h-[20px]" style={{ minHeight: '20px', display: 'block' }}></div>

              {/* Map Preview Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel results-section mt-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3" style={{ gap: '12px' }}>
                    <Map className="text-indigo-400" size={24} />
                    Route Preview
                  </h2>
                </div>

                {waypoints.some(wp => wp.coords) ? (
                  <>
                    {/* Map Provider Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0rem' }}>
                      <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 w-fit">
                        <button
                          onClick={() => setMapProvider('osm')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mapProvider === 'osm' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                          OpenStreetMap
                        </button>
                        <button
                          onClick={() => setMapProvider('google')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mapProvider === 'google' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                          Google Maps
                        </button>
                      </div>
                    </div>

                    {mapProvider === 'osm' ? (
                      <MapView waypoints={waypoints} />
                    ) : (
                      <GoogleMapView
                        waypoints={waypoints}
                        url={url}
                        mode={googleMapMode}
                        onModeChange={setGoogleMapMode}
                      />
                    )}

                    {mapProvider === 'google' && (
                      <div className="flex items-center justify-between w-full">
                        <button
                          type="button"
                          onClick={() => setGoogleMapMode(googleMapMode === 'embed' ? 'interactive' : 'embed')}
                          className="bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 transition-all font-medium shadow-sm"
                        >
                          {googleMapMode === 'embed' ? 'Switch to Interactive' : 'Show Embed View'}
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')}
                          className="bg-white hover:bg-gray-100 text-black text-xs px-4 py-2 rounded-full font-bold shadow-lg border border-gray-200 flex items-center gap-2 transition-all whitespace-nowrap shrink-0"
                        >
                          Open on Google Maps
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 flex flex-col items-center justify-center">
                    <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                      Route preview is unavailable! We could not extract exact coordinates from this link type. However, you can directly see the route on{' '}
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link"
                      >
                        Google Maps
                      </a>
                      .
                    </p>
                  </div>
                )}

                <p className="text-gray-300 mt-6 leading-relaxed font-light text-lg border-t border-white/10 pt-4">
                  {labeledRouteTitle}
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div >
    </main >
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white">Loading...</div>}>
      <MapParserContent />
    </Suspense>
  );
}
