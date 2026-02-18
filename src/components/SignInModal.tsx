import React, { useState } from 'react';
import { authService, API_BASE_URL } from '@/lib/auth-service';
import AppleSignin from 'react-apple-signin-auth';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Key, AlertCircle, Loader2 } from 'lucide-react';

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (username: string) => void;
    isExternalLoading?: boolean;
}

type Mode = 'signin' | 'register' | 'reset';

export function SignInModal({ isOpen, onClose, onLoginSuccess, isExternalLoading }: SignInModalProps) {
    const [mode, setMode] = useState<Mode>('signin');
    const [resetStep, setResetStep] = useState<'email' | 'verification'>('email');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setUsername('');
        setPassword('');
        setEmail('');
        setVerificationCode('');
        setResetStep('email');
        setError(null);
        setMode('signin');
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log('Google login success response:', tokenResponse);
            if (tokenResponse.access_token) {
                setLoading(true);
                const result = await authService.googleLogin(tokenResponse.access_token, true);
                setLoading(false);
                if (result.user) {
                    onLoginSuccess(result.user.username);
                    onClose();
                    resetForm();
                } else {
                    console.error('Google verification failed on server:', result.error);
                    setError(result.error || 'Google login failed');
                }
            } else {
                console.warn('Google login success but no access_token found');
                setError('Google Login failed: No access token');
            }
        },
        onError: (error) => {
            console.error('Google Login Error callback:', error);
            setError('Google Login Failed');
        },
    });

    const handleGoogleLogin = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                // Initialize if needed (though usually handled by plugin on load)
                // await SocialLogin.initialize({ google: { webClientId: '...' } }); 
                // But easier to rely on config.

                const response = await SocialLogin.login({
                    provider: 'google',
                    options: {
                        scopes: ['email', 'profile']
                    }
                });

                console.log('Native Google login success:', response);
                // The plugin returns result from provider. For Google, it usually has idToken.
                const token = (response.result as any).idToken;

                if (token) {
                    setLoading(true);
                    // Send ID token to backend (isAccessToken = false)
                    const result = await authService.googleLogin(token, false);
                    setLoading(false);

                    if (result.user) {
                        onLoginSuccess(result.user.username);
                        onClose();
                        resetForm();
                    } else {
                        console.error('Google verification failed on server:', result.error, (result as any).details);
                        setError(result.error || 'Google login failed');
                    }
                } else {
                    console.error('No ID token in response:', response);
                    setError('Google Login failed: No ID Token');
                }
            } catch (error) {
                console.error('Native Google Login Error:', error);
                if (String(error).includes('UNIMPLEMENTED')) {
                    alert('NATIVE APP UPDATE REQUIRED: The native app binary is outdated. Please rebuild and reinstall the app from Xcode/Android Studio to enable the new login system.');
                }
                setError(`Google Login Failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        } else {
            loginWithGoogle();
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (mode === 'signin') {
                const result = await authService.login(username, password);
                if (result.user) {
                    onLoginSuccess(result.user.username);
                    onClose();
                    resetForm();
                } else {
                    setError(result.error || 'Invalid credentials');
                }
            } else if (mode === 'register') {
                const result = await authService.register(username, password, email);
                if (result.success) {
                    onLoginSuccess(username);
                    onClose();
                    resetForm();
                } else {
                    setError(result.error || 'Registration failed');
                }
            } else if (mode === 'reset') {
                if (resetStep === 'email') {
                    const result = await authService.sendVerificationCode(email);
                    if (result.success) {
                        setResetStep('verification');
                    } else {
                        setError(result.message || 'Failed to send code');
                    }
                } else {
                    const result = await authService.resetPassword(email, verificationCode, password);
                    if (result.success) {
                        setMode('signin');
                        setResetStep('email');
                        setError(null);
                        alert('Password reset successful');
                    } else {
                        setError(result.message || 'Failed to reset password');
                    }
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // For native app, use redirect mode as it is much more stable than popups
    const isNative = Capacitor.isNativePlatform();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="p-8">
                    <h2 className="text-3xl font-bold mb-2 text-white">
                        {mode === 'signin' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}
                    </h2>
                    <p className="text-gray-400 mb-8">
                        {mode === 'signin'
                            ? 'Sign in to save your routes and trips.'
                            : mode === 'register'
                                ? 'Join us to start managing your journeys.'
                                : resetStep === 'email' ? 'Enter your email to receive a code.' : 'Enter the code sent to your email.'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode !== 'reset' && (
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Username or Email"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white transition-all"
                                    required
                                />
                            </div>
                        )}

                        {(mode === 'register' || (mode === 'reset' && resetStep === 'email')) && (
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white transition-all"
                                    required
                                />
                            </div>
                        )}

                        {mode === 'reset' && resetStep === 'verification' && (
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="6-Digit Code"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white text-center tracking-[0.5em] font-mono transition-all"
                                    maxLength={6}
                                    required
                                />
                            </div>
                        )}

                        {(mode !== 'reset' || resetStep === 'verification') && (
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="password"
                                    placeholder={mode === 'reset' ? "New Password" : "Password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white transition-all"
                                    required
                                />
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || isExternalLoading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {(loading || isExternalLoading) ? <Loader2 className="animate-spin" size={20} /> : (mode === 'signin' ? 'Sign In' : mode === 'register' ? 'Create Account' : resetStep === 'email' ? 'Send Code' : 'Reset Password')}
                        </button>
                    </form>

                    {mode === 'signin' && (
                        <div className="mt-8">
                            <div className="relative flex items-center gap-4 mb-6">
                                <div className="flex-1 h-px bg-white/10"></div>
                                <span className="text-xs text-gray-500 font-medium">OR CONTINUE WITH</span>
                                <div className="flex-1 h-px bg-white/10"></div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={loading || isExternalLoading}
                                    style={{ height: '40px', width: '100%' }}
                                    className="flex items-center justify-center gap-3 bg-white text-black rounded-full font-medium transition-all hover:bg-gray-100 disabled:opacity-50 border border-gray-300"
                                >
                                    <svg width="18" height="18" viewBox="0 0 18 18">
                                        <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4" />
                                        <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H1.05545V12.9682C2.53636 15.9014 5.55136 18 9 18Z" fill="#34A853" />
                                        <path d="M5.03591 10.71C4.85591 10.17 4.75364 9.59318 4.75364 9C4.75364 8.40682 4.85591 7.83 5.03591 7.29V5.03182H1.05545C0.441818 6.255 0.09 7.63364 0.09 9C0.09 10.3664 0.441818 11.745 1.05545 12.9682L5.03591 10.71Z" fill="#FBBC05" />
                                        <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.55136 0 2.53636 2.09864 1.05545 5.03182L5.03591 7.29C5.74364 5.16273 7.72773 3.57955 9 3.57955Z" fill="#EA4335" />
                                    </svg>
                                    Sign in with Google
                                </button>

                                <AppleSignin
                                    authOptions={{
                                        clientId: import.meta.env.VITE_APPLE_CLIENT_ID || '',
                                        scope: 'email name',
                                        redirectURI: import.meta.env.VITE_APPLE_REDIRECT_URI || '',
                                        state: 'origin:web',
                                        nonce: 'nonce',
                                        usePopup: !isNative,
                                    }}
                                    uiType="dark"
                                    onSuccess={async (response: any) => {
                                        if (response.authorization?.id_token) {
                                            setLoading(true);
                                            const result = await authService.appleLogin(response.authorization.id_token, response.user);
                                            setLoading(false);
                                            if (result.user) {
                                                onLoginSuccess(result.user.username);
                                                onClose();
                                                resetForm();
                                            } else {
                                                setError(result.error || 'Apple login failed');
                                            }
                                        }
                                    }}
                                    onError={() => setError('Apple Login Failed')}
                                    render={(props: any) => (
                                        <button
                                            {...props}
                                            disabled={loading || isExternalLoading}
                                            className="flex items-center justify-center gap-2.5 w-full py-2.5 bg-black text-white rounded-full font-medium transition-all hover:bg-gray-900 border border-white/10 disabled:opacity-50"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 170 170" fill="currentColor">
                                                <path d="M150.37,130.25c-2.45,5.66-5.35,10.89-8.71,15.66c-8.58,12.13-17.52,21.41-26.83,27.85c-9.31,6.44-18.4,9.66-27.27,9.66 c-4.22,0-8.89-1.04-14-3.12c-5.11-2.08-10.3-3.12-15.58-3.12c-5.28,0-10.51,1.04-15.71,3.12c-5.2,2.08-9.83,3.12-13.88,3.12 c-9.15,0-18.73-3.46-28.71-10.38c-9.98-6.92-18.74-16.74-26.29-29.47C5.97,114.24,2,97.77,2,83.98c0-14.16,2.44-26.54,7.31-37.12 c4.87-10.58,11.51-18.89,19.92-24.96c8.41-6.07,17.76-9.11,28.05-9.11c4.54,0,9.97,1.21,16.28,3.63c6.31,2.42,11.39,3.63,15.25,3.63 c3.14,0,7.88-1.21,14.21-3.63c6.33-2.42,12.11-3.63,17.34-3.63c10,0,18.77,2.5,26.3,7.51c7.53,5.01,13.43,11.75,17.71,20.21 c-11.03,6.72-16.55,16.14-16.55,28.27c0,9.81,3.29,17.96,9.87,24.46c6.58,6.5,14.34,10.43,23.27,11.79 C157.06,114.07,154.54,121.75,150.37,130.25z M119.23,30.3c-5.46,6.6-11.95,10.03-19.47,10.28c-0.45-8.48,2.7-16.51,9.45-24.08 c6.76-7.57,14.31-11.64,22.66-12.2c0.75,8.87-4.11,18.06-9.4,24.36L119.23,30.3z" />
                                            </svg>
                                            Sign in with Apple
                                        </button>
                                    )}
                                />
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center space-y-2">
                        <button
                            type="button"
                            onClick={() => {
                                setMode(mode === 'signin' ? 'register' : 'signin');
                                setError(null);
                            }}
                            className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                        >
                            {mode === 'signin' ? "Don't have an account? Create one" : "Already have an account? Sign in"}
                        </button>
                        {mode === 'signin' && (
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('reset');
                                    setResetStep('email');
                                    setError(null);
                                }}
                                className="block w-full text-sm text-gray-500 hover:text-gray-400 transition-colors"
                            >
                                Forgot password?
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
