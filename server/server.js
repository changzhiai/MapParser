
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database.js');
const { OAuth2Client } = require('google-auth-library');
const appleSignin = require('apple-signin-auth');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const puppeteer = require('puppeteer');

// Load environment variables from the root .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Helper to delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
const PORT = process.env.SERVER_PORT || 3002;

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../dist')));

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'hotmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, code) => {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: 'Map Parser - Password Reset Code',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4F46E5;">Password Reset</h2>
                    <p>You requested a password reset for your Map Parser account.</p>
                    <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111;">${code}</span>
                    </div>
                    <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
                </div>
            `
        };
        return transporter.sendMail(mailOptions);
    } else {
        console.log(`\n=== EMAIL SIMULATION ===\nTo: ${to}\nCode: ${code}\n================\n`);
        return Promise.resolve();
    }
};

// Routes

app.post('/api/register', (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    db.createUser(username, password, email || null, (err, userId) => {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Username already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'User created', userId });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log(`[Login] Attempt for: ${username}`);
    db.verifyUser(username, password, (err, isValid, user) => {
        if (err) {
            console.error(`[Login] Database error for ${username}:`, err.message);
            return res.status(500).json({ error: err.message });
        }
        if (!isValid) {
            console.warn(`[Login] Invalid credentials for: ${username}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log(`[Login] Success for: ${username} (ID: ${user.id})`);
        res.json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email, hasPassword: true } });
    });
});

app.post('/api/google-login', async (req, res) => {
    const { token, isAccessToken } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    try {
        let email, name;
        if (isAccessToken) {
            console.log('Verifying Google access token...');
            const gResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!gResponse.ok) {
                const tiResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
                if (tiResponse.ok) {
                    const tiData = await tiResponse.json();
                    email = tiData.email;
                    console.log('Tokeninfo fallback successful for:', email);
                } else {
                    throw new Error('Google verification failed');
                }
            } else {
                const gData = await gResponse.json();
                console.log('Google userinfo response received for:', gData.email);
                email = gData.email;
                name = gData.name;
            }
        } else {
            console.log('Verifying Google ID token...');
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: [
                    process.env.VITE_GOOGLE_CLIENT_ID,
                    process.env.VITE_IOS_GOOGLE_CLIENT_ID // iOS Client ID
                ]
            });
            const payload = ticket.getPayload();
            email = payload.email;
            name = payload.name;
            console.log('Google ID token verified for:', email);
        }

        db.getUserByEmail(email, (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (user) {
                return res.json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email, hasPassword: !!user.password } });
            } else {
                let baseUsername = name || email.split('@')[0];
                db.createUser(baseUsername, null, email, (err, userId) => {
                    if (err && err.message.includes('UNIQUE constraint failed')) {
                        baseUsername = `${baseUsername}_${Math.floor(Math.random() * 1000)}`;
                        db.createUser(baseUsername, null, email, (err, userId) => {
                            if (err) return res.status(500).json({ error: err.message });
                            res.json({ message: 'Login successful', user: { id: userId, username: baseUsername, email: email, hasPassword: false } });
                        });
                    } else if (err) {
                        res.status(500).json({ error: err.message });
                    } else {
                        res.json({ message: 'Login successful', user: { id: userId, username: baseUsername, email: email, hasPassword: false } });
                    }
                });
            }
        });
    } catch (error) {
        console.error('Google Verification Error:', error);
        res.status(401).json({ error: 'Invalid Google token', details: error.message });
    }
});





app.post('/api/apple-login', async (req, res) => {
    const { token, user: appleUser } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    try {
        // Debug: Decode token without verification to see what's inside
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                console.log(`[Apple Auth] Token payload audience: ${payload.aud}`);
                console.log(`[Apple Auth] Expected audience: ${process.env.VITE_APPLE_CLIENT_ID}`);
            }
        } catch (e) {
            console.error('[Apple Auth] Failed to decode token for debugging');
        }

        const audiences = [
            process.env.VITE_APPLE_CLIENT_ID, // Service ID (for Android/Web)
            'org.traveltracker.mapparser'     // Bundle ID (for iOS)
        ].filter(Boolean);

        const verifiedToken = await appleSignin.verifyIdToken(token, {
            audience: audiences,
            ignoreExpiration: false,
        });

        const { sub: appleId, email } = verifiedToken;
        console.log(`[Apple Auth] Verification successful for: ${email}`);

        db.getUserByEmail(email, (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            if (user) {
                return res.json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email, hasPassword: !!user.password } });
            } else {
                let firstName = appleUser?.name?.firstName || '';
                let lastName = appleUser?.name?.lastName || '';
                let fullName = [firstName, lastName].filter(Boolean).join(' ');
                let baseUsername = fullName || email.split('@')[0];
                db.createUser(baseUsername, null, email, (err, userId) => {
                    if (err && err.message.includes('UNIQUE constraint failed')) {
                        baseUsername = `${baseUsername}_${Math.floor(Math.random() * 1000)}`;
                        db.createUser(baseUsername, null, email, (err, userId) => {
                            if (err) return res.status(500).json({ error: err.message });
                            res.json({ message: 'Login successful', user: { id: userId, username: baseUsername, email: email, hasPassword: false } });
                        });
                    } else if (err) {
                        res.status(500).json({ error: err.message });
                    } else {
                        res.json({ message: 'Login successful', user: { id: userId, username: baseUsername, email: email, hasPassword: false } });
                    }
                });
            }
        });
    } catch (error) {
        console.error('[Apple Auth] Verification Error:', error.message);
        res.status(401).json({ error: 'Invalid Apple token', details: error.message });
    }
});

