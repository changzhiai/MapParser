import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInModal } from './SignInModal';
import { authService } from '@/lib/auth-service';

export function LoginPage() {
    const navigate = useNavigate();
    const [isInitialCheckDone, setIsInitialCheckDone] = useState(false);

    useEffect(() => {
        if (authService.getCurrentUser()) {
            navigate('/');
        }
        setIsInitialCheckDone(true);
    }, [navigate]);

    if (!isInitialCheckDone) return null;

    return (
        <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-950">
            <div className="w-full max-w-md p-4">
                <SignInModal
                    isOpen={true}
                    onClose={() => navigate('/')}
                    onLoginSuccess={() => navigate('/')}
                />
            </div>
        </div>
    );
}

// These are basically the same for now as the Modal handles all modes internally,
// but having separate routes is better for SEO.
// We can pass a 'defaultMode' prop to SignInModal if we modify it.

export function RegisterPage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-950">
            <div className="w-full max-w-md p-4">
                <SignInModal
                    isOpen={true}
                    onClose={() => navigate('/')}
                    onLoginSuccess={() => navigate('/')}
                    initialMode="register"
                />
            </div>
        </div>
    );
}

export function ResetPasswordPage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-950">
            <div className="w-full max-w-md p-4">
                <SignInModal
                    isOpen={true}
                    onClose={() => navigate('/')}
                    onLoginSuccess={() => navigate('/')}
                    initialMode="reset"
                />
            </div>
        </div>
    );
}
