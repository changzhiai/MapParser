'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
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
}

export default function GoogleMapView({ waypoints }: GoogleMapViewProps) {
    // Try to get key from env. If not found, show warning.
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: API_KEY
    });

    const [response, setResponse] = useState<google.maps.DirectionsResult | null>(null);
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

    // Re-calculate route when waypoints change
    useEffect(() => {
        if (!isLoaded || !directionsService || waypoints.length < 2) return;

        const origin = waypoints[0].coords;
        const destination = waypoints[waypoints.length - 1].coords;

        // Middle points
        const waypts = waypoints.slice(1, -1).map(wp => ({
            location: wp.coords ? { lat: wp.coords.lat, lng: wp.coords.lng } : null,
            stopover: true
        })).filter(wp => wp.location !== null) as google.maps.DirectionsWaypoint[];

        if (!origin || !destination) return;

        directionsService.route({
            origin: { lat: origin.lat, lng: origin.lng },
            destination: { lat: destination.lat, lng: destination.lng },
            waypoints: waypts,
            travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
                setResponse(result);
            } else {
                console.error(`Directions request failed: ${status}`);
            }
        });

    }, [isLoaded, directionsService, waypoints]);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        // Initialize services
        const ds = new google.maps.DirectionsService();
        setDirectionsService(ds);
    }, []);

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
                {response && (
                    <DirectionsRenderer
                        options={{
                            directions: response
                        }}
                    />
                )}
            </GoogleMap>
        </div>
    )
}