app.post('/api/apple-callback', (req, res) => {
    const { id_token, user, state } = req.body;
    console.log('Apple callback received:', { hasToken: !!id_token, hasUser: !!user, state });

    // Redirect back to the frontend with the token as query parameters
    let redirectUrl = '/?apple_id_token=' + encodeURIComponent(id_token || '');
    if (user) {
        redirectUrl += '&apple_user=' + encodeURIComponent(user);
    }
    if (state) {
        redirectUrl += '&state=' + encodeURIComponent(state);
    }

    res.redirect(redirectUrl);
});

app.post('/api/send-code', (req, res) => {
    const { email } = req.body;
    db.getUserByEmail(email, (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        db.createVerificationCode(email, code, async (err) => {
            if (err) return res.status(500).json({ error: err.message });
            try {
                await sendEmail(email, code);
                res.json({ message: 'Verification code sent' });
            } catch (emailErr) {
                res.status(500).json({ error: 'Failed to send email' });
            }
        });
    });
});

app.post('/api/reset-password', (req, res) => {
    const { email, code, newPassword } = req.body;
    db.getVerificationCode(email, (err, record) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!record || record.code !== code || record.expires_at < Date.now()) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }
        db.getUserByEmail(email, (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            db.updateUserPassword(user.id, newPassword, (err) => {
                if (err) return res.status(500).json({ error: err.message });
                db.deleteVerificationCode(email);
                res.json({ message: 'Password updated successfully' });
            });
        });
    });
});

// Trips endpoints

app.get('/api/trips', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    db.getUserTrips(parseInt(userId), (err, trips) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ trips });
    });
});

app.post('/api/trips', (req, res) => {
    const { userId, name, link, year, location, note, routeSummary } = req.body;
    if (!userId || !name || !link) return res.status(400).json({ error: 'Missing required fields' });

    db.createTrip(parseInt(userId), name, link, year || '', location || '', note || '', routeSummary || '', (err, tripId) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Trip saved', tripId });
    });
});

app.delete('/api/trips/:id', (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    db.deleteTrip(parseInt(id), parseInt(userId), (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Trip deleted' });
    });
});

app.put('/api/trips/:id', (req, res) => {
    const { id } = req.params;
    const { userId, name, link, year, location, note, routeSummary } = req.body;
    if (!userId || !name || !link) return res.status(400).json({ error: 'Missing required fields' });
    db.updateTrip(parseInt(id), parseInt(userId), name, link, year || '', location || '', note || '', routeSummary || '', (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Trip updated' });
    });
});

app.get('/api/profile', (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username is required' });
    db.getUserByUsername(username, (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user: { id: user.id, username: user.username, email: user.email, hasPassword: !!user.password } });
    });
});

app.put('/api/profile', (req, res) => {
    const { userId, username, email } = req.body;
    if (!userId || !username) return res.status(400).json({ error: 'Missing required fields' });
    db.updateUserProfile(userId, username, email, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Profile updated', user: { id: userId, username, email } });
    });
});

app.delete('/api/profile', (req, res) => {
    const { userId, password } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    db.getUserById(userId, (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.password && password) {
            const isValid = bcrypt.compareSync(password, user.password);
            if (!isValid) return res.status(401).json({ error: 'Invalid password' });
        } else if (user.password && !password) {
            return res.status(400).json({ error: 'Password required' });
        }

        db.deleteUser(userId, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Account deleted' });
        });
    });
});

