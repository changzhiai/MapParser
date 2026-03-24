import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinned, Github, Twitter, Mail, Globe } from 'lucide-react';

export function Footer() {
    return (
        <footer className="w-full mt-24 mb-12 border-t border-white/5 pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1 space-y-4 text-center md:text-left">
                        <Link 
                            to="/" 
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="flex items-center gap-3 justify-center md:justify-start group"
                        >
                            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                <MapPinned className="text-indigo-400" size={20} />
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">MapParser</span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
                            The ultimate route analyzer and trip organizer. Extract, visualize, and save your map journeys with ease.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4 text-center md:text-left">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Product</h4>
                        <ul className="space-y-2">
                            <li><Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">Parse Routes</Link></li>
                            <li><Link to="/my-trips" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">My Trips</Link></li>
                            <li><Link to="/map-view" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">Interactive Map</Link></li>
                            <li><Link to="/download" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">Download App</Link></li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div className="space-y-4 text-center md:text-left">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Legal</h4>
                        <ul className="space-y-2">
                            <li><Link to="/privacy" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">Privacy Policy</Link></li>
                            <li><Link to="/delete-account" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">Delete Account</Link></li>
                            <li><Link to="/about" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-gray-400 hover:text-indigo-400 transition-colors text-sm">About Us</Link></li>
                        </ul>
                    </div>

                    {/* Social Section */}
                    <div className="space-y-4 text-center md:text-left">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Connect</h4>
                        <div className="flex gap-4 justify-center md:justify-start">
                            <a href="https://x.com/TravelT62358" className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                                <Twitter size={18} />
                            </a>
                            <a href="https://github.com/changzhiai/MapParser" className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                                <Github size={18} />
                            </a>
                            <a href="mailto:changzhiai@gmail.com" className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                                <Mail size={18} />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                    <p className="text-gray-500 text-xs">
                        &copy; {new Date().getFullYear()} Travel Tracker Team. Built for modern explorers.
                    </p>
                </div>
            </div>
        </footer>
    );
}
