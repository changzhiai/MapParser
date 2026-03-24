import { motion } from 'framer-motion';
import { Smartphone, ArrowLeft, Download, Apple, Play, Scan, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export function DownloadApp() {
    const navigate = useNavigate();

    const iosUrl = "https://apps.apple.com/us/app/map-parser-route-export/id6759354228";
    const androidUrl = "https://play.google.com/store/apps/details?id=org.traveltracker.mapparser&pcampaignid=web_share";

    return (
        <main className="min-h-screen pt-24 pb-16 px-2 md:px-4 relative overflow-hidden">
            {/* Mesh Gradient Background Elements */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="container max-w-5xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel px-4 py-12 md:p-16 mb-12"
                >
                    {/* Header Section */}
                    <div className="flex flex-col items-center text-center space-y-6 mb-16">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="p-4 bg-white/5 rounded-3xl border border-white/10 shadow-inner"
                        >
                            <Globe className="text-indigo-400" size={48} />
                        </motion.div>
                        
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                Take MapParser Anywhere
                            </h1>
                            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                                Download our mobile app to parse your routes on the go. 
                                Enjoy a native, seamlessly synchronized experience on your favorite device.
                            </p>
                        </div>
                    </div>

                    {/* Stores Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* iOS Platform */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-10 flex flex-col items-center space-y-8 hover:bg-white/[0.07] transition-all group"
                        >
                            <div className="flex items-center gap-3 text-white/90">
                                <Apple size={24} />
                                <span className="text-xl font-bold uppercase tracking-widest">iOS App</span>
                            </div>

                            <div className="p-5 bg-white rounded-[32px] shadow-2xl shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-500">
                                {/* @ts-ignore */}
                                <QRCodeSVG 
                                    value={iosUrl} 
                                    size={200}
                                    level="H"
                                    fgColor="#4f46e5" // Indigo-600
                                    includeMargin={false}
                                />
                            </div>
                            
                            <p className="text-gray-500 text-sm font-medium">Scan to view on the App Store</p>

                            <a
                                href={iosUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-4 py-5 bg-black hover:bg-gray-900 text-white rounded-2xl transition-all shadow-xl group/btn"
                            >
                                <Apple size={28} />
                                <div className="text-left">
                                    <p className="text-[10px] uppercase font-bold leading-none opacity-70">Download on the</p>
                                    <p className="text-xl font-bold leading-tight">App Store</p>
                                </div>
                                <Download className="ml-2 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" size={20} />
                            </a>
                        </motion.div>

                        {/* Android Platform */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-10 flex flex-col items-center space-y-8 hover:bg-white/[0.07] transition-all group"
                        >
                            <div className="flex items-center gap-3 text-white/90">
                                <Play size={24} className="fill-current" />
                                <span className="text-xl font-bold uppercase tracking-widest">Android App</span>
                            </div>

                            <div className="p-5 bg-white rounded-[32px] shadow-2xl shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-500">
                                {/* @ts-ignore */}
                                <QRCodeSVG 
                                    value={androidUrl} 
                                    size={200}
                                    level="H"
                                    fgColor="#059669" // Emerald-600
                                    includeMargin={false}
                                />
                            </div>

                            <p className="text-gray-500 text-sm font-medium">Scan to view on Google Play</p>

                            <a
                                href={androidUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-4 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all shadow-xl shadow-emerald-600/20 group/btn"
                            >
                                <Play size={28} className="fill-current" />
                                <div className="text-left">
                                    <p className="text-[10px] uppercase font-bold leading-none opacity-90">Get it on</p>
                                    <p className="text-xl font-bold leading-tight">Google Play</p>
                                </div>
                                <Download className="ml-2 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" size={20} />
                            </a>
                        </motion.div>
                    </div>

                    {/* Instructions Section */}
                    <div className="mt-20 pt-16 border-t border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-gray-400">
                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Scan className="text-indigo-400" />
                                    How to Scan
                                </h3>
                                <p className="text-lg leading-relaxed">
                                    Open your smartphone's camera app and point it at the QR code for your device. 
                                    Tap the link that appears to visit the store page and start your journey.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Smartphone className="text-purple-400" />
                                    Why Mobile?
                                </h3>
                                <p className="text-lg leading-relaxed">
                                    Direct sharing from Google Maps, persistent offline access, 
                                    and native performance optimized for your specific hardware.
                                </p>
                            </div>
                        </div>
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
