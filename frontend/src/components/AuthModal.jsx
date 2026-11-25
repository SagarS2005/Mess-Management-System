import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Lock, Mail, User, Eye, EyeOff } from "lucide-react";

export default function AuthModal({ isOpen, onClose }) {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        roomNo: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await register(formData);
            }
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative text-stone-900 dark:text-stone-100">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-bold tracking-tight">
                        {isLogin ? "Welcome Back" : "Create Mess Account"}
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                        {isLogin ? "Sign in to access meals, QR badge, & billing" : "Register to access hostel dining services"}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-xs">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Full Name</label>
                            <div className="relative">
                                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">College Email</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                                placeholder="name@college.edu"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl pl-9 pr-10 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                                placeholder="Min 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 p-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
                                title={showPassword ? "Hide password" : "Show password"}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="space-y-2">
                            <div>
                                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Hostel Room No (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.roomNo}
                                    onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                                    className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                                    placeholder="e.g. B-204"
                                />
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400">
                                Public registration creates a <strong>Student</strong> account. Staff accounts (Manager, Warden, Accounts) sign in using credentials provisioned by the Mess Admin.
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-semibold text-sm transition shadow-md disabled:opacity-50"
                    >
                        {loading ? "Processing..." : isLogin ? "Sign In" : "Register"}
                    </button>
                </form>

                <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400">
                    {isLogin ? "Don't have an account yet?" : "Already registered?"}{" "}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError("");
                        }}
                        className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                    >
                        {isLogin ? "Sign up here" : "Sign in here"}
                    </button>
                </div>
            </div>
        </div>
    );
}
