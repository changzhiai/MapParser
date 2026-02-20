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
                // Ensure the plugin is initialized with the correct client IDs
                const isIos = Capacitor.getPlatform() === 'ios';
                await SocialLogin.initialize({
                    google: {
                        webClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                        iOSClientId: import.meta.env.VITE_IOS_GOOGLE_CLIENT_ID,
                    },
                    apple: {
                        clientId: Capacitor.getPlatform() === 'ios' ? import.meta.env.VITE_IOS_APPLE_CLIENT_ID : import.meta.env.VITE_APPLE_CLIENT_ID,
                        useBroadcastChannel: false,
                        redirectUrl: isIos ? '' : import.meta.env.VITE_APPLE_REDIRECT_URI
                    }
                });

                const response = await SocialLogin.login({
                    provider: 'google',
                    options: {}
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

    const handleAppleLogin = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                const isIos = Capacitor.getPlatform() === 'ios';
                await SocialLogin.initialize({
                    apple: {
                        clientId: Capacitor.getPlatform() === 'ios' ? import.meta.env.VITE_IOS_APPLE_CLIENT_ID : import.meta.env.VITE_APPLE_CLIENT_ID,
                        useBroadcastChannel: false,
                        redirectUrl: isIos ? '' : import.meta.env.VITE_APPLE_REDIRECT_URI
                    },
                    google: {
                        webClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                        iOSClientId: import.meta.env.VITE_IOS_GOOGLE_CLIENT_ID,
                    }
                });
                const response = await SocialLogin.login({
                    provider: 'apple',
                    options: {
                        state: 'platform:mobile'
                    }
                });

                console.log('Native Apple login success:', response);
                const token = (response.result as any).idToken;

                if (token) {
                    setLoading(true);
                    const result = await authService.appleLogin(token, (response.result as any).user);
                    setLoading(false);

                    if (result.user) {
                        onLoginSuccess(result.user.username);
                        onClose();
                        resetForm();
                    } else {
                        setError(result.error || 'Apple login failed');
                    }
                } else {
                    setError('Apple Login failed: No ID Token');
                }
            } catch (error) {
                console.error('Native Apple Login Error:', error);
                setError(`Apple Login Failed: ${error instanceof Error ? error.message : String(error)}`);
            }
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
                                    className="flex items-center justify-center w-full h-12 bg-white text-gray-900 rounded-xl font-semibold text-sm transition-all hover:bg-gray-50 disabled:opacity-50 border border-gray-200 shadow-sm"
                                >
                                    <div className="flex items-center gap-3 w-48 pl-3">
                                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 18 18">
                                            <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4" />
                                            <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H1.05545V12.9682C2.53636 15.9014 5.55136 18 9 18Z" fill="#34A853" />
                                            <path d="M5.03591 10.71C4.85591 10.17 4.75364 9.59318 4.75364 9C4.75364 8.40682 4.85591 7.83 5.03591 7.29V5.03182H1.05545C0.441818 6.255 0.09 7.63364 0.09 9C0.09 10.3664 0.441818 11.745 1.05545 12.9682L5.03591 10.71Z" fill="#FBBC05" />
                                            <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.55136 0 2.53636 2.09864 1.05545 5.03182L5.03591 7.29C5.74364 5.16273 7.72773 3.57955 9 3.57955Z" fill="#EA4335" />
                                        </svg>
                                        <span className="truncate">Sign in with Google</span>
                                    </div>
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
                                            onClick={(e) => {
                                                if (isNative) {
                                                    e.preventDefault();
                                                    handleAppleLogin();
                                                } else {
                                                    props.onClick(e);
                                                }
                                            }}
                                            disabled={loading || isExternalLoading}
                                            className="flex items-center justify-center w-full h-12 bg-black text-white rounded-xl font-semibold text-sm transition-all hover:bg-gray-900 border border-white/10 disabled:opacity-50 shadow-sm"
                                        >
                                            <div className="flex items-center gap-3 w-48 pl-3">
                                                <svg className="w-5 h-5 flex-shrink-0 -mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M17.507 9.871c-0.033-2.618 2.146-3.877 2.246-3.94-1.213-1.774-3.098-2.016-3.773-2.044-1.614-0.163-3.149 0.952-3.967 0.952-0.817 0-2.091-0.932-3.469-0.905-1.815 0.027-3.488 1.054-4.42 2.673-1.884 3.264-0.482 8.09 1.353 10.74 0.898 1.296 1.961 2.754 3.363 2.701 1.352-0.053 1.865-0.871 3.5-0.871s2.097 0.871 3.527 0.843c1.455-0.027 2.378-1.323 3.266-2.62 1.025-1.501 1.448-2.956 1.47-3.029-0.031-0.015-2.827-1.084-2.86-4.305v-0.001zM14.61 3.525c0.723-0.875 1.211-2.092 1.077-3.308-1.043 0.042-2.305 0.695-3.054 1.572-0.671 0.771-1.259 2.017-1.103 3.208 1.166 0.09 2.357-0.597 3.08-1.472z" />
                                                </svg>
                                                <span className="truncate">Sign in with Apple</span>
                                            </div>
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
