import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <main className="min-h-screen pt-24 pb-16 px-4">
            <div className="container max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to App
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-8 md:p-12"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl">
                            <Shield className="text-indigo-400" size={32} />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Policy</h1>
                    </div>

                    <div className="prose prose-invert max-w-none space-y-8 text-gray-300 text-justify text-lg leading-relaxed">
                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">1. Overview</h2>
                            <p>
                                MapParser (the "App") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium text-white/90">a. Usage Data</h3>
                                    <p>When you parse a Google Maps link, we process the URL to extract locations and coordinates. This processing happens on our servers to provide the service.</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-white/90">b. Account Information</h3>
                                    <p>If you choose to sign in using Google or Apple, we receive and store basic profile information such as your ID, name, and email address. This is used solely to identify you and manage your saved trips.</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-white/90">c. Saved Trips</h3>
                                    <p>When you save a trip, we store the trip name, notes, and the associated Google Maps link in our database so you can access them across your devices.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">3. Third-Party Services</h2>
                            <p>MapParser integrates with the following third-party services:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Google Maps & Geocoding:</strong> We use Google services to resolve and reverse-geocode map locations.</li>
                                <li><strong>OpenStreetMap (OSM):</strong> We use OSM for displaying route previews on the web and mobile.</li>
                                <li><strong>Supabase/PostgreSQL:</strong> We use secure database services to store your account and trip data.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">4. Data Security</h2>
                            <p>
                                We implement industry-standard security measures to protect your personal information. Your account access is managed through secure OAuth providers (Google and Apple).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">5. Data Deletion</h2>
                            <p>
                                You can delete any of your saved trips at any time within the app. For detailed instructions on how to permanently delete your account and all associated data, please visit our <a href="/delete-account" className="text-indigo-400 hover:underline">Account Deletion page</a>.
                                Alternatively, you can contact us at <a href="mailto:changzhiai@gmail.com" className="text-indigo-600 hover:underline">changzhiai@gmail.com</a>.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4">6. Changes to This Policy</h2>
                            <p>
                                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                            </p>
                        </section>

                        <div className="pt-8 border-t border-white/10 text-sm text-gray-500">
                            Last updated: February 19, 2026
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
