import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [modal, setModal] = useState({
        open: false,
        type: "success", // "success" | "error" | "info"
        title: "",
        message: "",
        details: null
    });

    const timerRef = useRef(null);

    const closeNotification = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setModal((prev) => ({ ...prev, open: false }));
    }, []);

    const notify = useCallback(
        ({ title, message, type = "success", details = null, autoClose = true, duration = 4500 }) => {
            if (timerRef.current) clearTimeout(timerRef.current);

            setModal({
                open: true,
                type,
                title: title || (type === "success" ? "Action Successful" : type === "error" ? "Action Failed" : "Notice"),
                message: message || "",
                details
            });

            if (autoClose) {
                timerRef.current = setTimeout(() => {
                    setModal((prev) => ({ ...prev, open: false }));
                }, duration);
            }
        },
        []
    );

    return (
        <NotificationContext.Provider value={{ notify, closeNotification }}>
            {children}

            {/* Front-and-Center Screen Action Modal */}
            {modal.open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
                    onClick={closeNotification}
                >
                    <div
                        className="relative w-full max-w-sm rounded-2xl p-6 sm:p-7 shadow-2xl text-center border transition-all scale-100 bg-white border-stone-200 text-stone-900 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={closeNotification}
                            className="absolute top-4 right-4 p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            {modal.type === "success" && (
                                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-700 border-2 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-700 shadow-lg">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                            )}
                            {modal.type === "error" && (
                                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-rose-100 text-rose-700 border-2 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-700 shadow-lg">
                                    <AlertCircle className="w-8 h-8" />
                                </div>
                            )}
                            {modal.type === "info" && (
                                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-sky-100 text-sky-700 border-2 border-sky-300 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-700 shadow-lg">
                                    <Info className="w-8 h-8" />
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <h3 className="text-lg font-bold tracking-tight mb-2">
                            {modal.title}
                        </h3>
                        <p className="text-xs sm:text-sm leading-relaxed mb-4 text-stone-600 dark:text-stone-300">
                            {modal.message}
                        </p>

                        {/* Optional Key-Value Details */}
                        {modal.details && typeof modal.details === "object" && (
                            <div className="mb-5 p-3 rounded-xl text-xs text-left space-y-1.5 font-mono bg-stone-100 border border-stone-200 text-stone-700 dark:bg-stone-950 dark:border-stone-800 dark:text-stone-300">
                                {Object.entries(modal.details).map(([key, val]) => (
                                    <div key={key} className="flex justify-between gap-2">
                                        <span className="text-stone-500 dark:text-stone-400">{key}:</span>
                                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                                            {String(val)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Dismiss Button */}
                        <button
                            onClick={closeNotification}
                            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider transition shadow-sm ${
                                modal.type === "success"
                                    ? "bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
                                    : modal.type === "error"
                                    ? "bg-rose-700 hover:bg-rose-800 text-white dark:bg-rose-600 dark:hover:bg-rose-500"
                                    : "bg-stone-800 hover:bg-stone-900 text-white dark:bg-stone-700 dark:hover:bg-stone-600"
                            }`}
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
}
