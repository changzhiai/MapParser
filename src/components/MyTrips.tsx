import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, Trip, API_BASE_URL } from '@/lib/auth-service';
import { parseMapUrl, Waypoint, cleanWaypointName, getCurrentYear, getLocationWithAPI } from '@/lib/map-parser';
import { Loader2, Trash2, ArrowRight, ExternalLink, StickyNote, Map, Edit2, Check, X, Plus, Download, Route, Wand2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

// Helper for resolving and parsing routes (shared between load and save)
const resolveAndParseRouteHelper = async (rawUrl: string, useBrowser = false): Promise<{ waypoints: Waypoint[], rawNames: string[] }> => {
    let targetUrl = rawUrl.trim();
    if (!targetUrl) return { waypoints: [], rawNames: [] };

    // Handle short IDs or URLs without protocol
    if (!targetUrl.startsWith('http')) {
        if (!targetUrl.includes('.') && !targetUrl.includes('/') && targetUrl.length >= 10) {
            targetUrl = `https://maps.app.goo.gl/${targetUrl}`;
        } else {
            targetUrl = `https://${targetUrl}`;
        }
    }

    try {
        const apiUrl = `${API_BASE_URL}/api/resolve?url=${encodeURIComponent(targetUrl)}${useBrowser ? '&mode=browser' : ''}`;
        const res = await fetch(apiUrl);

        if (!res.ok) {
            if (!useBrowser) return resolveAndParseRouteHelper(targetUrl, true);
            return { waypoints: parseMapUrl(targetUrl), rawNames: [] };
        }

        const data = await res.json();
        const points = parseMapUrl(data.resolvedUrl);

        if (data.waypointNames && Array.isArray(data.waypointNames) && data.waypointNames.length > 0) {
            points.forEach((p, i) => {
                if (data.waypointNames[i]) p.name = cleanWaypointName(data.waypointNames[i]);
            });
            return { waypoints: points, rawNames: data.waypointNames };
        } else if (!useBrowser && !data.browserUsed) {
            const needsBetter = points.some(p => p.name.match(/^-?\d+\.\d+, -?\d+\.\d+$/) || p.name.startsWith('Waypoint '));
            if (needsBetter) {
                return resolveAndParseRouteHelper(targetUrl, true);
            }
        }
        return { waypoints: points, rawNames: [] };
    } catch (e) {
        console.error("Resolution error:", e);
        if (!useBrowser) return resolveAndParseRouteHelper(targetUrl, true);
        return { waypoints: parseMapUrl(targetUrl), rawNames: [] };
    }
};

export default function MyTrips() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTrip, setEditingTrip] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editLink, setEditLink] = useState('');
    const [editYear, setEditYear] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editNote, setEditNote] = useState('');
    const [editRouteSummary, setEditRouteSummary] = useState('');
    const [isResolving, setIsResolving] = useState(false);
    const [sortKey, setSortKey] = useState<keyof Trip>('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
        const user = authService.getCurrentUser();
        if (!user) {
            navigate('/');
            return;
        }

        const loadTrips = async () => {
            const userTrips = await authService.getTrips(user.id!);
            setTrips(userTrips);
            setLoading(false);

            // Automatically resolve missing fields in the background
            resolveMissingForTrips(userTrips, user.id!);
        };

        loadTrips();
    }, [navigate]);

    const resolveMissingForTrips = async (tripsToFix: Trip[], userId: number) => {
        for (const trip of tripsToFix) {
            // Check if any critical field is missing
            const needsYear = !trip.year || !trip.year.trim();
            const needsLocation = !trip.location || !trip.location.trim();
            const needsSummary = !trip.route_summary || !trip.route_summary.trim();

            if ((needsYear || needsLocation || needsSummary) && trip.link?.trim()) {
                try {
                    const { waypoints, rawNames } = await resolveAndParseRouteHelper(trip.link);

                    let updatedYear = trip.year || '';
                    if (needsYear) updatedYear = getCurrentYear();

                    let updatedRouteSummary = trip.route_summary || '';
                    if (needsSummary && waypoints.length > 0) {
                        updatedRouteSummary = waypoints.map(wp => wp.name).join(' → ');
                    }

                    let updatedLocation = trip.location || '';
                    if (needsLocation) {
                        let query: any = waypoints.length > 0 ? waypoints : rawNames.join(', ');
                        if (!query || (typeof query === 'string' && !query.trim())) {
                            if (waypoints.length > 0) {
                                query = waypoints[waypoints.length - 1].name;
                            }
                        }
                        const loc = await getLocationWithAPI(query);
                        if (loc) updatedLocation = loc;
                    }

                    // Only update if something changed and we found data
                    if (updatedYear !== trip.year || updatedLocation !== trip.location || updatedRouteSummary !== trip.route_summary) {
                        const result = await authService.updateTrip(
                            trip.id,
                            userId,
                            trip.name,
                            trip.link,
                            updatedYear,
                            updatedLocation,
                            trip.note || '',
                            updatedRouteSummary
                        );

                        if (result.success) {
                            setTrips(prev => prev.map(t => t.id === trip.id ? {
                                ...t,
                                year: updatedYear,
                                location: updatedLocation,
                                route_summary: updatedRouteSummary
                            } : t));
                        }
                    }
                } catch (e) {
                    console.error(`Failed to auto-resolve trip ${trip.id}`, e);
                }
            }
        }
    };

    const toggleSort = (key: keyof Trip) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder(key === 'created_at' || key === 'year' || key === 'id' ? 'desc' : 'asc');
        }
    };

    const sortedTrips = [...trips].sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        // Handle null/undefined
        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        if (strA === strB) {
            // Secondary sort by created_at if values are same
            return b.created_at - a.created_at;
        }

        return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    const handleAutoFillFields = async () => {
        if (!editLink.trim()) {
            alert('Please enter a route link first');
            return;
        }
        setIsResolving(true);
        try {
            const { waypoints, rawNames } = await resolveAndParseRouteHelper(editLink);

            // Fill fields if they are currently empty
            if (!editYear.trim()) setEditYear(getCurrentYear());


            // Try to get precise location via API if we have enough info
            const detectedLocation = await getLocationWithAPI(waypoints.length > 0 ? waypoints : rawNames.join(', '));
            if (detectedLocation) {
                setEditLocation(detectedLocation);
            }

            if (!editRouteSummary.trim() && waypoints.length > 0) {
                setEditRouteSummary(waypoints.map(wp => wp.name).join(' → '));
            }
        } catch (e) {
            console.error("Auto-fill failed", e);
        } finally {
            setIsResolving(false);
        }
    };

    const handleAddTrip = () => {
        const newTrip: Trip = {
            id: -1, // Temporary ID
            user_id: authService.getCurrentUser()?.id || 0,
            name: '',
            link: '',
            year: '',
            location: '',
            note: '',
            route_summary: '',
            created_at: Date.now()
        };
        setTrips([newTrip, ...trips]);
        setEditingTrip(-1);
        setEditName('');
        setEditLink('');
        setEditYear('');
        setEditLocation('');
        setEditNote('');
        setEditRouteSummary('');
    };

    const handleEditClick = (trip: Trip) => {
        setEditingTrip(trip.id);
        setEditName(trip.name);
        setEditLink(trip.link);
        setEditYear(trip.year || '');
        setEditLocation(trip.location || '');
        setEditNote(trip.note || '');
        setEditRouteSummary(trip.route_summary || '');
    };

    const handleCancelEdit = () => {
        if (editingTrip === -1) {
            setTrips(prev => prev.filter(t => t.id !== -1));
        }
        setEditingTrip(null);
        setEditName('');
        setEditLink('');
        setEditYear('');
        setEditLocation('');
        setEditNote('');
        setEditRouteSummary('');
    };

    const handleSaveEdit = async (tripId: number) => {
        const user = authService.getCurrentUser();
        if (!user) return;

        let finalRouteSummary = editRouteSummary;
        let finalYear = editYear;
        let finalLocation = editLocation.trim();

        if ((!finalRouteSummary.trim() || !finalYear.trim() || !finalLocation.trim()) && editLink.trim()) {
            setIsResolving(true);
            try {
                const { waypoints, rawNames } = await resolveAndParseRouteHelper(editLink);

                if (!finalRouteSummary.trim() && waypoints.length > 0) {
                    finalRouteSummary = waypoints.map(wp => wp.name).join(' → ');
                    setEditRouteSummary(finalRouteSummary);
                }

                if (!finalYear.trim()) {
                    finalYear = getCurrentYear();
                    setEditYear(finalYear);
                }

                if (!finalLocation.trim()) {
                    let query: any = waypoints.length > 0 ? waypoints : rawNames.join(', ');
                    if (!query || (typeof query === 'string' && !query.trim())) {
                        // If no raw names, use clean names from parsed waypoints
                        if (waypoints.length > 0) {
                            query = waypoints[waypoints.length - 1].name;
                        }
                    }
                    const loc = await getLocationWithAPI(query);
                    if (loc) {
                        finalLocation = loc;
                        setEditLocation(loc);
                    }
                }
            } catch (e) {
                console.error("Failed to parse link for auto-fields", e);
            } finally {
                setIsResolving(false);
            }
        }

        if (tripId === -1) {
            // Create new trip
            if (!editName.trim() || !editLink.trim()) {
                alert('Name and Link are required');
                return;
            }
            const result = await authService.saveTrip(user.id!, editName, editLink, finalYear, finalLocation, editNote, finalRouteSummary);
            if (result.success && result.tripId) {
                setTrips(prev => prev.map(t => t.id === -1 ? {
                    ...t,
                    id: result.tripId!,
                    name: editName,
                    link: editLink,
                    year: finalYear,
                    location: finalLocation,
                    note: editNote,
                    route_summary: finalRouteSummary
                } : t));
                setEditingTrip(null);
            } else {
                alert('Failed to save trip');
            }
        } else {
            // Update existing trip
            const success = await authService.updateTrip(tripId, user.id!, editName, editLink, finalYear, finalLocation, editNote, finalRouteSummary);

            if (success.success) {
                setTrips(prev => prev.map(t => t.id === tripId ? {
                    ...t,
                    name: editName,
                    link: editLink,
                    year: finalYear,
                    location: finalLocation,
                    note: editNote,
                    route_summary: finalRouteSummary
                } : t));
                setEditingTrip(null);
            } else {
                alert('Failed to update trip');
            }
        }
    };

    const handleDeleteTrip = async (tripId: number) => {
        const user = authService.getCurrentUser();
        if (!user) {
            alert('Please sign in to delete trips');
            return;
        }

        if (!confirm('Are you sure you want to delete this trip?')) return;

        try {
            const success = await authService.deleteTrip(tripId, user.id!);
            if (success) {
                setTrips(prevTrips => prevTrips.filter(t => t.id !== tripId));
            } else {
                alert('Failed to delete trip. Please try again.');
            }
        } catch (error) {
            console.error('Delete trip error:', error);
            alert('An error occurred while deleting the trip.');
        }
    };

    const handleExport = () => {
        if (trips.length === 0) return;

        const headers = ['Name', 'Route', 'Year', 'Location', 'Itinerary', 'Created', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...trips.map(trip => [
                `"${trip.name.replace(/"/g, '""')}"`,
                `"${trip.link}"`,
                `"${(trip.year || '').replace(/"/g, '""')}"`,
                `"${(trip.location || '').replace(/"/g, '""')}"`,
                `"${(trip.route_summary || '').replace(/"/g, '""')}"`,
                `"${new Date(trip.created_at).toLocaleDateString()}"`,
                `"${(trip.note || '').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'my_trips.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <Loader2 className="animate-spin mr-2" /> Loading trips...
            </div>
        );
    }

    return (
        <main className="container min-h-screen pt-4 pb-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
            >
                <div className="flex flex-row items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">My Trips</h1>
                        <p className="text-gray-400 text-sm sm:text-base">Manage your saved journeys</p>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                        <button
                            onClick={handleExport}
                            disabled={trips.length === 0}
                            className="flex items-center justify-center gap-0 sm:gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2.5 rounded-xl font-medium transition-all border border-white/10 active:scale-95"
                            title="Export CSV"
                        >
                            <Download size={18} />
                            <span className="hidden sm:inline">Export CSV</span>
                        </button>
                        <button
                            onClick={handleAddTrip}
                            disabled={editingTrip !== null}
                            className="flex items-center justify-center gap-0 sm:gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                            title="Add Trip"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Add Trip</span>
                        </button>
                    </div>
                </div>

                {trips.length > 0 ? (
                    <div className="glass-panel overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th
                                            className="px-1 sm:px-2 py-3 sm:py-4 text-sm font-semibold text-gray-300 w-10 sm:w-14 cursor-pointer hover:text-white transition-colors text-center"
                                            onClick={() => toggleSort('id')}
                                        >
                                            <div className="flex items-center justify-center gap-1">
                                                No.
                                                {sortKey === 'id' ? (
                                                    sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                                ) : <ArrowUpDown size={14} className="opacity-30" />}
                                            </div>
                                        </th>
                                        <th
                                            className="px-1 sm:px-2 py-3 sm:py-4 text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
                                            onClick={() => toggleSort('name')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Name
                                                {sortKey === 'name' ? (
                                                    sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                                ) : <ArrowUpDown size={14} className="opacity-30" />}
                                            </div>
                                        </th>
                                        <th
                                            className="px-0 sm:px-2 py-3 sm:py-4 text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
                                            onClick={() => toggleSort('link')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Route
                                                {sortKey === 'link' ? (
                                                    sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                                ) : <ArrowUpDown size={14} className="opacity-30" />}
                                            </div>
                                        </th>
                                        <th
                                            className="px-1 sm:px-2 py-3 sm:py-4 text-sm font-semibold text-gray-300 w-16 sm:w-20 text-center cursor-pointer hover:text-white transition-colors"
                                            onClick={() => toggleSort('year')}
                                        >
                                            <div className="flex items-center justify-center gap-1">
                                                Time
                                                {sortKey === 'year' ? (
                                                    sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                                ) : <ArrowUpDown size={14} className="opacity-30" />}
                                            </div>
                                        </th>
                                        <th
                                            className="px-1 sm:px-2 py-3 sm:py-4 text-sm font-semibold text-gray-300 w-20 sm:w-24 cursor-pointer hover:text-white transition-colors"
                                            onClick={() => toggleSort('location')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Location
                                                {sortKey === 'location' ? (
                                                    sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                                ) : <ArrowUpDown size={14} className="opacity-30" />}
                                            </div>
                                        </th>
                                        <th
                                            className="px-1 sm:px-2 py-3 sm:py-4 text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
                                            onClick={() => toggleSort('route_summary')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Itinerary
                                                {sortKey === 'route_summary' ? (
                                                    sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                                ) : <ArrowUpDown size={14} className="opacity-30" />}
                                            </div>
                                        </th>
                                        <th className="px-1 sm:px-2 py-3 sm:py-4 text-sm font-semibold text-gray-300 w-24 sm:w-32 text-center">Actions</th>
                                        <th
                                            className="px-1 sm:px-2 py-3 sm:py-4 text-sm font-semibold text-gray-300 w-16 sm:w-20 cursor-pointer hover:text-white transition-colors"
                                            onClick={() => toggleSort('created_at')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Created
                                                {sortKey === 'created_at' ? (
                                                    sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                                ) : <ArrowUpDown size={14} className="opacity-30" />}
                                            </div>
                                        </th>
                                        <th
                                            className="px-1 sm:px-2 py-3 sm:py-4 text-sm font-semibold text-gray-300 w-24 sm:w-32 text-left cursor-pointer hover:text-white transition-colors"
                                            onClick={() => toggleSort('note')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Notes
                                                {sortKey === 'note' ? (
                                                    sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                                ) : <ArrowUpDown size={14} className="opacity-30" />}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {sortedTrips.map((trip, index) => (
                                        <tr key={trip.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-1 sm:px-2 py-3 sm:py-4 text-sm text-gray-500 text-center">
                                                {index + 1}
                                            </td>
                                            <td className="px-1 sm:px-2 py-3 sm:py-4">
                                                {editingTrip === trip.id ? (
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        placeholder="Name"
                                                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    />
                                                ) : (
                                                    <div className="font-medium text-white line-clamp-2 break-words" title={trip.name}>
                                                        {trip.name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-0 sm:px-2 py-3 sm:py-4">
                                                {editingTrip === trip.id ? (
                                                    <input
                                                        type="text"
                                                        value={editLink}
                                                        onChange={(e) => setEditLink(e.target.value)}
                                                        placeholder="https://maps.google.com/..."
                                                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                    />
                                                ) : (
                                                    <a
                                                        href={trip.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-sm max-w-[200px] truncate"
                                                    >
                                                        <ExternalLink size={14} /> <span className="hidden md:inline">Open </span>Map
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-1 sm:px-2 py-3 sm:py-4 text-center">
                                                {editingTrip === trip.id ? (
                                                    <input
                                                        type="text"
                                                        value={editYear}
                                                        onChange={(e) => setEditYear(e.target.value)}
                                                        placeholder="Year"
                                                        className="w-14 bg-white/10 border border-white/20 rounded px-1 py-1 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm text-center"
                                                    />
                                                ) : (
                                                    <span className="text-gray-300 text-sm">{trip.year}</span>
                                                )}
                                            </td>
                                            <td className="px-1 sm:px-2 py-3 sm:py-4">
                                                {editingTrip === trip.id ? (
                                                    <input
                                                        type="text"
                                                        value={editLocation}
                                                        onChange={(e) => setEditLocation(e.target.value)}
                                                        placeholder="Location"
                                                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                    />
                                                ) : (
                                                    <div className="text-gray-300 text-sm max-w-[100px] line-clamp-2 break-words" title={trip.location || ''}>
                                                        {trip.location || '-'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-1 sm:px-2 py-3 sm:py-4">
                                                {editingTrip === trip.id ? (
                                                    <input
                                                        type="text"
                                                        value={editRouteSummary}
                                                        onChange={(e) => setEditRouteSummary(e.target.value)}
                                                        placeholder="Auto-generated if empty"
                                                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                    />
                                                ) : (
                                                    trip.route_summary ? (
                                                        <div className="flex items-start gap-2 text-gray-400 text-sm w-full" title={trip.route_summary}>
                                                            <Route size={14} className="mt-0.5 shrink-0" />
                                                            <div
                                                                className="line-clamp-2 break-words leading-tight overflow-hidden"
                                                                style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}
                                                            >
                                                                {trip.route_summary}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-600 text-sm italic">No summary</span>
                                                    )
                                                )}
                                            </td>
                                            <td className="px-1 sm:px-2 py-3 sm:py-4">
                                                <div className="flex justify-start gap-2 transition-opacity">
                                                    {editingTrip === trip.id ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleSaveEdit(trip.id)}
                                                                disabled={isResolving}
                                                                className="p-2 hover:bg-emerald-500/20 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                                                                title="Save"
                                                            >
                                                                {isResolving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                                                                title="Cancel"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditClick(trip)}
                                                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                                title="Edit Trip"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => navigate(`/?url=${encodeURIComponent(trip.link)}`)}
                                                                className="p-2 hover:bg-white/10 rounded-lg text-indigo-400 hover:text-white transition-colors"
                                                                title="Analyze Route"
                                                            >
                                                                <ArrowRight size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTrip(trip.id)}
                                                                className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                                                title="Delete Trip"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-1 sm:px-2 py-3 sm:py-4 text-sm text-gray-500">
                                                {new Date(trip.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-1 sm:px-2 py-3 sm:py-4 text-left">
                                                {editingTrip === trip.id ? (
                                                    <input
                                                        type="text"
                                                        value={editNote}
                                                        onChange={(e) => setEditNote(e.target.value)}
                                                        className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                    />
                                                ) : (
                                                    trip.note ? (
                                                        <div className="flex items-start justify-start text-gray-400 text-sm">
                                                            <span className="line-clamp-1 text-left max-w-[120px] truncate" title={trip.note}>{trip.note}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-600 text-sm italic">No notes</span>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="glass-panel p-16 text-center flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Map className="text-gray-600" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No trips saved yet</h3>
                        <p className="text-gray-400 mb-8 max-w-md">
                            Start by analyzing a Google Maps route on the home page and save it to your collection, or add one manually.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                            >
                                <ArrowRight size={18} />
                                Go to Home
                            </button>
                            <button
                                onClick={handleAddTrip}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Add Trip
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </main>
    );
}

