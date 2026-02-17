import { authService, API_BASE_URL } from './auth-service';

export interface Waypoint {
    name: string;
    fullName?: string;
    coords?: { lat: number; lng: number };
}

/**
 * Shortens a waypoint name by taking the portion before the first comma,
 * unless it is a coordinate pair which should be preserved.
 */
export function cleanWaypointName(name: string): string {
    const trimmed = name.trim();

    // 1. Preserve coordinate pairs
    if (trimmed.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)) {
        return trimmed;
    }

    // 2. Language-based detection
    const hasPostcode = trimmed.includes("邮政编码");

    if (hasPostcode) {
        // For Chinese context or entries with postcodes, split by space 
        return trimmed.split(/\s+/)[0].trim();
    } else {
        // For English/others, split by comma
        return trimmed.split(',')[0].trim();
    }
}

export function parseMapUrl(url: string): Waypoint[] {
    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;

        // 1. Extract Names from Path
        const names: string[] = [];

        if (path.includes('/dir/')) {
            const parts = path.split('/dir/')[1];
            const segments = parts.split('/');

            for (const segment of segments) {
                if (!segment) continue;
                if (segment.startsWith('@')) break;
                if (segment.startsWith('data=')) break;
                if (segment.startsWith('am=')) break;

                const decoded = decodeURIComponent(segment).replace(/\+/g, ' ');
                names.push(decoded);
            }
        }

        // 2. Extract Coordinates from 'data' parameter
        let dataString = urlObj.searchParams.get('data') || '';
        if (!dataString && path.includes('/data=')) {
            dataString = path.split('/data=')[1];
        }

        const coords: { lat: number, lng: number }[] = [];
        if (dataString) {
            // For directions links, we want to be careful to skip "via" points (dragged routes)
            // Waypoints in !4m blocks usually use !2m2!1d(lng)!2d(lat)
            const isDirections = path.includes('/dir/');

            if (isDirections) {
                // Strategy: Split data string into blocks that each represent one waypoint
                // Waypoint blocks usually start with !1m and are top-level children of the !4m directions container
                const blocks = dataString.split(/!1m(?=\d+!1m1!1s|!2m2!1d)/);

                for (const block of blocks) {
                    // In each block, take ONLY the first primary coordinate pair
                    // Primary coords are almost always !2m2!1d...
                    const mainMatch = /!2m2!1d(-?\d+(\.\d+)?)!2d(-?\d+(\.\d+)?)/.exec(block);
                    if (mainMatch) {
                        coords.push({
                            lng: parseFloat(mainMatch[1]),
                            lat: parseFloat(mainMatch[3])
                        });
                    } else {
                        // Fallback: any coord in this block if !2m2 is missing
                        const anyMatch = /!1d(-?\d+(\.\d+)?)!2d(-?\d+(\.\d+)?)/.exec(block);
                        if (anyMatch) {
                            coords.push({
                                lng: parseFloat(anyMatch[1]),
                                lat: parseFloat(anyMatch[3])
                            });
                        }
                    }
                }
            }

            // If no coords found yet or not directions, use global fallback search
            if (coords.length === 0) {
                // Pattern A: !1d(lng)!2d(lat)
                const regex1d2d = /!1d(-?\d+(\.\d+)?)!2d(-?\d+(\.\d+)?)/g;
                let match;
                while ((match = regex1d2d.exec(dataString)) !== null) {
                    const lng = parseFloat(match[1]);
                    const lat = parseFloat(match[3]);
                    coords.push({ lat, lng });
                }

                // Pattern B: !3d(lat)!4d(lng)
                if (coords.length === 0) {
                    const regex3d4d = /!3d(-?\d+(\.\d+)?)!4d(-?\d+(\.\d+)?)/g;
                    while ((match = regex3d4d.exec(dataString)) !== null) {
                        const lat = parseFloat(match[1]);
                        const lng = parseFloat(match[3]);
                        coords.push({ lat, lng });
                    }
                }
            }
        }

        // 2.5 Extract Coordinates from @ part (fallback for single place or final destination)
        if (coords.length === 0) {
            const atMatch = path.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (atMatch) {
                coords.push({ lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) });
            }
        }

        // 3. Merge
        // Priority: Use names as the source of truth for the number of waypoints if they exist,
        // as Google Maps URLs always have a 1:1 segment-to-waypoint mapping in the path.
        const count = names.length > 0 ? names.length : coords.length;
        const waypoints: Waypoint[] = [];

        for (let i = 0; i < count; i++) {
            let fullName = names[i] || '';
            let name = fullName ? cleanWaypointName(fullName) : '';

            if (name === "''" || name === '""') {
                name = '';
                fullName = '';
            }

            const coord = coords[i];

            if (!name) {
                if (coord) {
                    name = `${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`;
                } else {
                    name = `Waypoint ${i + 1}`;
                }
            }

            waypoints.push({
                name,
                fullName: fullName || name,
                coords: coord
            });
        }

        // Fallback: Check for name-based coords
        return waypoints.map(wp => {
            if (!wp.coords) {
                const coordMatch = wp.name.match(/^(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)$/);
                if (coordMatch) {
                    return {
                        name: `Point (${wp.name})`,
                        coords: {
                            lat: parseFloat(coordMatch[1]),
                            lng: parseFloat(coordMatch[3])
                        }
                    };
                }
            }
            return wp;
        });

    } catch (e) {
        console.error("Parse error", e);
        return [];
    }
}

/**
 * Extracts a likely location (e.g. "CA, USA" or "London, UK") from a list of waypoint names.
 * It favors the format: [State/City], [Country].
 */
