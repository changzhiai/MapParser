import { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinned, ArrowRight } from 'lucide-react';

const MapView = lazy(() => import('./MapView'));
const GoogleMapView = lazy(() => import('./GoogleMapView'));

export function OSMPage() {
    const navigate = useNavigate();

    return (
        <div className="container min-h-screen pt-24 pb-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
                        <MapPinned className="text-indigo-400" size={32} />
                        OpenStreetMap Route Viewer
                    </h1>
                    <p className="text-gray-400">
                        Visualize your parsed Google Maps routes on an interactive OpenStreetMap.
                    </p>
                </div>

                <div className="glass-panel p-2">
                    <Suspense fallback={<div className="h-[500px] flex items-center justify-center text-white">Loading Map...</div>}>
                        <MapView waypoints={[]} />
                    </Suspense>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={() => navigate('/')}
                        className="btn-primary flex items-center gap-2"
                    >
                        Analyze a New Route <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function GoogleMapsPage() {
    const navigate = useNavigate();

    return (
        <div className="container min-h-screen pt-24 pb-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
                        <MapPinned className="text-indigo-400" size={32} />
                        Google Maps Interactive Viewer
                    </h1>
                    <p className="text-gray-400">
                        Organize and preview your journeys using the official Google Maps interface.
                    </p>
                </div>

                <div className="glass-panel p-2">
                    <Suspense fallback={<div className="h-[500px] flex items-center justify-center text-white">Loading Map...</div>}>
                        <GoogleMapView waypoints={[]} />
                    </Suspense>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={() => navigate('/')}
                        className="btn-primary flex items-center gap-2"
                    >
                        Analyze a New Route <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