// Persistent browser instance to avoid cold starts
let globalBrowser = null;
const getBrowser = async () => {
    try {
        if (!globalBrowser || !globalBrowser.isConnected()) {
            console.log('[Browser] Launching new instance...');
            globalBrowser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--lang=en-US,en'
                ]
            });

            globalBrowser.on('disconnected', () => {
                console.log('[Browser] Instance disconnected');
                globalBrowser = null;
            });
        }
        return globalBrowser;
    } catch (e) {
        console.error('[Browser] Failed to launch:', e.message);
        globalBrowser = null;
        throw e;
    }
};

// Helper for browser-based resolution
const resolveWithBrowser = async (url) => {
    let page;
    let context;
    try {
        const browser = await getBrowser();
        context = await browser.createBrowserContext(); // Fresh context for each request
        page = await context.newPage();

        await page.setViewport({ width: 1280, height: 800 });
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

        // Optimizations: skip assets
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const type = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media', 'imageset'].includes(type)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Use a Windows User Agent to ensure standard desktop UI
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        try {
            const start = Date.now();

            // Force English/US for consistent names across server locations
            let targetUrl = url;
            try {
                const u = new URL(url);
                u.searchParams.set('hl', 'en');
                u.searchParams.set('gl', 'us');
                targetUrl = u.toString();
            } catch (e) { }

            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

            // 1. Handle Cookie Consent
            try {
                await delay(2000);
                const consentSelectors = [
                    'button[aria-label^="Accept"]',
                    'button[aria-label*="Agree"]',
                    'form[action*="consent"] button',
                    '#consent-bump button',
                    '.VfPpkd-LgbsSe',
                    'button.VfPpkd-LgbsSe'
                ];

                for (const selector of consentSelectors) {
                    const btn = await page.$(selector);
                    if (btn) {
                        await btn.click();
                        await delay(2000);
                        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
                        break;
                    }
                }
            } catch (e) { }

            try {
                // 2. Wait for Names to resolve (crucial for AWS)
                await page.waitForFunction(() => {
                    const inputs = Array.from(document.querySelectorAll('input.ZBTq6e, div[id^="directions-searchbox"] input, .tactile-searchbox-input'));
                    if (inputs.length === 0) return false;

                    // Check if at least one input has a "resolved" name (not coordinates)
                    // AND ensure we don't have short numeric-only values (like "1535") which indicate incomplete loading
                    const values = inputs.map(i => i.value || '').filter(v => v);
                    const hasPendingNumbers = values.some(v => v.match(/^\d+$/) && v.length < 8);
                    const hasResolved = values.some(v => v.length > 5 && !v.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/) && !v.match(/^\d+$/));

                    return hasResolved && !hasPendingNumbers;
                }, { timeout: 25000 }).catch(() => { });

                await delay(3500);
            } catch (e) { }

            // Extract waypoint names
            const waypointNames = await page.evaluate(() => {
                const getName = (el) => {
                    if (!el) return null;
                    const val = (el.tagName === 'INPUT' ? el.value : el.innerText) || '';
                    const aria = el.getAttribute('aria-label') || '';

                    const isCoord = (s) => s && s.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/);

                    // Priority: Non-coord value > Non-coord aria-label > anything else
                    const cleanedAria = aria.replace(/^(Starting point|Destination|Via|Waypoints|Choose) /, '').trim();

                    const res = (val && !isCoord(val)) ? val : (cleanedAria && !isCoord(cleanedAria) ? cleanedAria : (val || cleanedAria));
                    return res;
                };

                let inputs = Array.from(document.querySelectorAll('input.ZBTq6e, .JuLCid input, div[id^="directions-searchbox"] input, input[aria-label*="point"], input[aria-label*="Destination"]'));
                let names = inputs.map(getName).filter(v => v && v.trim() !== '' && v !== "''");

                if (names.length === 0) {
                    const els = Array.from(document.querySelectorAll('.IA0p8e, .drp-location-name, div[aria-label^="Destination"], div[aria-label^="Starting point"]'));
                    names = els.map(el => {
                        const aria = el.getAttribute('aria-label');
                        if (aria) return aria.replace(/^(Starting point|Destination|Via) /, '');
                        return el.innerText;
                    }).filter(v => v && v.trim() !== '' && v !== "''");
                }
                return names;
            });

            const resolvedUrl = page.url();
            return { originalUrl: url, resolvedUrl, waypointNames, browserUsed: true };
        } finally {
            if (page) await page.close();
            if (context) await context.close();
        }
    } catch (error) {
        if (page) try { await page.close(); } catch (e) { }
        if (context) try { await context.close(); } catch (e) { }

        try {
            const fallbackRes = await fetch(url, { method: 'HEAD', redirect: 'follow' });
            return { originalUrl: url, resolvedUrl: fallbackRes.url, waypointNames: [], browserUsed: true };
        } catch (e) {
            return { originalUrl: url, resolvedUrl: url, waypointNames: [], browserUsed: true, error: error.message };
        }
    }
};

