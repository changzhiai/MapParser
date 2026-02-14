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

export function Header() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter(); // Initialize router

    useEffect(() => {
        // Check for user on mount
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);

        // Listen for auth changes (custom event or just polling/re-checking)
        // Since we don't have a global auth event system yet, we might need to rely on 
        // the page reloading or lightweight polling, or dispatching events.
        // For now, let's add a window event listener for our own custom event if we want to be fancy,
        // or just rely on the fact that login/logout usually redirects or reloads.

        const handleAuthChange = () => {
            setUser(authService.getCurrentUser());
        };

        window.addEventListener('auth-change', handleAuthChange);
        return () => window.removeEventListener('auth-change', handleAuthChange);
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
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
                <div className="w-full max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                            <Image src="/icon.svg" alt="MapParser Logo" width={24} height={24} className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white">MapParser</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 py-1.5 px-3 rounded-full transition-all"
                                >
                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
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
                                className="flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
                            >
                                <LogIn size={16} />
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
            <div className="h-16"></div>
        </>
    );
}
