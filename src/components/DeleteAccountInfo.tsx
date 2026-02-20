import { motion } from 'framer-motion';
import { Trash2, ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DeleteAccountInfo() {
    const navigate = useNavigate();

    return (
        <main className="min-h-screen pt-24 pb-16 px-4">
            <div className="container max-w-2xl mx-auto">
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
                    className="glass-panel p-8 md:p-12 border-red-500/20"
                >
                    <div className="flex items-center gap-4 mb-8 text-red-400">
                        <div className="p-3 bg-red-500/20 rounded-2xl">
                            <Trash2 size={32} />
                        </div>
                        <h1 className="text-3xl font-bold">Account Deletion</h1>
                    </div>

                    <div className="space-y-8 text-gray-300 text-justify text-lg leading-relaxed">
                        <section className="space-y-4">
                            <p className="text-lg">
                                We respect your right to control your personal data. Below are the steps to permanently delete your MapParser account and all associated data.
                            </p>
                        </section>

                        <section className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h2 className="text-xl font-semibold text-white mb-4">How to Delete Your Account</h2>
                            <ol className="space-y-4 list-decimal pl-5">
                                <li>Open the MapParser app or website.</li>
                                <li>Make sure you are signed in to your account.</li>
                                <li>Click on your <strong>Profile</strong> (User icon or name in the top menu).</li>
                                <li>Select the <strong>Danger Zone</strong> tab in the profile window.</li>
                                <li>Click the <strong>Delete My Account</strong> button.</li>
                                <li>Confirm the action (you will need to enter your password if you have one set).</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <Shield size={20} className="text-indigo-400" />
                                What Data is Removed?
                            </h2>
                            <p>Upon deletion, the following data is permanently and irreversibly removed from our servers:</p>
                            <ul className="list-disc pl-5 mt-3 space-y-2">
                                <li>Your user profile (username and email).</li>
                                <li>All saved trips and their associated routes.</li>
                                <li>All notes attached to your trips.</li>
                                <li>Your authentication record.</li>
                            </ul>
                        </section>

                        <section className="pt-8 border-t border-white/10">
                            <p className="text-sm">
                                If you are unable to access the app or have questions, please contact us at: <a href="mailto:changzhiai@gmail.com" className="text-indigo-400 hover:underline font-medium">changzhiai@gmail.com</a>
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