app.get('/api/resolve', async (req, res) => {
    const urlParam = req.query.url;
    if (!urlParam) return res.status(400).json({ error: 'Missing URL parameter' });

    const url = decodeURIComponent(urlParam);
    const mode = req.query.mode;

    // Direct directions URL - return as is
    if (url.includes('/maps/dir/') || url.includes('/dir/')) {
        // Check for empty names in the URL itself - if found, upgrade to browser mode immediately?
        // Actually, logic below handles "short" links. If client sends a full /dir/ link with '' that's rare unless they copy-pasted it.
        // But if they did, we should probably handle it.
        if (url.includes("/''/") || url.includes("/%27%27/")) {
            return res.json(await resolveWithBrowser(url));
        }
        return res.json({ originalUrl: url, resolvedUrl: url });
    }

    // Explicit browser mode
    if (mode === 'browser') {
        try {
            const result = await resolveWithBrowser(url);
            return res.json(result);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to resolve URL' });
        }
    }

    // Fast mode with auto-upgrade
    try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        const resolvedUrl = response.url;

        // Check for "bad" data indicators in the resolved URL
        // Google Maps puts '' for empty waypoints in /dir/ paths
        const decoded = decodeURIComponent(resolvedUrl);
        if (decoded.includes("/''/") || decoded.includes("/%27%27/")) {
            // Optimization: pass already resolved URL to skip browser redirects
            const browserResult = await resolveWithBrowser(resolvedUrl);
            // Ensure we return the original input URL
            browserResult.originalUrl = url;
            return res.json(browserResult);
        }

        return res.json({ originalUrl: url, resolvedUrl: resolvedUrl });
    } catch (error) {
        // If basic fetch failed, try one last desperation attempt with browser? 
        // Or just fail. Let's just fail for now to avoid infinite hangs.
        return res.status(500).json({ error: 'Failed to resolve URL' });
    }
});

app.get('/api/geocode', async (req, res) => {
    const { query, lat, lng } = req.query;

    try {
        let url = '';
        if (lat && lng) {
            // Reverse Geocoding
            url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
        } else if (query) {
            // Forward Geocoding
            url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&accept-language=en`;
        } else {
            return res.status(400).json({ error: 'Missing query or coordinates' });
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'MapParser/1.0 (contact: info@mapparser.travel-tracker.org)'
            }
        });
        const data = await response.json();

        let location = '';
        let address = null;

        if (lat && lng && data.address) {
            address = data.address;
        } else if (query && Array.isArray(data) && data.length > 0) {
            address = data[0].address;
        }

        if (address) {
            // Broaden the search for state/province across multiple Nominatim fields
            // Fallback chain: State/Province -> Region -> County/District -> City/Town
            const state = address.state || address.province || address.region || address.state_district ||
                address.county || address.municipality || address.city || address.town || address.village || '';
            const country = address.country_code ? address.country_code.toUpperCase() : (address.country || '');

            if (state && country) {
                location = `${state}, ${country}`;
            } else {
                location = country || state || '';
            }

            res.json({
                location: location,
                full_address: (lat && lng ? data.display_name : data[0]?.display_name) || ''
            });
        } else {
            res.status(404).json({ error: 'No results found' });
        }
    } catch (error) {
        console.error("Geocoding failure:", error);
        res.status(500).json({ error: 'Geocoding failed' });
    }
});

app.post('/api/route', async (req, res) => {
    try {
        const { coordinates, mode } = req.body;
        if (!coordinates || coordinates.length < 2) return res.status(400).json({ error: 'At least 2 coordinates are required' });

        let profile = 'driving';
        if (mode === 'walking') profile = 'walking';
        if (mode === 'bicycling' || mode === 'cycling') profile = 'cycling';

        const coordString = coordinates.map(c => `${c.lng},${c.lat}`).join(';');
        const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson`;

        const response = await fetch(osrmUrl);
        if (!response.ok) throw new Error('OSRM API failed');
        const data = await response.json();

        if (!data.routes || data.routes.length === 0) return res.status(404).json({ error: 'No route found' });

        const routeCoordinates = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        res.json({ route: routeCoordinates, distance: data.routes[0].distance, duration: data.routes[0].duration });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch route' });
    }
});

// Handle client-side routing for React
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
});
