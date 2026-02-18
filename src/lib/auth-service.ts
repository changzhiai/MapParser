const getBaseUrl = () => {
    // 1. If we are in a browser on localhost (Vite dev mode), use the local server
    if (typeof window !== 'undefined') {
        const { hostname, protocol } = window.location;
        // Strict check: only auto-detect for web browsers on local host
        if ((hostname === 'localhost' || hostname === '127.0.0.1') && (protocol === 'http:' || protocol === 'https:')) {
            return `${protocol}//${hostname}:3002`;
        }
    }

    // 2. Otherwise use the env var if provided (Primary for Native/Production)
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) return envUrl;

    // 3. Fallback for native apps or production
    if (typeof window !== 'undefined') {
        const { protocol } = window.location;
        if (protocol === 'capacitor:' || protocol === 'app:') {
            // No env var and we are native? Default to a placeholder or stay empty
            return '';
        }
        return window.location.origin;
    }
    return '';
};

export const API_BASE_URL = getBaseUrl();
const API_URL = `${API_BASE_URL}/api`;

const CURRENT_USER_KEY = 'map_parser_current_user';

export interface User {
    id?: number;
    username: string;
    email?: string;
    hasPassword?: boolean;
}

export interface Trip {
    id: number;
    user_id: number;
    name: string;
    link: string;
    year?: string;
    location?: string;
    note?: string;
    route_summary?: string;
    created_at: number;
}

export const authService = {
    getCurrentUser(): User | null {
        if (typeof window === 'undefined') return null;
        const stored = localStorage.getItem(CURRENT_USER_KEY);
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    },

    async login(username: string, password: string): Promise<{ user: User | null; error?: string }> {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    return { user: null, error: data.error || `Error: ${response.status} ${response.statusText}` };
                } catch (e) {
                    return { user: null, error: `Error: ${response.status} ${response.statusText}` };
                }
            }

            const data = await response.json();
            const user = data.user;
            if (user) {
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
                return { user };
            }
            return { user: null, error: data.error || 'Login failed' };
        } catch (error) {
            console.error('Login Error:', error);
            if (error instanceof Error) return { user: null, error: error.message };
            return { user: null, error: 'Network error' };
        }
    },

    async googleLogin(token: string, isAccessToken: boolean = false): Promise<{ user: User | null; error?: string }> {
        const url = `${API_URL}/google-login`;
        console.log(`[AuthService] Attempting google login at: ${url}`);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, isAccessToken })
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`[AuthService] Response not ok: ${response.status}`, text);
                try {
                    const data = JSON.parse(text);
                    return { user: null, error: data.error || `Error: ${response.status} ${response.statusText}`, ...data };
                } catch (e) {
                    return { user: null, error: `Error: ${response.status} ${response.statusText}` };
                }
            }

            const data = await response.json();
            const user = data.user;
            if (user) {
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
                return { user };
            }
            return { user: null, error: data.error || 'Google login failed' };
        } catch (error) {
            console.error('[AuthService] Fetch error:', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            return { user: null, error: `Network error connecting to ${url}: ${errorMsg}` };
        }
    },

    async appleLogin(token: string, user?: any): Promise<{ user: User | null; error?: string }> {
        try {
            const response = await fetch(`${API_URL}/apple-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, user })
            });

            if (!response.ok) {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    return { user: null, error: data.error || `Error: ${response.status} ${response.statusText}` };
                } catch (e) {
                    return { user: null, error: `Error: ${response.status} ${response.statusText}` };
                }
            }

            const data = await response.json();
            const userResponse = data.user;
            if (userResponse) {
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userResponse));
                return { user: userResponse };
            }
            return { user: null, error: data.error || 'Apple login failed' };
        } catch (error) {
            console.error('Apple Login Error:', error);
            return { user: null, error: 'Network error' };
        }
    },

    async register(username: string, password: string, email?: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email })
            });

            if (!response.ok) {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    return { success: false, error: data.error || `Error: ${response.status} ${response.statusText}` };
                } catch (e) {
                    return { success: false, error: `Error: ${response.status} ${response.statusText}` };
                }
            }

            const data = await response.json();
            const user: User = { id: data.userId, username, email };
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            return { success: true };
        } catch (error) {
            console.error('Register Error:', error);
            return { success: false, error: 'Network error' };
        }
    },

    async sendVerificationCode(email: string): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await fetch(`${API_URL}/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            return { success: response.ok, message: data.error || data.message };
        } catch (error) {
            console.error('Send Code Error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await fetch(`${API_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, newPassword })
            });
            const data = await response.json();
            return { success: response.ok, message: data.error || data.message };
        } catch (error) {
            console.error('Reset Password Error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    async getProfile(username: string): Promise<User | null> {
        try {
            const response = await fetch(`${API_URL}/profile?username=${username}`);
            if (response.ok) {
                const data = await response.json();
                return data.user;
            }
        } catch (error) {
            console.error('Get profile error:', error);
        }
        return null;
    },

    async updateProfile(userId: number, username: string, email: string): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await fetch(`${API_URL}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, username, email })
            });
            const data = await response.json();
            if (response.ok && data.user) {
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id === userId) {
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
                }
                return { success: true };
            }
            return { success: false, message: data.error || 'Update failed' };
        } catch (error) {
            console.error('Update Profile Error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    async deleteAccount(userId: number, password?: string): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await fetch(`${API_URL}/profile`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password })
            });

            if (!response.ok) {
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    return { success: false, message: data.error || `Error: ${response.status} ${response.statusText}` };
                } catch (e) {
                    return { success: false, message: `Error: ${response.status} ${response.statusText}` };
                }
            }

            this.logout();
            return { success: true };
        } catch (error) {
            console.error('Delete Account Error:', error);
            return { success: false, message: 'Network error' };
        }
    },

    logout() {
        localStorage.removeItem(CURRENT_USER_KEY);
    },

    // Trip methods

    async saveTrip(userId: number, name: string, link: string, year: string, location: string, note: string, routeSummary?: string): Promise<{ success: boolean; error?: string; tripId?: number }> {
        try {
            const response = await fetch(`${API_URL}/trips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, name, link, year, location, note, routeSummary })
            });
            const data = await response.json();
            return { success: response.ok, error: data.error, tripId: data.tripId };
        } catch (error) {
            console.error('Save Trip Error:', error);
            return { success: false, error: 'Network error' };
        }
    },

    async updateTrip(tripId: number, userId: number, name: string, link: string, year: string, location: string, note: string, routeSummary?: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(`${API_URL}/trips/${tripId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, name, link, year, location, note, routeSummary })
            });
            const data = await response.json();
            return { success: response.ok, error: data.error };
        } catch (error) {
            console.error('Update Trip Error:', error);
            return { success: false, error: 'Network error' };
        }
    },

    async getTrips(userId: number): Promise<Trip[]> {
        try {
            const response = await fetch(`${API_URL}/trips?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                return data.trips;
            }
        } catch (error) {
            console.error('Get trips error:', error);
        }
        return [];
    },

    async deleteTrip(tripId: number, userId: number): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/trips/${tripId}?userId=${userId}`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('Delete Trip Error:', error);
            return false;
        }
    }
};
