import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, ShieldAlert, BadgeCheck, AlertTriangle, Trash2, Check, Loader2 } from 'lucide-react';
import { authService, User as AuthUser } from '@/lib/auth-service';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: AuthUser | null;
    onUpdateUser: (newUsername: string) => void;
}

export function ProfileModal({ isOpen, onClose, user, onUpdateUser }: ProfileModalProps) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [hasPassword, setHasPassword] = useState<boolean | undefined>(user?.hasPassword);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'danger'>('profile');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('profile');
            setShowDeleteConfirm(false);
            setDeletePassword('');
            setHasPassword(user?.hasPassword);
            setMessage(null);
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (isOpen && user) {
            setUsername(user.username);
            setEmail(user.email || '');

            // Refresh profile data
            authService.getProfile(user.username).then(updatedUser => {
                if (updatedUser) {
                    setEmail(updatedUser.email || '');
                    if (updatedUser.hasPassword !== undefined) {
                        setHasPassword(updatedUser.hasPassword);
                    }
                }
            });
        }
    }, [isOpen, user]);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !user) return null;

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        if (!user.id) {
            setMessage({ text: 'User ID not found. Please log in again.', type: 'error' });
            setLoading(false);
            return;
        }

        const result = await authService.updateProfile(user.id, username, email);
        setLoading(false);

        if (result.success) {
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
            onUpdateUser(username);
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ text: result.message || 'Failed to update profile.', type: 'error' });
        }
    };

    const handleDeleteAccount = async () => {
        if (!user || !user.id) return;
        setLoading(true);

        const result = await authService.deleteAccount(user.id, deletePassword);
        setLoading(false);

        if (result.success) {
            window.location.reload(); // Logout and reload app
        } else {
            setMessage({ text: result.message || 'Failed to delete account', type: 'error' });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/20">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BadgeCheck className="text-indigo-400" size={24} />
                        My Profile
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'profile' ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile Settings
                        {activeTab === 'profile' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
                        )}
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'danger' ? 'text-red-400 bg-red-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        onClick={() => setActiveTab('danger')}
                    >
                        Danger Zone
                        {activeTab === 'danger' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></div>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === 'profile' ? (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                            <User size={16} /> Username
                                        </label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-white placeholder-gray-500"
                                            placeholder="Enter your username"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                            <Mail size={16} /> Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-white placeholder-gray-500"
                                            placeholder="Enter your email"
                                        />
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <ShieldAlert size={12} /> Used for account recovery and notifications
                                        </p>
                                    </div>

                                    {message && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2 border ${message.type === 'success'
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}
                                        >
                                            {message.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                                            {message.text}
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="danger"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    <h3 className="text-red-400 font-bold flex items-center gap-2 mb-2">
                                        <AlertTriangle size={20} /> delete Account
                                    </h3>
                                    <p className="text-sm text-red-300/80 mb-4">
                                        Once you delete your account, there is no going back. Please be certain.
                                        All your saved trips and data will be permanently removed.
                                    </p>

                                    {!showDeleteConfirm ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="w-full px-4 py-3 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={18} /> Delete My Account
                                        </button>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            {hasPassword !== false && (
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-red-300">Confirm Password</label>
                                                    <input
                                                        type="password"
                                                        placeholder="Enter your password to confirm"
                                                        className="w-full px-4 py-3 bg-black/40 border border-red-500/30 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-white placeholder-red-300/50"
                                                        value={deletePassword}
                                                        onChange={(e) => setDeletePassword(e.target.value)}
                                                    />
                                                </div>
                                            )}

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => {
                                                        setShowDeleteConfirm(false);
                                                        setDeletePassword('');
                                                    }}
                                                    className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleDeleteAccount}
                                                    disabled={hasPassword !== false && !deletePassword}
                                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-600/20"
                                                >
                                                    {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Confirm Delete'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
