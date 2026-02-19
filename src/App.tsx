import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { Header } from './components/Header';
import { ClientConfig } from './components/ClientConfig';
import { generateCSV, generateKML, parseMapUrl, Waypoint, cleanWaypointName, getLocationWithAPI, getCurrentYear } from '@/lib/map-parser';
import { MapPinned, ArrowRight, Loader2, CheckCircle, Link as LinkIcon, AlertCircle, FileText, Globe, Map as MapIcon, Bookmark, Plus, Trash2, StickyNote, Route as RouteIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService, User, Trip, API_BASE_URL } from '@/lib/auth-service';
import { SignInModal } from '@/components/SignInModal';

const MapView = lazy(() => import('@/components/MapView'));
const GoogleMapView = lazy(() => import('@/components/GoogleMapView'));
const MyTrips = lazy(() => import('@/components/MyTrips'));

function MapParserContent() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
    const [error, setError] = useState('');
    const [analyzed, setAnalyzed] = useState(false);
    const [mapProvider, setMapProvider] = useState<'osm' | 'google'>('osm');
    const [googleMapMode, setGoogleMapMode] = useState<'embed' | 'interactive'>('interactive');

    // Auth & Trips State
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isSavingTrip, setIsSavingTrip] = useState(false);
    const [tripNote, setTripNote] = useState('');
    const [tripName, setTripName] = useState('');
    const [rawWaypointNames, setRawWaypointNames] = useState<string[]>([]);

    const handleAnalyze = async (urlOverride?: string, useBrowser: boolean = false) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        let targetUrl = (urlOverride || url).trim();
        if (!targetUrl) return;

        if (!targetUrl.startsWith('http')) {
            if (!targetUrl.includes('.') && !targetUrl.includes('/') && targetUrl.length >= 10) {
                targetUrl = `https://maps.app.goo.gl/${targetUrl}`;
            } else {
                targetUrl = `https://${targetUrl}`;
            }
        }

        setLoading(true);
        setError('');
        setWaypoints([]);
        setAnalyzed(false);

        try {
            // Use API_BASE_URL (which updates to relative /api)
            const apiUrl = `${API_BASE_URL}/api/resolve?url=${encodeURIComponent(targetUrl)}${useBrowser ? '&mode=browser' : ''}`;
            const res = await fetch(apiUrl);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to resolve URL');

            const points = parseMapUrl(data.resolvedUrl);

            if (data.waypointNames && Array.isArray(data.waypointNames)) {
                setRawWaypointNames(data.waypointNames);
                points.forEach((p, i) => {
                    if (data.waypointNames[i]) {
                        p.name = cleanWaypointName(data.waypointNames[i]);
                    }
                });
            } else {
                setRawWaypointNames([]);
                if (!useBrowser) {
                    const needsBetterNames = points.some(p =>
                        p.name.match(/^-?\d+\.\d+, -?\d+\.\d+$/) ||
                        p.name.startsWith('Waypoint ')
                    );

                    if (needsBetterNames) {
                        console.log("Poor quality names detected, retrying with browser mode...");
                        return handleAnalyze(targetUrl, true);
                    }
                }
            }

            if (points.length === 0) {
                throw new Error('No waypoints found. Ensure it is a valid Directions link.');
            }

            const updatedPoints = await Promise.all(points.map(async (p) => {
                const isCoordinateName = p.name.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/);
                const isNumericName = p.name.match(/^\d+$/);

                if ((isCoordinateName || isNumericName) && p.coords) {
                    try {
                        const geoRes = await fetch(`${API_BASE_URL}/api/geocode?lat=${p.coords.lat}&lng=${p.coords.lng}`);
                        if (geoRes.ok) {
                            const geoData = await geoRes.json();
                            if (geoData.full_address) {
                                const parts = geoData.full_address.split(',').map((s: string) => s.trim());
                                let resolvedName = parts[0];
                                if (resolvedName.match(/^\d+$/) && parts.length > 1) {
                                    resolvedName = `${resolvedName} ${parts[1]}`;
                                }
                                return { ...p, name: resolvedName, fullName: geoData.full_address };
                            }
                        }
                    } catch (e) {
                        console.error("Failed to reverse geocode", p.name, e);
                    }
                }
                return p;
            }));

            setWaypoints(updatedPoints);

            if (updatedPoints.length > 0 && !updatedPoints.some(wp => wp.coords)) {
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
            setUrl(queryUrl);
            handleAnalyze(queryUrl, true);
        }

        const credential = searchParams.get('google_credential');
        if (credential) {
            const handleCredential = async () => {
                setLoading(true);
                const result = await authService.googleLogin(credential, false);
                setLoading(false);
                if (result.user) {
                    setUser(result.user);
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('google_credential');
                    setSearchParams(newParams);
                } else {
                    setError(result.error || 'Google login failed');
                }
            };
            handleCredential();
        }

        const appleToken = searchParams.get('apple_id_token');
        if (appleToken) {
            const handleAppleCredential = async () => {
                setLoading(true);
                const appleUserStr = searchParams.get('apple_user');
                let appleUser = null;
                if (appleUserStr) {
                    try { appleUser = JSON.parse(decodeURIComponent(appleUserStr)); } catch (e) { /* ignore */ }
                }
                const result = await authService.appleLogin(appleToken, appleUser);
                setLoading(false);
                if (result.user) {
                    setUser(result.user);
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('apple_id_token');
                    newParams.delete('apple_user');
                    setSearchParams(newParams);
                } else {
                    setError(result.error || 'Apple login failed');
                }
            };
            handleAppleCredential();
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        const checkUser = () => {
            const currentUser = authService.getCurrentUser();
            setUser(currentUser);
            if (currentUser) {
                fetchTrips(currentUser.id!);
            } else {
                setTrips([]);
            }
        };

        checkUser();
        window.addEventListener('auth-change', checkUser);
        return () => window.removeEventListener('auth-change', checkUser);
    }, []);

    useEffect(() => {
        const handleReset = () => {
            setUrl('');
            setWaypoints([]);
            setError('');
            setAnalyzed(false);
            setRawWaypointNames([]);
            setTripName('');
            setTripNote('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        window.addEventListener('map-reset', handleReset);
        return () => window.removeEventListener('map-reset', handleReset);
    }, []);


    const fetchTrips = async (userId: number) => {
        const userTrips = await authService.getTrips(userId);
        setTrips(userTrips);
    };

    const handleSaveTrip = async () => {
        if (!user) {
            setIsSignInModalOpen(true);
            return;
        }

        if (!tripName.trim()) {
            alert('Please enter a trip name');
            return;
        }

        setIsSavingTrip(true);
        const year = getCurrentYear();

        let locQuery: any = waypoints.length > 0 ? waypoints : rawWaypointNames.join(', ');
        if (!locQuery || (typeof locQuery === 'string' && !locQuery.trim())) {
            if (waypoints.length > 0) {
                locQuery = waypoints[waypoints.length - 1].name;
            }
        }
        const location = await getLocationWithAPI(locQuery);

        const result = await authService.saveTrip(user.id!, tripName, url, year, location, tripNote, simpleRouteTitle);
        setIsSavingTrip(false);

        if (result.success) {
            setTripNote('');
            setTripName('');
            setRawWaypointNames([]);
            fetchTrips(user.id!);
        } else {
            alert(result.error || 'Failed to save trip');
        }
    };

    const handleDeleteTrip = async (tripId: number) => {
        if (!user || !confirm('Are you sure you want to delete this trip?')) return;
        const success = await authService.deleteTrip(tripId, user.id!);
        if (success) {
            fetchTrips(user.id!);
        }
    };

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
                        placeholder="e.g. maps.app.goo.gl/..."
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
                                    <h3 className="instructions-title">Transfer to Your Own "Google My Maps"</h3>
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

                                {/* Save Trip Section */}
                                <div className="mt-8 pt-8 border-t border-white/10">
                                    <h3 className="instructions-title flex items-center gap-2">
                                        <Plus size={20} className="text-indigo-400" />
                                        Save to My Trips
                                    </h3>
                                    <div className="space-y-4 mt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Trip Name (e.g. California Road Trip)"
                                                value={tripName}
                                                onChange={(e) => setTripName(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white transition-all shadow-inner"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Notes (optional)"
                                                value={tripNote}
                                                onChange={(e) => setTripNote(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white transition-all shadow-inner"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSaveTrip}
                                            disabled={isSavingTrip || !tripName}
                                            className="flex items-center justify-center gap-2 py-2.5 px-8 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all w-full md:w-auto ml-auto"
                                        >
                                            {isSavingTrip ? <Loader2 size={18} className="animate-spin" /> : <><Bookmark size={18} /> {user ? 'Save Trip' : 'Sign in to Save Trip'}</>}
                                        </button>
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
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                        <MapIcon className="text-indigo-400" size={24} />
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
                                            <Suspense fallback={<div className="h-[500px]">Loading Map...</div>}>
                                                <MapView waypoints={waypoints} />
                                            </Suspense>
                                        ) : (
                                            <Suspense fallback={<div className="h-[500px]">Loading Map...</div>}>
                                                <GoogleMapView
                                                    waypoints={waypoints}
                                                    url={url}
                                                    mode={googleMapMode}
                                                    onModeChange={setGoogleMapMode}
                                                />
                                            </Suspense>
                                        )}

                                        <div className="flex items-center justify-between w-full">
                                            <div>
                                                {mapProvider === 'google' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setGoogleMapMode(googleMapMode === 'embed' ? 'interactive' : 'embed')}
                                                        className="bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20 transition-all font-medium shadow-sm"
                                                    >
                                                        {googleMapMode === 'embed' ? 'Switch to Interactive' : 'Show Embed View'}
                                                    </button>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')}
                                                className="bg-white hover:bg-gray-100 text-black text-xs px-4 py-2 rounded-full font-bold shadow-lg border border-gray-200 flex items-center gap-2 transition-all whitespace-nowrap shrink-0"
                                            >
                                                Open on Google Maps
                                            </button>
                                        </div>
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

                {/* Trips Section moved to MyTrips page but we can keep recent trips here if desired. 
            For now, let's keep it minimal or as is. 
            The Header links to /my-trips.
            I will keep trips logic here as "Recent Trips" if user is logged in.
        */}
                {user && trips.length > 0 && (
                    <div className="w-full max-w-5xl mt-16 space-y-8 glass-panel p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                                <Bookmark className="text-indigo-400" size={24} />
                                My Recent Trips
                            </h2>
                        </div>
                        {/* Detailed cards for home page */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {trips.slice(0, 4).map(trip => (
                                <div key={trip.id} className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group flex flex-col gap-3 relative overflow-hidden">
                                    <div className="flex justify-between items-start gap-4">
                                        <h3 className="font-bold text-lg text-white group-hover:text-white/80 transition-colors line-clamp-1" title={trip.name}>{trip.name}</h3>
                                        {trip.year && (
                                            <span className="shrink-0 text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/30">{trip.year}</span>
                                        )}
                                    </div>

                                    <div className="space-y-2 mt-1">
                                        {trip.location && (
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <MapPinned size={15} className="shrink-0 text-gray-500" />
                                                <span className="truncate">{trip.location}</span>
                                            </div>
                                        )}
                                        {trip.route_summary && (
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <RouteIcon size={15} className="shrink-0 text-gray-500" />
                                                <span className="line-clamp-1" title={trip.route_summary}>{trip.route_summary}</span>
                                            </div>
                                        )}
                                        {!trip.location && !trip.route_summary && (
                                            <p className="text-sm text-gray-500 italic">No details available</p>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                                        <span className="text-xs text-gray-600 font-medium">{new Date(trip.created_at).toLocaleDateString()}</span>
                                        <button onClick={() => {
                                            setUrl(trip.link);
                                            handleAnalyze(trip.link);
                                        }}
                                            className="text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-lg"
                                            style={{
                                                backgroundColor: 'oklch(0.585 0.233 277.117)',
                                                boxShadow: '0 4px 12px oklch(0.585 0.233 277.117 / 0.2)'
                                            }}>
                                            View Route
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center pt-2">
                            <a href="/my-trips" onClick={(e) => { e.preventDefault(); window.location.href = '/my-trips'; }} className="text-indigo-300 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors bg-white/5 px-6 py-2 rounded-full border border-white/10 hover:bg-white/10">
                                View All <ArrowRight size={16} />
                            </a>
                        </div>
                    </div>
                )}

                <SignInModal
                    isOpen={isSignInModalOpen}
                    onClose={() => setIsSignInModalOpen(false)}
                    onLoginSuccess={(username) => {
                        const currentUser = authService.getCurrentUser();
                        setUser(currentUser);
                        if (currentUser) fetchTrips(currentUser.id!);
                        window.dispatchEvent(new Event('auth-change'));
                    }}
                />
            </div>
        </main>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <ClientConfig />
            <Header />
            <Routes>
                <Route path="/" element={
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white">Loading...</div>}>
                        <MapParserContent />
                    </Suspense>
                } />
                <Route path="/my-trips" element={
                    <Suspense fallback={<div>Loading...</div>}>
                        <MyTrips />
                    </Suspense>
                } />
            </Routes>
        </BrowserRouter>
    );
}
