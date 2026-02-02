'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Polyline, Marker } from '@react-google-maps/api';
import { Waypoint } from '@/lib/map-parser';
import { Loader2, AlertTriangle } from 'lucide-react';

const containerStyle = {
    width: '100%',
    height: '500px',
    borderRadius: '0.75rem'
};

const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    styles: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#263c3f" }],
        },
        {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b9a76" }],
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
        },
        {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
        },
        {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#746855" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1f2835" }],
        },
        {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#f3d19c" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#515c6d" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#17263c" }],
        },
    ]
};

interface GoogleMapViewProps {
    waypoints: Waypoint[];
    url?: string;
    /** When provided with onModeChange, mode is controlled by parent (no overlay button). */
    mode?: 'embed' | 'interactive';
    onModeChange?: (mode: 'embed' | 'interactive') => void;
}

// Helper to Split Waypoints into chunks
// CHUNK_SIZE moved into effect

export default function GoogleMapView({ waypoints, url, mode: controlledMode, onModeChange }: GoogleMapViewProps) {
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const [internalMode, setInternalMode] = useState<'interactive' | 'embed'>('interactive');
    const isControlled = controlledMode !== undefined && onModeChange !== undefined;
    const mode = isControlled ? controlledMode : internalMode;
    const setMode = isControlled ? onModeChange : setInternalMode;
    const [embedUrl, setEmbedUrl] = useState('');

    useEffect(() => {
        // Construct Embed URL
        if (waypoints.length >= 2 && API_KEY) {
            const origin = `${waypoints[0].coords?.lat},${waypoints[0].coords?.lng}`;
            const destination = `${waypoints[waypoints.length - 1].coords?.lat},${waypoints[waypoints.length - 1].coords?.lng}`;

            // Intermediates
            const intermediates = waypoints.slice(1, -1)
                .map(wp => wp.coords ? `${wp.coords.lat},${wp.coords.lng}` : '')
                .filter(Boolean)
                .join('|');

            const newUrl = `https://www.google.com/maps/embed/v1/directions?key=${API_KEY}&origin=${origin}&destination=${destination}&waypoints=${intermediates}&mode=driving`;
            setEmbedUrl(newUrl);
        }
    }, [waypoints, API_KEY]);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: API_KEY
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    interface RouteSegment {
        id: number;
        status: 'loading' | 'success' | 'fallback' | 'error';
        result?: google.maps.DirectionsResult;
        path?: google.maps.LatLngLiteral[];
    }
    const [segments, setSegments] = useState<RouteSegment[]>([]);

    const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
    }, []);

    // 1. Fit Bounds when waypoints change
    useEffect(() => {
        if (map && waypoints.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            let hasPoints = false;
            waypoints.forEach(wp => {
                if (wp.coords) {
                    bounds.extend(wp.coords);
                    hasPoints = true;
                }
            });
            if (hasPoints) {
                map.fitBounds(bounds);
            }
        }
    }, [map, waypoints]);

    // 2. Calculate Route (Single Pass)
    useEffect(() => {
        if (!isLoaded || waypoints.length < 2) return;

        setSegments([{ id: 0, status: 'loading' }]);

        const ds = new google.maps.DirectionsService();

        const origin = waypoints[0].coords;
        const destination = waypoints[waypoints.length - 1].coords;

        if (!origin || !destination) {
            setSegments([{
                id: 0,
                status: 'fallback',
                path: waypoints.map(c => c.coords).filter(Boolean) as google.maps.LatLngLiteral[]
            }]);
            return;
        }

        // Intermediates
        const waypts = waypoints.slice(1, -1).map(wp => ({
            location: wp.coords ? { lat: wp.coords.lat, lng: wp.coords.lng } : null,
            stopover: true
        })).filter(wp => wp.location !== null) as google.maps.DirectionsWaypoint[];

        // Calculate a safe "Summer" date to bypass winter road closures
        const summerDate = new Date();
        summerDate.setMonth(6); // July
        summerDate.setDate(15);
        if (summerDate < new Date()) {
            summerDate.setFullYear(summerDate.getFullYear() + 1);
        }

        const fetchRoute = async (mode: google.maps.TravelMode): Promise<google.maps.DirectionsResult> => {
            return new Promise((resolve, reject) => {
                const request: google.maps.DirectionsRequest = {
                    origin,
                    destination,
                    waypoints: waypts,
                    travelMode: mode
                };

                // Add future date for Driving to avoid seasonal closures
                if (mode === google.maps.TravelMode.DRIVING) {
                    request.drivingOptions = {
                        departureTime: summerDate,
                        trafficModel: google.maps.TrafficModel.OPTIMISTIC
                    };
                }

                ds.route(request, (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK && result) {
                        resolve(result);
                    } else {
                        reject(status);
                    }
                });
            });
        };

        const attemptRoute = async () => {
            try {
                // Try Driving
                const result = await fetchRoute(google.maps.TravelMode.DRIVING);
                setSegments([{ id: 0, status: 'success', result }]);
            } catch {
                try {
                    // Try Walking
                    const result = await fetchRoute(google.maps.TravelMode.WALKING);
                    setSegments([{ id: 0, status: 'success', result }]);
                } catch (e2: unknown) {
                    console.error(`Route failed: ${e2}. Using fallback.`);
                    setSegments([{
                        id: 0,
                        status: 'fallback',
                        path: waypoints.map(c => c.coords).filter(Boolean) as google.maps.LatLngLiteral[]
                    }]);
                }
            }
        };

        attemptRoute();

    }, [isLoaded, waypoints]);

    if (!API_KEY) {
        return (
            <div className="w-full h-[500px] rounded-xl bg-gray-900 border border-white/10 flex flex-col items-center justify-center p-8 text-center">
                <AlertTriangle className="text-yellow-500 mb-4" size={48} />
                <h3 className="text-xl font-bold text-white mb-2">Google Maps API Key Missing</h3>
                <p className="text-gray-400 max-w-md">
                    To use Google Maps, you need to add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your environment variables.
                </p>
            </div>
        )
    }

    // Render Embed View (no overlay; page renders controls)
    if (mode === 'embed') {
        return (
            <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-white/10 shadow-xl z-0" style={{ height: '500px', width: '100%' }}>
                <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={embedUrl}
                ></iframe>
            </div>
        );
    }

    if (loadError) {
        return <div className="text-red-400 p-4 border border-red-500/20 rounded-xl bg-red-500/10">Error loading Google Maps</div>;
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-[500px] rounded-xl bg-white/5 animate-pulse flex items-center justify-center text-gray-400">
                <Loader2 className="animate-spin mr-2" /> Loading Google Maps...
            </div>
        );
    }

    return (
        <div className="w-full h-[500px] rounded-xl overflow-hidden border border-white/10 shadow-xl relative z-0">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={waypoints[0]?.coords || { lat: 0, lng: 0 }}
                zoom={10}
                onLoad={onMapLoad}
                options={mapOptions}
            >
                {/* Render Segments */}
                {segments.map(seg => {
                    if (seg.status === 'success' && seg.result) {
                        return (
                            <DirectionsRenderer
                                key={seg.id}
                                options={{
                                    directions: seg.result,
                                    preserveViewport: true,
                                    suppressMarkers: true, // We draw our own markers
                                    polylineOptions: {
                                        strokeColor: "#4285F4", // Google Blue
                                        strokeWeight: 5
                                    }
                                }}
                            />
                        );
                    } else if (seg.status === 'fallback' && seg.path) {
                        return (
                            <Polyline
                                key={seg.id}
                                path={seg.path}
                                options={{
                                    strokeColor: "#FF4444", // Red for direct lines
                                    strokeOpacity: 0.7,
                                    strokeWeight: 4,
                                    geodesic: true,
                                    icons: [{
                                        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                                        offset: '100%',
                                        repeat: '100px'
                                    }]
                                }}
                            />
                        );
                    }
                    return null;
                })}

                {/* Render Custom Markers */}
                {waypoints.map((wp, index) => (
                    wp.coords && (
                        <Marker
                            key={index}
                            position={wp.coords}
                            label={{
                                text: String.fromCharCode(65 + index),
                                color: "white",
                                fontWeight: "bold"
                            }}
                            title={wp.name}
                        />
                    )
                ))}

            </GoogleMap>
        </div>
    )
}
