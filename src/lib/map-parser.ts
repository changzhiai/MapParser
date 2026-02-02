export interface Waypoint {
    name: string;
    coords?: { lat: number; lng: number };
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
                const shortName = decoded.split(',')[0].trim();
                names.push(shortName);
            }
        }

        // 2. Extract Coordinates from 'data' parameter
        let dataString = urlObj.searchParams.get('data') || '';
        if (!dataString && path.includes('/data=')) {
            dataString = path.split('/data=')[1];
        }

        const coords: { lat: number, lng: number }[] = [];
        if (dataString) {
            // Pattern A: !1d(lng)!2d(lat)
            const regex1d2d = /!1d(-?\d+(\.\d+)?)!2d(-?\d+(\.\d+)?)/g;
            let match;
            while ((match = regex1d2d.exec(dataString)) !== null) {
                const lng = parseFloat(match[1]);
                const lat = parseFloat(match[3]);
                coords.push({ lat, lng });
            }

            // Pattern B: !3d(lat)!4d(lng) - usually for single places or specific viewports, but sometimes used in routes
            if (coords.length === 0) {
                const regex3d4d = /!3d(-?\d+(\.\d+)?)!4d(-?\d+(\.\d+)?)/g;
                while ((match = regex3d4d.exec(dataString)) !== null) {
                    const lat = parseFloat(match[1]);
                    const lng = parseFloat(match[3]);
                    coords.push({ lat, lng });
                }
            }
        }

        // 3. Merge
        const count = Math.max(names.length, coords.length);
        const waypoints: Waypoint[] = [];

        for (let i = 0; i < count; i++) {
            const name = names[i] || `Point ${i + 1}`;
            const coord = coords[i]; // 1:1 mapping

            waypoints.push({
                name,
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
