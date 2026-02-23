import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileModal } from './ProfileModal';
import { authService, User } from '@/lib/auth-service';

export function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
        setLoading(false);

        const handleAuthChange = () => {
            const updatedUser = authService.getCurrentUser();
            if (!updatedUser) {
                navigate('/login');
            } else {
                setUser(updatedUser);
            }
        };

        window.addEventListener('auth-change', handleAuthChange);
        return () => window.removeEventListener('auth-change', handleAuthChange);
    }, [navigate]);

    const handleUpdateUser = (newUsername: string) => {
        if (user) {
            setUser({ ...user, username: newUsername });
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-950">
            <div className="w-full max-w-md p-4">
                <ProfileModal
                    isOpen={true}
                    onClose={() => navigate('/')}
                    user={user}
                    onUpdateUser={handleUpdateUser}
                />
            </div>
        </div>
    );
}
