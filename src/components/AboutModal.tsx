
import { X, Info, GitBranch, Mail, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg border border-white/10 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                About
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            {/* 1. About the app */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-white flex items-center">
                                    <span className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg mr-3">
                                        <Info size={20} />
                                    </span>
                                    About the App
                                </h3>
                                <p className="text-gray-300 leading-relaxed text-sm">
                                    MapParser allows you to easily parse Google Maps routes, visualize them, export data to KML or CSV formats, and save your trips.
                                    Whether you're planning a road trip, analyzing travel routes, or just want to save your favorite routes, MapParser makes it simple to bridge the gap between Google Maps and your trips.
                                </p>
                            </div>

                            {/* 2. Contributions */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-white flex items-center">
                                    <span className="bg-purple-500/20 text-purple-400 p-2 rounded-lg mr-3">
                                        <GitBranch size={20} />
                                    </span>
                                    Contributions
                                </h3>
                                <p className="text-gray-300 leading-relaxed text-sm">
                                    This project is built with passion. Special thanks to the open-source community for the tools and libraries that made this possible.
                                    You are welcome to contribute ideas, bug reports, and feature requests to our <a href="https://github.com/changzhiai/MapParser" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-medium underline decoration-indigo-400/30 underline-offset-2">GitHub repository</a>.
                                </p>
                            </div>

                            {/* 3. Contacts */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-white flex items-center">
                                    <span className="bg-blue-500/20 text-blue-400 p-2 rounded-lg mr-3">
                                        <Mail size={20} />
                                    </span>
                                    Contacts & Legal
                                </h3>
                                <p className="text-gray-300 leading-relaxed text-sm">
                                    Have questions, suggestions, or feedback? Feel free to reach out to us at <a href="mailto:changzhiai@gmail.com" className="text-indigo-400 hover:text-indigo-300 font-medium underline decoration-indigo-400/30 underline-offset-2">changzhiai@gmail.com</a>.
                                </p>
                                <p className="text-gray-300 leading-relaxed text-sm">
                                    View our <a href="/privacy" className="text-indigo-400 hover:text-indigo-300 font-medium underline decoration-indigo-400/30 underline-offset-2">Privacy Policy</a> to understand how we protect your data.
                                </p>
                            </div>

                            {/* 4. Donation */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-white flex items-center">
                                    <span className="bg-amber-500/20 text-amber-400 p-2 rounded-lg mr-3">
                                        <Coffee size={20} />
                                    </span>
                                    Donation
                                </h3>
                                <p className="text-gray-300 leading-relaxed text-sm mb-4">
                                    This is completely a free app. If you enjoy using MapParser and would like to support its development, consider making a donation.
                                    Your support helps keep the servers running and new features coming! Thank you so much for your support!
                                </p>

                                <div className="space-y-3 pt-2">
                                    {/* <a
                                        href="https://buymeacoffee.com/traveltracker"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all transform active:scale-95 flex items-center justify-center no-underline gap-2"
                                    >
                                        <Coffee size={20} />
                                        Donate via Buy Me A Coffee
                                    </a> */}

                                    <form action="https://www.paypal.com/donate" method="post" target="_blank">
                                        <input type="hidden" name="business" value="P7WX5GF6ZQDXL" />
                                        <input type="hidden" name="no_recurring" value="0" />
                                        <input type="hidden" name="item_name" value="Your support helps keep the MapParser servers running and new features coming! Thank you so much for your support!" />
                                        <input type="hidden" name="currency_code" value="USD" />
                                        <button
                                            type="submit"
                                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.493 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.875.812 5.216-.764 3.64-2.544 5.67-5.525 5.67h-1.55c-.297 0-.58.127-.756.405-.203.32-.236.702-.15 1.055l1.624 6.643c.092.378-.052.738-.427.738z" />
                                            </svg>
                                            Donate via PayPal
                                        </button>
                                        <img alt="" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1" className="hidden" />
                                    </form>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
