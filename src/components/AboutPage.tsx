import { useNavigate } from 'react-router-dom';
import { AboutModal } from './AboutModal';

export function AboutPage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-950">
            <div className="w-full max-w-4xl p-4">
                <AboutModal
                    isOpen={true}
                    onClose={() => navigate('/')}
                />
            </div>
        </div>
    );
}
