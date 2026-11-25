import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import StudentDashboard from "./components/StudentDashboard";
import ManagerDashboard from "./components/ManagerDashboard";
import WardenDashboard from "./components/WardenDashboard";
import AccountsDashboard from "./components/AccountsDashboard";
import {
    Utensils,
    QrCode,
    Sparkles,
    Shield,
    DollarSign,
    CheckCircle2,
    TrendingDown,
    ArrowRight
} from "lucide-react";

function MainContent() {
    const { user, login } = useAuth();
    const { theme } = useTheme();
    const [authOpen, setAuthOpen] = useState(false);

    return (
        <div className={`min-h-screen ${theme === "dark" ? "dark bg-stone-950 text-stone-100" : "bg-stone-50 text-stone-900"} flex flex-col transition-colors duration-200`}>
            <Navbar onOpenAuth={() => setAuthOpen(true)} />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {user ? (
                    <div>
                        {user.role === "STUDENT" && <StudentDashboard />}
                        {user.role === "MANAGER" && <ManagerDashboard />}
                        {user.role === "WARDEN" && <WardenDashboard />}
                        {user.role === "ACCOUNTS" && <AccountsDashboard />}
                    </div>
                ) : (
                    /* Public Welcome Landing */
                    <div className="py-12 space-y-12">
                        <div className="text-center max-w-3xl mx-auto space-y-4">
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800 uppercase tracking-wider">
                                Smart College Mess Platform
                            </span>
                            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
                                Zero Food Waste. Transparent Billing. Contactless Dining.
                            </h2>
                            <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
                                A modern campus dining platform to manage hostel mess operations: meal registration with pre-cutoff opt-ins, anytime dining windows before the next meal, contactless QR check-in, AI demand forecasting, photo-proof complaint tracking, and fair monthly billing.
                            </p>
                            <div className="pt-2 flex flex-wrap justify-center gap-3">
                                <button
                                    onClick={() => setAuthOpen(true)}
                                    className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-semibold text-sm transition shadow-md flex items-center gap-2"
                                >
                                    Get Started <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Feature Highlights Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-2 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                                    <QrCode className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">Contactless QR Entry</h3>
                                <p className="text-xs text-stone-600 dark:text-stone-400">
                                    Dynamic signed QR passes auto-deduct meals and block duplicate entries.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-2 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                                    <TrendingDown className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">Meal Opt-In / Opt-Out</h3>
                                <p className="text-xs text-stone-600 dark:text-stone-400">
                                    Register before preparation cutoff time, then dine anytime before the next meal.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-2 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">AI Demand Forecasting</h3>
                                <p className="text-xs text-stone-600 dark:text-stone-400">
                                    Projects exact portions and footfall based on student opt-ins and past turnouts.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-2 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-300 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">Fair Monthly Billing</h3>
                                <p className="text-xs text-stone-600 dark:text-stone-400">
                                    Pay only for meals eaten with automatic rebates for warden-approved leave days.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="border-t border-stone-200 dark:border-stone-800 py-6 text-center text-xs text-stone-500 dark:text-stone-400">
                Smart College Mess Management Platform • Full-Stack MERN + PostgreSQL + Prisma
            </footer>

            <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <NotificationProvider>
                    <MainContent />
                </NotificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
