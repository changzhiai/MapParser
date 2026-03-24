import { motion } from 'framer-motion';
import { Info, ArrowLeft, GitBranch, Mail, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AboutPage() {
    const navigate = useNavigate();

    return (
        <main className="min-h-screen pt-24 pb-16 px-2 md:px-4">
            <div className="container max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel px-4 py-8 md:p-12 mb-12"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl">
                            <Info className="text-indigo-400" size={32} />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">About MapParser</h1>
                    </div>

                    <div className="prose prose-invert max-w-none space-y-12 text-gray-300 text-justify text-lg leading-relaxed">
                        {/* 1. About the app */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                                <Info className="text-indigo-400" size={24} />
                                About the App
                            </h2>
                            <p>
                                MapParser allows you to easily parse Google Maps routes, visualize them, export data to KML or CSV formats, and save your trips.
                                Whether you're planning a road trip, analyzing travel routes, or just want to save your favorite routes, MapParser makes it simple to bridge the gap between Google Maps and your trips.
                            </p>
                        </section>

                        {/* 2. Contributions */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                                <GitBranch className="text-purple-400" size={24} />
                                Contributions
                            </h2>
                            <p>
                                This project is built with passion. Special thanks to the open-source community for the tools and libraries that made this possible.
                                You are welcome to contribute ideas, bug reports, and feature requests to our <a href="https://github.com/changzhiai/MapParser" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-medium underline decoration-indigo-400/30 underline-offset-2">GitHub repository</a>.
                            </p>
                        </section>

                        {/* 3. Contacts & Legal */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                                <Mail className="text-blue-400" size={24} />
                                Contacts & Legal
                            </h2>
                            <p>
                                Have any questions, suggestions, or feedback? Feel free to reach out to us at <a href="mailto:changzhiai@gmail.com" className="text-indigo-400 hover:text-indigo-300 font-medium underline decoration-indigo-400/30 underline-offset-2">changzhiai@gmail.com</a>.
                            </p>
                            <p>
                                View our <a href="/privacy" className="text-indigo-400 hover:text-indigo-300 font-medium underline decoration-indigo-400/30 underline-offset-2">Privacy Policy</a> to understand how we protect your data.
                            </p>
                        </section>

                        {/* 4. Donation */}
                        <section className="space-y-4 bg-white/5 p-8 rounded-3xl border border-white/10">
                            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                                <Coffee className="text-amber-400" size={24} />
                                Donation
                            </h2>
                            <p>
                                This is completely a free app. If you enjoy using MapParser and would like to support its development, consider making a donation.
                                Your support helps keep the servers running and new features coming! Thank you so much for your support!
                            </p>

                            <div className="pt-4">
                                <form action="https://www.paypal.com/donate" method="post" target="_blank">
                                    <input type="hidden" name="business" value="P7WX5GF6ZQDXL" />
                                    <input type="hidden" name="no_recurring" value="0" />
                                    <input type="hidden" name="item_name" value="Your support helps keep the MapParser servers running and new features coming! Thank you so much for your support!" />
                                    <input type="hidden" name="currency_code" value="USD" />
                                    <button
                                        type="submit"
                                        className="w-full md:w-auto py-4 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.493 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.875.812 5.216-.764 3.64-2.544 5.67-5.525 5.67h-1.55c-.297 0-.58.127-.756.405-.203.32-.236.702-.15 1.055l1.624 6.643c.092.378-.052.738-.427.738z" />
                                        </svg>
                                        Donate via PayPal
                                    </button>
                                </form>
                            </div>
                        </section>
                    </div>
                </motion.div>

                <div className="flex justify-center mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-all group bg-white/5 py-4 px-10 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/10 focus:ring-2 focus:ring-indigo-500/50 outline-none"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-semibold tracking-wide">Back to Home</span>
                    </button>
                </div>
            </div>
        </main>
    );
}
