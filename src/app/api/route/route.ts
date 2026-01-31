import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { coordinates, mode } = body; // mode: 'driving', 'walking', 'cycling'

        if (!coordinates || coordinates.length < 2) {
            return NextResponse.json({ error: 'At least 2 coordinates are required' }, { status: 400 });
        }

        // Map mode to OSRM profiles
        // driving -> driving
        // walking -> walking
        // bicycling -> cycling (OSRM uses 'cycling' or 'bike') -- checks needed. Standard OSRM demo usually has 'driving', 'walking', 'cycling'
        let profile = 'driving';
        if (mode === 'walking') profile = 'walking';
        if (mode === 'bicycling' || mode === 'cycling') profile = 'cycling';

        // Format coordinates for OSRM: "lng,lat;lng,lat"
        const coordString = coordinates.map((c: any) => `${c.lng},${c.lat}`).join(';');

        // Use OSRM public demo server (Note: Rate limits apply, fine for demo)
        // For production, one should host their own OSRM or use Google Routes API
        const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson`;

        const response = await fetch(osrmUrl);

        if (!response.ok) {
            throw new Error('OSRM API failed');
        }

        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
            return NextResponse.json({ error: 'No route found' }, { status: 404 });
        }

        // Extract coordinates: [lng, lat] -> [lat, lng] for Leaflet
        const routeCoordinates = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        const distance = data.routes[0].distance;
        const duration = data.routes[0].duration;

        return NextResponse.json({
            route: routeCoordinates,
            distance,
            duration
        });

    } catch (error) {
        console.error('Routing error:', error);
        return NextResponse.json({ error: 'Failed to fetch route' }, { status: 500 });
    }
}