export function extractLocationFromNames(names: string[]): string {
    if (!names || names.length === 0) return '';

    const suffixes = new Map<string, number>();

    for (const name of names) {
        // Skip coordinate strings which aren't useful for location names
        if (name.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)) continue;

        const parts = name.split(',').map(p => p.trim()).filter(Boolean);

        if (parts.length >= 2) {
            const country = parts[parts.length - 1];
            let stateOrCity = parts[parts.length - 2];

            // Remove postcodes/digits from the state/city part (e.g., "CA 94103" -> "CA")
            stateOrCity = stateOrCity.replace(/\d+/g, '').trim();

            if (stateOrCity && country) {
                const combined = `${stateOrCity}, ${country}`;
                suffixes.set(combined, (suffixes.get(combined) || 0) + 1);
            }
        }
    }

    if (suffixes.size > 0) {
        // Return the most frequent location pattern found
        let bestLocation = '';
        let maxCount = 0;
        for (const [loc, count] of suffixes.entries()) {
            if (count > maxCount) {
                maxCount = count;
                bestLocation = loc;
            }
        }
        return bestLocation;
    }

    // Fallback logic
    if (names.length > 0) {
        // Find the first name that looks like a location (has commas or is a significant destination)
        for (let i = names.length - 1; i >= 0; i--) {
            const n = names[i];
            const parts = n.split(',').map(p => p.trim());
            if (parts.length >= 2) {
                const country = parts[parts.length - 1];
                const state = parts[parts.length - 2].replace(/\d+/g, '').trim();
                if (state && country) return `${state}, ${country}`;
            }
        }

        // Last resort: just the city name of the destination
        const dest = names[names.length - 1].split(',')[0].trim();
        if (dest && dest.length < 40 && !dest.match(/\d/)) return dest;
    }

    return '';
}

/**
 * Fetches precise State, Country using the server-side geocoding API.
 */
export async function getLocationWithAPI(queryOrWps: string | Waypoint[]): Promise<string> {
    try {
        let params = '';

        if (typeof queryOrWps === 'string') {
            params = `query=${encodeURIComponent(queryOrWps)}`;
        } else if (Array.isArray(queryOrWps) && queryOrWps.length > 0) {
            // Try to use coordinates of the last valid waypoint (destination)
            const destination = [...queryOrWps].reverse().find(wp => wp.coords);
            if (destination && destination.coords) {
                params = `lat=${destination.coords.lat}&lng=${destination.coords.lng}`;
            } else {
                // Fallback to name of destination
                params = `query=${encodeURIComponent(queryOrWps[queryOrWps.length - 1].name)}`;
            }
        }

        if (!params) return '';

        const response = await fetch(`${API_BASE_URL}/api/geocode?${params}`);
        if (response.ok) {
            const data = await response.json();
            if (data.location) return data.location;
        }

        // Fallback for names if specific name failed: try a broader search using fullName if it looks like an address
        if (typeof queryOrWps !== 'string' && Array.isArray(queryOrWps) && queryOrWps.length > 0) {
            const dest = queryOrWps[queryOrWps.length - 1];
            if (dest.fullName && dest.fullName !== dest.name) {
                const retryParams = `query=${encodeURIComponent(dest.fullName)}`;
                const retryRes = await fetch(`${API_BASE_URL}/api/geocode?${retryParams}`);
                if (retryRes.ok) {
                    const retryData = await retryRes.json();
                    return retryData.location;
                }
            }
        }
    } catch (e) {
        // Silently fail
    }
    return '';
}

/**
 * Returns the current year as a string.
 */
export function getCurrentYear(): string {
    return new Date().getFullYear().toString();
}

export function generateCSV(waypoints: Waypoint[]): string {
    // CSV Header with Latitude and Longitude
    let csv = "Name,Address,Latitude,Longitude\n";
    waypoints.forEach((wp, index) => {
        // Escape quotes
        const safeName = wp.name.replace(/"/g, '""');
        // If we have coords, use them. If not, leave them empty.
        const lat = wp.coords ? wp.coords.lat : '';
        const lng = wp.coords ? wp.coords.lng : '';

        // If we don't have coords, we use the name as the address. 
        // If we DO have coords, the address field is less critical but still good for reference.
        csv += `"${index + 1}. ${safeName}","${safeName}",${lat},${lng}\n`;
    });
    return csv;
}

export function generateKML(waypoints: Waypoint[]): string {
    const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
        return c;
    });

    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Imported Route</name>
    <description>Converted from Google Maps Link</description>
`;

    // 1. Add Placemarks for each stop
    waypoints.forEach((wp, index) => {
        const safeName = escapeXml(`${index + 1}. ${wp.name}`);
        const safeDesc = escapeXml(wp.name);

        kml += `    <Placemark>
      <name>${safeName}</name>
      <description>${safeDesc}</description>
`;
        if (wp.coords) {
            kml += `      <Point>
        <coordinates>${wp.coords.lng},${wp.coords.lat},0</coordinates>
      </Point>
`;
        } else {
            // Fallback for My Maps if no coordinates are found
            kml += `      <address>${safeDesc}</address>
`;
        }
        kml += `    </Placemark>
`;
    });

    // 2. Add LineString connecting the stops (The Route)
    const validPoints = waypoints.filter(w => w.coords);
    if (validPoints.length > 1) {
        kml += `    <Placemark>
      <name>Route Path</name>
      <LineString>
        <coordinates>
`;
        validPoints.forEach(p => {
            if (p.coords) {
                kml += `          ${p.coords.lng},${p.coords.lat},0\n`;
            }
        });
        kml += `        </coordinates>
      </LineString>
    </Placemark>
`;
    }

    kml += `  </Document>
</kml>`;
    return kml;
}
