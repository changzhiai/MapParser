export const API_BASE_URL = 'http://localhost:3001';
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

            const data = await response.json();
            if (response.ok) {
                const user = data.user;
                if (user) {
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
                    return { user };
                }
            }
            return { user: null, error: data.error || 'Login failed' };
        } catch (error) {
            return { user: null, error: 'Network error' };
        }
    },

    async googleLogin(token: string, isAccessToken: boolean = false): Promise<{ user: User | null; error?: string }> {
        try {
            const response = await fetch(`${API_URL}/google-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, isAccessToken })
            });

            const data = await response.json();
            if (response.ok) {
                const user = data.user;
                if (user) {
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
                    return { user };
                }
            }
            return { user: null, error: data.error || 'Google login failed' };
        } catch (error) {
            return { user: null, error: 'Network error' };
        }
    },

    async appleLogin(token: string, user?: any): Promise<{ user: User | null; error?: string }> {
        try {
            const response = await fetch(`${API_URL}/apple-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, user })
            });

            const data = await response.json();
            if (response.ok) {
                const user = data.user;
                if (user) {
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
                    return { user };
                }
            }
            return { user: null, error: data.error || 'Apple login failed' };
        } catch (error) {
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

            const data = await response.json();
            if (response.ok) {
                const user: User = { id: data.userId, username, email };
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
                return { success: true };
            }
            return { success: false, error: data.error || 'Registration failed' };
        } catch (error) {
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
            const data = await response.json();
            if (response.ok) {
                this.logout();
                return { success: true };
            }
            return { success: false, message: data.error || 'Delete failed' };
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    },

    logout() {
        localStorage.removeItem(CURRENT_USER_KEY);
    },

    // Trip methods

    async saveTrip(userId: number, name: string, link: string, year: string, location: string, note: string): Promise<{ success: boolean; error?: string; tripId?: number }> {
        try {
            const response = await fetch(`${API_URL}/trips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // eslint-disable-next-line @typescript-eslint/naming-convention
                body: JSON.stringify({ userId, name, link, year, location, note })
            });
            const data = await response.json();
            return { success: response.ok, error: data.error, tripId: data.tripId };
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    },

    async updateTrip(tripId: number, userId: number, name: string, link: string, year: string, location: string, note: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(`${API_URL}/trips/${tripId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                // eslint-disable-next-line @typescript-eslint/naming-convention
                body: JSON.stringify({ userId, name, link, year, location, note })
            });
            const data = await response.json();
            return { success: response.ok, error: data.error };
        } catch (error) {
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
            return false;
        }
    }
};
