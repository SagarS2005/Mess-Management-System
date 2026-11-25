import React from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Utensils, LogOut, User as UserIcon, Sun, Moon } from "lucide-react";

export default function Navbar({ onOpenAuth }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case "MANAGER":
                return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800";
            case "WARDEN":
                return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800";
            case "ACCOUNTS":
                return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800";
            default:
                return "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800";
        }
    };

    return (
        <header className="border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur sticky top-0 z-40 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-700 dark:bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                        <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                            SmartMess <span className="text-[11px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded-md border border-stone-300 dark:border-stone-700">Campus</span>
                        </h1>
                        <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">Hostel Mess Management & Dining Portal</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Theme Toggle Button */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition font-medium text-xs shadow-sm cursor-pointer"
                        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? (
                            <>
                                <Sun className="w-4 h-4 text-amber-400" />
                                <span className="hidden sm:inline font-semibold">Light</span>
                            </>
                        ) : (
                            <>
                                <Moon className="w-4 h-4 text-stone-700" />
                                <span className="hidden sm:inline font-semibold">Dark</span>
                            </>
                        )}
                    </button>

                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{user.name}</p>
                                <div className="flex items-center gap-1.5 justify-end">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoleBadgeColor(user.role)}`}>
                                        {user.role}
                                    </span>
                                    {user.roomNo ? (
                                        <span className="text-[10px] text-stone-500 dark:text-stone-400">Room {user.roomNo}</span>
                                    ) : (
                                        <span className="text-[10px] text-stone-400">Staff</span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onOpenAuth}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-semibold text-sm transition shadow-sm"
                        >
                            <UserIcon className="w-4 h-4" />
                            Sign In / Register
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
