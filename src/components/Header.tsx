'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Added useRouter
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, LogOut, User as UserIcon, Map, ChevronDown, User, FileText, Info } from 'lucide-react';
import { authService, User as AuthUser } from '@/lib/auth-service';
import { SignInModal } from '@/components/SignInModal';
import { ProfileModal } from '@/components/ProfileModal';
import { AboutModal } from '@/components/AboutModal';
import { useGoogleLogin } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

export function Header() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    const handleSocialLoginSuccess = async (token: string) => {
        setIsAuthLoading(true);
        console.log('🔄 Processing social login token...');
        try {
            const result = await authService.googleLogin(token, true);
            if (result.user) {
                setUser(result.user);
                window.dispatchEvent(new Event('auth-change'));
                return true;
            }
        } catch (err) {
            console.error('Login process failed:', err);
        } finally {
            setIsAuthLoading(false);
        }
        return false;
    };

    const handleGoogleLoginStart = async () => {
        console.log('--- Google Login Start (Browser Flow) ---');

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

        if (!clientId) {
            console.error('❌ Google Client ID is not configured (NEXT_PUBLIC_GOOGLE_CLIENT_ID missing)');
            alert('Google Login is not configured correctly on this build.');
            return;
        }

        // Use our new bridge page as the redirect to bypass Google's custom scheme restriction
        // For web, use the current origin. For native, use the bridge page.
        const redirectUri = Capacitor.isNativePlatform()
            ? 'https://mapparser.travel-tracker.org/google-callback'
            : 'https://mapparser.travel-tracker.org';

        const scope = 'openid email profile';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&prompt=select_account`;

        try {
            if (Capacitor.isNativePlatform()) {
                console.log('🚀 Opening System Browser for login...');
                await Browser.open({ url: authUrl });
            } else {
                console.log('🚀 Redirecting to Google login...');
                window.location.href = authUrl;
            }
        } catch (err) {
            console.error('Failed to open browser:', err);
            if (Capacitor.isNativePlatform()) {
                alert(`Error: ${JSON.stringify(err)}`);
            }
        }
    };

    useEffect(() => {
        // 1. Handle fragment token on mount (for web or same-session redirect)
        const checkHash = () => {
            const hash = window.location.hash;
            if (hash && hash.includes('access_token=')) {
                const params = new URLSearchParams(hash.substring(1));
                const accessToken = params.get('access_token');
                if (accessToken) {
                    handleSocialLoginSuccess(accessToken).then(success => {
                        if (success) {
                            window.history.replaceState(null, '', window.location.pathname);
                            setIsSignInModalOpen(false);
                        }
                    });
                }
            }
        };
        checkHash();

        // Helper to process URLs (from both launch and foreground opens)
        const processDeepLink = async (urlStr: string) => {
            console.log('🔗 Processing deep link:', urlStr.split('#')[0] + (urlStr.includes('#') ? '#...' : ''));

            if (urlStr.includes('access_token=')) {
                // Extract token from either query or hash
                let tokenPart = '';
                if (urlStr.includes('access_token=')) {
                    tokenPart = urlStr.split('access_token=')[1].split('&')[0];
                }

                if (tokenPart) {
                    console.log('✅ Found token in deep link!');
                    await Browser.close().catch(() => { });
                    const success = await handleSocialLoginSuccess(tokenPart);
                    if (success) setIsSignInModalOpen(false);
                }
            }
        };

        // 2. Handle deep links (for native browser-to-app bridge)
        let appListener: any;
        if (Capacitor.isNativePlatform()) {
            (async () => {
                // Check if the app was actually launched via a deep link
                const launchUrl = await App.getLaunchUrl();
                if (launchUrl) {
                    processDeepLink(launchUrl.url);
                }

                // Listen for deep links while the app is in the background
                appListener = await App.addListener('appUrlOpen', (data: any) => {
                    processDeepLink(data.url);
                });
            })();
        }

        const currentUser = authService.getCurrentUser();
        setUser(currentUser);

        const handleAuthChange = () => {
            setUser(authService.getCurrentUser());
        };

        window.addEventListener('auth-change', handleAuthChange);
        return () => {
            window.removeEventListener('auth-change', handleAuthChange);
            if (appListener) appListener.remove();
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        authService.logout();
        setUser(null);
        setIsDropdownOpen(false);
        if (pathname === '/my-trips') {
            router.push('/');
        }
        // Dispatch event for other components
        window.dispatchEvent(new Event('auth-change'));
    };

    const handleLoginSuccess = (username: string) => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        // Dispatch event
        window.dispatchEvent(new Event('auth-change'));
    };

    const handleUpdateUser = (newUsername: string) => {
        if (user) {
            const updatedUser = { ...user, username: newUsername };
            setUser(updatedUser);
            // Optionally update localStorage if authService didn't already (authService.updateProfile does)
        }
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10 pt-[env(safe-area-inset-top)]">
                <div className="w-full max-w-7xl mx-auto px-3 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group" onClick={() => window.dispatchEvent(new Event('map-reset'))}>
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                            <Image src="/icon.svg" alt="MapParser Logo" width={32} height={32} className="w-8 h-8" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">MapParser</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 py-2 px-4 rounded-full transition-all"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden py-1"
                                        >
                                            <div className="px-4 py-2 border-b border-white/5">
                                                <p className="text-xs text-gray-500">Signed in as</p>
                                                <p className="text-sm font-bold text-white truncate">{user.username}</p>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setIsProfileModalOpen(true);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
                                            >
                                                <User size={16} /> My Profile
                                            </button>

                                            <Link
                                                href="/my-trips"
                                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <FileText size={16} /> My Trips
                                            </Link>

                                            <button
                                                onClick={() => {
                                                    setIsAboutModalOpen(true);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2 transition-colors"
                                            >
                                                <Info size={16} /> About
                                            </button>

                                            <div className="border-t border-white/5 my-1"></div>

                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 flex items-center gap-2 transition-colors"
                                            >
                                                <LogOut size={16} /> Log Out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsSignInModalOpen(true)}
                                className="flex items-center gap-2.5 py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-base font-bold shadow-lg shadow-indigo-500/20 transition-all"
                            >
                                <LogIn size={18} />
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <SignInModal
                isOpen={isSignInModalOpen}
                onClose={() => setIsSignInModalOpen(false)}
                onLoginSuccess={handleLoginSuccess}
                onGoogleSignIn={handleGoogleLoginStart}
                isExternalLoading={isAuthLoading}
            />
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                user={user}
                onUpdateUser={handleUpdateUser}
            />
            <AboutModal
                isOpen={isAboutModalOpen}
                onClose={() => setIsAboutModalOpen(false)}
            />
            {/* Spacer for fixed header */}
            <div className="h-16 md:h-20 mt-[env(safe-area-inset-top)]"></div>
        </>
    );
}
