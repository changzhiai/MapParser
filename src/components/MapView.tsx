'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Waypoint } from '@/lib/map-parser';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { Car, Bike, Footprints, Maximize2, Minimize2 } from 'lucide-react';

// function to generate A, B, C... labels
const createAlphabetIcon = (index: number) => {
    const letter = String.fromCharCode(65 + index); // 65 is 'A'
    return L.divIcon({
        className: 'custom-marker',
        html: `<div class="marker-pin"><span class="marker-label">${letter}</span></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -26]
    });
};

// --- Map Controls & Logic --- //

interface MapControllerProps {
    waypoints: Waypoint[];
    mode: string;
    setMode: (mode: string) => void;
    isFullscreen: boolean;
    setIsFullscreen: (is: boolean) => void;
    activeRoute?: [number, number][];
}

function MapController({ waypoints, mode, setMode, isFullscreen, setIsFullscreen }: MapControllerProps) {
    const map = useMap();

    // 1. Handle Resize & Bounds
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);

        if (waypoints.length === 0) return;

        const validPoints = waypoints.filter((w: Waypoint) => w.coords);
        if (validPoints.length === 0) return;

        const bounds = L.latLngBounds(validPoints.map((w: Waypoint) => [w.coords!.lat, w.coords!.lng]));
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [waypoints, map, isFullscreen]);

    // 2. Handle Cmd/Ctrl + Scroll to Zoom
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) {
                map.scrollWheelZoom.enable();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (!e.metaKey && !e.ctrlKey) {
                if (!isFullscreen) map.scrollWheelZoom.disable();
            }
        };

        // Always enable in fullscreen
        if (isFullscreen) {
            map.scrollWheelZoom.enable();
        } else {
            map.scrollWheelZoom.disable();
        }

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [map, isFullscreen]);

    return (
        <>
            {/* Top Left: Mode Selectors */}
            <div className="leaflet-top leaflet-left">
                <div className="leaflet-control leaflet-bar !border-0 !shadow-lg">
                    <div className="flex bg-white rounded-lg overflow-hidden border border-gray-200">
                        {[
                            { id: 'driving', icon: <Car size={18} /> },
                            { id: 'bicycling', icon: <Bike size={18} /> },
                            { id: 'walking', icon: <Footprints size={18} /> }
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMode(m.id);
                                }}
                                className={`p-2.5 transition-all hover:bg-gray-100 border-r border-gray-100 last:border-0 ${mode === m.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'}`}
                                title={m.id.charAt(0).toUpperCase() + m.id.slice(1)}
                            >
                                {m.icon}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Right: Fullscreen (Custom Control) */}
            <div className="leaflet-top leaflet-right">
                <div className="leaflet-control leaflet-bar !border-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFullscreen(!isFullscreen);
                        }}
                        className="p-2.5 bg-white rounded-lg hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-lg transition-all"
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
                    >
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            </div>
        </>
    );
}

// --- Main Component --- //

interface MapViewProps {
    waypoints: Waypoint[];
}

export default function MapView({ waypoints }: MapViewProps) {
    // State
    const [mode, setMode] = useState('driving');
    const [routePath, setRoutePath] = useState<[number, number][]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Escape listener
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFullscreen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Locking body scroll when fullscreen
    useEffect(() => {
        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isFullscreen]);

    // Filtering
    const validPoints = waypoints.filter(w =>
        w.coords && !isNaN(w.coords.lat) && !isNaN(w.coords.lng)
    );

    // Fetch Route Effect
    useEffect(() => {
        if (validPoints.length < 2) {
            // Avoid synchronous state update in effect
            if (routePath.length > 0) {
                setTimeout(() => setRoutePath([]), 0);
            }
            return;
        }

        const fetchRoute = async () => {
            try {
                const res = await fetch('/api/route', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        coordinates: validPoints.map(w => w.coords),
                        mode
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.route) {
                        setRoutePath(data.route);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch route", e);
                // Fallback handled by defaulting routePath to empty
            }
        };

        fetchRoute();
    }, [waypoints, mode, validPoints, routePath]); // Re-run when waypoints or mode changes


    // -- Render -- //

    if (validPoints.length === 0) {
        return (
            <div className="w-full h-[300px] md:h-[500px] rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <span className="text-4xl mb-4">🗺️</span>
                <p className="text-lg font-semibold text-gray-300 mb-2">Map Preview Unavailable</p>
                <p className="text-sm opacity-70 max-w-md">
                    We could not extract exact coordinates from this link type.
                </p>
            </div>
        );
    }

    const center = {
        lat: validPoints[0].coords!.lat,
        lng: validPoints[0].coords!.lng
    };

    // Calculate straight lines fallback
    const straightLines = validPoints.map(w => [w.coords!.lat, w.coords!.lng] as [number, number]);

    // Use a unique key to force remount on new routes
    const mapKey = `map-${validPoints[0].name}-${validPoints.length}`;

    return (
        <div
            className={`rounded-xl overflow-hidden shadow-xl bg-gray-900 transition-all duration-300 ${isFullscreen ? '' : 'border border-white/10 relative z-0'}`}
            style={isFullscreen ? {
                position: 'fixed',
                width: '100vw',
                height: '100vh',
                left: 0,
                top: 0,
                zIndex: 99999,
                margin: 0,
                padding: 0,
                borderRadius: 0
            } : {
                position: 'relative',
                width: '100%',
                height: '500px'
            }}
        >
            <MapContainer
                key={mapKey}
                center={[center.lat, center.lng]}
                zoom={13}
                scrollWheelZoom={isFullscreen}
                zoomControl={false} // Disable default zoom control
                style={{ height: "100%", width: "100%", background: '#111' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ZoomControl position="bottomright" />

                <MapController
                    waypoints={validPoints}
                    activeRoute={routePath}
                    mode={mode}
                    setMode={setMode}
                    isFullscreen={isFullscreen}
                    setIsFullscreen={setIsFullscreen}
                />

                {/* Markers */}
                {validPoints.map((wp, idx) => (
                    <Marker
                        key={idx}
                        position={[wp.coords!.lat, wp.coords!.lng]}
                        icon={createAlphabetIcon(idx)}
                    >
                        <Popup>
                            <strong>{idx + 1}. {wp.name}</strong>
                        </Popup>
                    </Marker>
                ))}

                {/* Route Path (Preferred: Real Geometry, Fallback: Straight Line) */}
                {routePath.length > 0 ? (
                    <Polyline
                        positions={routePath}
                        pathOptions={{
                            color: mode === 'walking' ? '#10b981' : (mode === 'bicycling' ? '#f59e0b' : '#6366f1'),
                            weight: 5,
                            opacity: 0.8
                        }}
                    />
                ) : (
                    <Polyline
                        positions={straightLines}
                        pathOptions={{ color: '#6366f1', weight: 4, opacity: 0.5, dashArray: '10, 10' }}
                    />
                )}

            </MapContainer>
        </div>
    );
}
