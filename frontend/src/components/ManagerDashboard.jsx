import React, { useState, useEffect, useRef } from "react";
import api from "../api/client";
import { useNotification } from "../context/NotificationContext";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import {
    Users,
    CheckCircle2,
    TrendingUp,
    Utensils,
    Trash2,
    QrCode,
    Sparkles,
    AlertCircle,
    Calendar,
    Save,
    Camera,
    CameraOff,
    Check,
    X,
    Star,
    Award,
    Plus,
    Flame
} from "lucide-react";

export default function ManagerDashboard() {
    const { notify } = useNotification();
    const [activeTab, setActiveTab] = useState("operations");
    const [selectedMeal, setSelectedMeal] = useState("LUNCH");
    const [headcount, setHeadcount] = useState(null);
    const [scanToken, setScanToken] = useState("");
    const [scanResult, setScanResult] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [wastageData, setWastageData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [activePoll, setActivePoll] = useState(null);
    const [pollModalOpen, setPollModalOpen] = useState(false);
    const [newPollForm, setNewPollForm] = useState(() => ({
        weekStartDate: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
        title: "Sunday Special Feast Vote",
        description: "Vote for your favorite dish for this upcoming weekend feast!",
        dishOptions: ["Paneer Butter Masala & Naan", "Chicken Biryani Special", "Chole Bhature", "Veg Pulao with Dal Makhani"]
    }));

    const scannerRef = useRef(null);

    // Menu Creator state
    const [menuItems, setMenuItems] = useState([
        { name: "", category: "VEG", calories: "", allergens: "", isSpecial: false }
    ]);

    // Wastage Form state
    const [wastageForm, setWastageForm] = useState({ preparedKg: "", consumedKg: "", remarks: "" });

    const todayDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    const fetchHeadcount = async () => {
        try {
            const res = await api.get(`/attendance/headcount?date=${todayDate}&mealType=${selectedMeal}`);
            if (res.data?.success) setHeadcount(res.data.data);
        } catch (err) {
            console.error("Headcount fetch error:", err);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await api.get("/wastage/analytics?days=14");
            if (res.data?.success) setWastageData(res.data.data);

            const foreRes = await api.get(`/wastage/forecast?targetDate=${todayDate}&mealType=${selectedMeal}`);
            if (foreRes.data?.success) setForecastData(foreRes.data.data);
        } catch (err) {
            console.error("Analytics fetch error:", err);
        }
    };

    const fetchPoll = async () => {
        try {
            const res = await api.get("/menu/poll/active");
            if (res.data?.success) setActivePoll(res.data.data);
        } catch (err) {
            console.error("Poll fetch error:", err);
        }
    };

    useEffect(() => {
        fetchHeadcount();
        fetchAnalytics();
        fetchPoll();
    }, [selectedMeal]);

    // Check-in helper that processes a token string
    const processTokenCheckIn = async (tokenString) => {
        if (!tokenString) return;
        setScanResult(null);

        try {
            const res = await api.post("/attendance/check-in", {
                token: tokenString.trim(),
                mealTypeOverride: selectedMeal
            });
            const data = res.data?.data;
            setScanResult({ success: true, data: res.data });
            setScanToken("");
            fetchHeadcount();

            notify({
                type: "success",
                title: "Check-In Verified! ✅",
                message: `Dining pass approved for ${data?.student?.name || "Student"} (${selectedMeal}).`,
                details: {
                    Student: data?.student?.name,
                    Room: data?.student?.roomNo || "Hostel Resident",
                    Meal: selectedMeal,
                    "Checked In": new Date().toLocaleTimeString()
                }
            });
        } catch (err) {
            const errMsg = err.response?.data?.message || "Invalid QR token or check-in failed";
            setScanResult({ success: false, message: errMsg });

            notify({
                type: "error",
                title: "Check-In Blocked ⚠️",
                message: errMsg,
                details: {
                    Meal: selectedMeal,
                    Status: "Denied / Duplicate",
                    Reason: errMsg
                }
            });
        }
    };

    // Live Camera Scanner Lifecycle via html5-qrcode
    useEffect(() => {
        if (cameraActive) {
            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                false
            );

            scanner.render(
                (decodedText) => {
                    processTokenCheckIn(decodedText);
                },
                (error) => {
                    // Ignore transient scan frame errors
                }
            );

            scannerRef.current = scanner;

            return () => {
                scanner.clear().catch((e) => console.log("Scanner cleanup error:", e));
            };
        }
    }, [cameraActive, selectedMeal]);

    const handleManualScanSubmit = (e) => {
        e.preventDefault();
        processTokenCheckIn(scanToken);
    };

    const handleRecordWastage = async (e) => {
        e.preventDefault();
        try {
            await api.post("/wastage/record", {
                date: todayDate,
                mealType: selectedMeal,
                preparedKg: wastageForm.preparedKg,
                consumedKg: wastageForm.consumedKg,
                remarks: wastageForm.remarks
            });

            const prep = parseFloat(wastageForm.preparedKg) || 0;
            const cons = parseFloat(wastageForm.consumedKg) || 0;
            const leftover = Math.max(0, prep - cons).toFixed(1);

            notify({
                type: "success",
                title: "Wastage Logged Successfully! 📊",
                message: `Prepared ${prep} kg, Consumed ${cons} kg. Leftover food logged.`,
                details: {
                    "Meal Session": selectedMeal,
                    "Prepared (kg)": `${prep} kg`,
                    "Consumed (kg)": `${cons} kg`,
                    "Leftover (kg)": `${leftover} kg`
                }
            });

            setWastageForm({ preparedKg: "", consumedKg: "", remarks: "" });
            fetchAnalytics();
        } catch (err) {
            notify({
                type: "error",
                title: "Wastage Recording Failed",
                message: err.response?.data?.message || "Failed to log food wastage data."
            });
        }
    };

    const handleSaveMenu = async (e) => {
        e.preventDefault();
        const validItems = menuItems.filter((i) => i.name.trim() !== "");

        if (validItems.length === 0) {
            notify({
                type: "error",
                title: "No Dishes Entered",
                message: "Please enter at least one dish name before publishing the menu."
            });
            return;
        }

        try {
            await api.post("/menu/daily", {
                date: todayDate,
                mealType: selectedMeal,
                title: `${selectedMeal} Daily Special`,
                items: validItems.map((i) => ({
                    name: i.name,
                    category: i.category,
                    calories: parseInt(i.calories) || null,
                    allergens: i.allergens ? i.allergens.split(",").map((a) => a.trim()) : [],
                    isSpecial: i.isSpecial
                }))
            });

            notify({
                type: "success",
                title: "Menu Published Successfully! 🍲",
                message: `The ${selectedMeal} menu with ${validItems.length} dish(es) is now live on student dashboards.`,
                details: {
                    Session: selectedMeal,
                    "Dishes Added": `${validItems.length} Dishes`,
                    Date: todayDate,
                    Status: "Live across Campus"
                }
            });
        } catch (err) {
            notify({
                type: "error",
                title: "Publishing Failed",
                message: err.response?.data?.message || "Failed to publish daily menu."
            });
        }
    };

    const handleCreatePoll = async (e) => {
        e.preventDefault();
        const validOptions = newPollForm.dishOptions.filter((d) => d.trim() !== "");
        if (validOptions.length < 2) {
            notify({
                type: "error",
                title: "Insufficient Dish Options",
                message: "Please provide at least 2 distinct dish options for students to vote."
            });
            return;
        }

        try {
            await api.post("/menu/poll/create", {
                weekStartDate: newPollForm.weekStartDate,
                title: newPollForm.title,
                description: newPollForm.description,
                dishOptions: validOptions
            });

            notify({
                type: "success",
                title: "Weekly Special Poll Launched! 🗳️",
                message: `Student poll '${newPollForm.title}' is now active with ${validOptions.length} voting options.`,
                details: {
                    Poll: newPollForm.title,
                    "Options Included": `${validOptions.length} Dishes`,
                    "Week Start": newPollForm.weekStartDate
                }
            });

            setPollModalOpen(false);
            fetchPoll();
        } catch (err) {
            notify({
                type: "error",
                title: "Poll Launch Failed",
                message: err.response?.data?.message || "Could not launch special dish poll."
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Top Operations Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-emerald-700 dark:text-emerald-400" /> Kitchen Operations Console
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                        Date: <span className="font-semibold text-stone-800 dark:text-stone-200">{todayDate}</span> | Live portion management, pass scanner & voting results
                    </p>
                </div>
                <div className="flex gap-1.5 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
                    {["BREAKFAST", "LUNCH", "SNACKS", "DINNER"].map((m) => (
                        <button
                            key={m}
                            onClick={() => setSelectedMeal(m)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                selectedMeal === m
                                    ? "bg-emerald-700 text-white dark:bg-emerald-600 shadow-sm"
                                    : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"
                            }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Manager Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
                {[
                    { id: "operations", label: "Scanner & Headcount", icon: QrCode },
                    { id: "poll", label: "Special Dish Poll (Voting Results)", icon: Star },
                    { id: "wastage", label: "Food Wastage & Forecast", icon: Trash2 },
                    { id: "menu", label: "Publish Daily Menu", icon: Save }
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                                activeTab === tab.id
                                    ? "bg-emerald-700 text-white dark:bg-emerald-600 shadow-sm"
                                    : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: OPERATIONS (SCANNER TERMINAL & LIVE HEADCOUNT) */}
            {activeTab === "operations" && (
                <div className="space-y-6">
                    {/* Headcount Metrics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm">
                            <p className="text-xs text-stone-500 dark:text-stone-400">Total Enrolled</p>
                            <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">{headcount?.totalStudents || 0}</p>
                            <p className="text-[10px] text-stone-400">Hostel Residents</p>
                        </div>
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm">
                            <p className="text-xs text-stone-500 dark:text-stone-400">Expected Diners</p>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{headcount?.expectedDiners || 0}</p>
                            <p className="text-[10px] text-emerald-600/80">Planning head-count</p>
                        </div>
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm">
                            <p className="text-xs text-stone-500 dark:text-stone-400">Attended / Checked-in</p>
                            <p className="text-2xl font-bold text-teal-700 dark:text-teal-400 mt-1">{headcount?.attendedCount || 0}</p>
                            <p className="text-[10px] text-teal-600/80">Verified at counter</p>
                        </div>
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm">
                            <p className="text-xs text-stone-500 dark:text-stone-400">Opted Out (Skipped)</p>
                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{headcount?.optedOutCount || 0}</p>
                            <p className="text-[10px] text-amber-600/80">Saved food portions</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* QR Scanner Terminal */}
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <QrCode className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                                    <div>
                                        <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">Contactless Meal Scanner Terminal</h3>
                                        <p className="text-xs text-stone-500 dark:text-stone-400">Scan via camera or USB scanner gun</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setCameraActive(!cameraActive)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                                        cameraActive
                                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800"
                                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200"
                                    }`}
                                >
                                    {cameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                                    {cameraActive ? "Turn Off Camera" : "Start Live Camera"}
                                </button>
                            </div>

                            {cameraActive && (
                                <div className="bg-stone-100 dark:bg-stone-950 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2">
                                    <div id="qr-reader" className="w-full rounded-xl overflow-hidden text-stone-700 dark:text-stone-300"></div>
                                    <p className="text-[11px] text-center text-stone-500 dark:text-stone-400">
                                        Point camera at student phone pass. Automatic contactless verification.
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleManualScanSubmit} className="space-y-3">
                                <label className="block text-xs font-medium text-stone-600 dark:text-stone-400">
                                    Or Scan with USB Scanner Gun / Paste Pass Token:
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={scanToken}
                                        onChange={(e) => setScanToken(e.target.value)}
                                        className="flex-1 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-emerald-600 font-mono"
                                        placeholder="Scan with barcode gun or paste pass token..."
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold text-xs uppercase tracking-wider transition"
                                    >
                                        Check In
                                    </button>
                                </div>
                            </form>

                            {scanResult && (
                                <div
                                    className={`p-4 rounded-xl border text-xs space-y-1.5 animate-in fade-in ${
                                        scanResult.success
                                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                                            : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {scanResult.success ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
                                        <p className="font-bold text-sm">
                                            {scanResult.success ? "Check-In Approved" : "Check-In Blocked"}
                                        </p>
                                    </div>
                                    <p>{scanResult.data?.message || scanResult.message}</p>
                                    {scanResult.data?.data?.student && (
                                        <div className="p-2.5 bg-white dark:bg-stone-900 rounded-lg text-[11px] space-y-0.5 border border-stone-200 dark:border-stone-800 mt-2">
                                            <p><strong>Student:</strong> {scanResult.data.data.student.name}</p>
                                            <p><strong>Room:</strong> {scanResult.data.data.student.roomNo || "Hostel Resident"}</p>
                                            <p><strong>Meal Session:</strong> {selectedMeal}</p>
                                            {scanResult.data?.data?.warning && (
                                                <p className="text-amber-600 dark:text-amber-400 font-semibold mt-1">
                                                    ⚠️ {scanResult.data.data.warning}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* AI Demand Projection */}
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                <div>
                                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">AI Demand & Portion Forecast</h3>
                                    <p className="text-xs text-stone-500 dark:text-stone-400">Projection based on turnouts & student choices</p>
                                </div>
                            </div>

                            {forecastData ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3">
                                            <span className="text-[10px] text-stone-500 dark:text-stone-400">Predicted Footfall</span>
                                            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                                                ~{forecastData.predictedFootfall} diners
                                            </p>
                                        </div>
                                        <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3">
                                            <span className="text-[10px] text-stone-500 dark:text-stone-400">Recommended Cook Qty</span>
                                            <p className="text-xl font-bold text-teal-700 dark:text-teal-400 mt-0.5">
                                                ~{forecastData.recommendedFoodKg} kg
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1">
                                        <p className="text-[11px] font-semibold text-stone-800 dark:text-stone-200">Predictive Insights:</p>
                                        {forecastData.insights?.map((ins, idx) => (
                                            <p key={idx} className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> {ins}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-stone-400 italic">Calculating portion forecast...</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: SPECIAL DISH POLL & STUDENT VOTING RESULTS (NEW SECTION FOR MANAGER) */}
            {activeTab === "poll" && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                                <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" /> Weekly Special Dish Poll & Voting Results
                            </h3>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                                Live student preferences for weekend & special feast preparations
                            </p>
                        </div>
                        <button
                            onClick={() => setPollModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-semibold text-xs transition shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Launch New Special Dish Poll
                        </button>
                    </div>

                    {activePoll ? (
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                        Active Student Poll
                                    </span>
                                    <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-1">{activePoll.title}</h4>
                                    <p className="text-xs text-stone-500 dark:text-stone-400">{activePoll.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-stone-500 dark:text-stone-400">Total Student Votes</p>
                                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{activePoll.totalVotes || 0}</p>
                                </div>
                            </div>

                            {/* Options Breakdown with Progress Bars */}
                            <div className="space-y-4">
                                {activePoll.options?.map((opt, idx) => {
                                    const isWinner = idx === 0 && opt.voteCount > 0;
                                    return (
                                        <div
                                            key={opt.id}
                                            className={`p-4 rounded-xl border transition ${
                                                isWinner
                                                    ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700"
                                                    : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                                                        {opt.dishName}
                                                    </span>
                                                    {isWinner && (
                                                        <span className="text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                            <Award className="w-3 h-3" /> 🏆 Leading Dish (Student Favorite)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                                                    {opt.voteCount} votes ({opt.percentage || 0}%)
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-stone-200 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        isWinner
                                                            ? "bg-amber-600 dark:bg-amber-500"
                                                            : "bg-emerald-700 dark:bg-emerald-600"
                                                    }`}
                                                    style={{ width: `${opt.percentage || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400">
                                💡 <strong>Kitchen Tip:</strong> The leading dish ({activePoll.options?.[0]?.dishName || "Selected favorite"}) can be scheduled for preparation during this weekend's special dining session.
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 text-center space-y-3">
                            <p className="text-stone-500 dark:text-stone-400 text-sm">No active special dish poll currently running.</p>
                            <button
                                onClick={() => setPollModalOpen(true)}
                                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-semibold text-xs"
                            >
                                Launch First Special Poll
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: FOOD WASTAGE & ANALYTICS */}
            {activeTab === "wastage" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">Food Wastage Analytics</h3>
                                <p className="text-xs text-stone-500 dark:text-stone-400">Prepared vs Leftover tracking</p>
                            </div>
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                                Waste Rate: <strong className="text-amber-700 dark:text-amber-400">{wastageData?.summary?.overallWasteRate || 0}%</strong>
                            </span>
                        </div>

                        {/* Recharts Bar Chart */}
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={wastageData?.trends || []}>
                                    <XAxis dataKey="date" stroke="#78716c" fontSize={10} />
                                    <YAxis stroke="#78716c" fontSize={10} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1c1917", borderColor: "#44403c", fontSize: "11px", color: "#f5f5f4" }}
                                    />
                                    <Bar dataKey="preparedKg" fill="#047857" name="Prepared (kg)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="wastedKg" fill="#b91c1c" name="Leftover (kg)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Wastage Form */}
                        <form onSubmit={handleRecordWastage} className="grid grid-cols-3 gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={wastageForm.preparedKg}
                                onChange={(e) => setWastageForm({ ...wastageForm, preparedKg: e.target.value })}
                                className="bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400"
                                placeholder="Cooked (kg)"
                            />
                            <input
                                type="number"
                                step="0.1"
                                required
                                value={wastageForm.consumedKg}
                                onChange={(e) => setWastageForm({ ...wastageForm, consumedKg: e.target.value })}
                                className="bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400"
                                placeholder="Eaten (kg)"
                            />
                            <button
                                type="submit"
                                className="py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold text-xs transition"
                            >
                                Log Waste
                            </button>
                        </form>
                    </div>

                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                        <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">Wastage Reduction Impact</h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                            By collecting student meal registrations in advance, hostel kitchens typically reduce leftover waste by 30% to 45%.
                        </p>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
                                <p className="text-xs text-stone-500 dark:text-stone-400">Total Prepared (14d)</p>
                                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                                    {wastageData?.summary?.totalPreparedKg || 0} kg
                                </p>
                            </div>
                            <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
                                <p className="text-xs text-stone-500 dark:text-stone-400">Total Eaten (14d)</p>
                                <p className="text-xl font-bold text-teal-700 dark:text-teal-400">
                                    {wastageData?.summary?.totalConsumedKg || 0} kg
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: SETUP DAILY MENU */}
            {activeTab === "menu" && (
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm max-w-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">Setup {selectedMeal} Menu</h3>
                            <p className="text-xs text-stone-500 dark:text-stone-400">Add dishes, calories & nutritional tags for {todayDate}</p>
                        </div>
                        <button
                            onClick={() =>
                                setMenuItems([...menuItems, { name: "", category: "VEG", calories: "", allergens: "", isSpecial: false }])
                            }
                            className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                        >
                            + Add Dish Row
                        </button>
                    </div>

                    <form onSubmit={handleSaveMenu} className="space-y-3">
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {menuItems.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 bg-stone-50 dark:bg-stone-950 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800">
                                    <input
                                        type="text"
                                        placeholder="Dish Name"
                                        value={item.name}
                                        onChange={(e) => {
                                            const copy = [...menuItems];
                                            copy[index].name = e.target.value;
                                            setMenuItems(copy);
                                        }}
                                        className="col-span-6 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100"
                                    />
                                    <input
                                        type="number"
                                        placeholder="kcal"
                                        value={item.calories}
                                        onChange={(e) => {
                                            const copy = [...menuItems];
                                            copy[index].calories = e.target.value;
                                            setMenuItems(copy);
                                        }}
                                        className="col-span-3 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100"
                                    />
                                    <select
                                        value={item.category}
                                        onChange={(e) => {
                                            const copy = [...menuItems];
                                            copy[index].category = e.target.value;
                                            setMenuItems(copy);
                                        }}
                                        className="col-span-3 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-900 dark:text-stone-100"
                                    >
                                        <option value="VEG">Veg</option>
                                        <option value="NON_VEG">Non-Veg</option>
                                        <option value="JAIN">Jain</option>
                                    </select>
                                </div>
                            ))}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                            <Save className="w-3.5 h-3.5" /> Publish {selectedMeal} Menu Live
                        </button>
                    </form>
                </div>
            )}

            {/* Launch New Poll Modal */}
            {pollModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-stone-900 dark:text-stone-100">
                        <button
                            onClick={() => setPollModalOpen(false)}
                            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <h3 className="text-lg font-bold">Launch Weekly Special Dish Poll</h3>
                            <p className="text-xs text-stone-500 dark:text-stone-400">Students vote on their dashboards to choose the feast menu.</p>
                        </div>

                        <form onSubmit={handleCreatePoll} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Week Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={newPollForm.weekStartDate}
                                    onChange={(e) => setNewPollForm({ ...newPollForm, weekStartDate: e.target.value })}
                                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Poll Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newPollForm.title}
                                    onChange={(e) => setNewPollForm({ ...newPollForm, title: e.target.value })}
                                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs"
                                    placeholder="e.g. Sunday Special Feast Vote"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-medium text-stone-700 dark:text-stone-300">Dish Voting Options</label>
                                    <button
                                        type="button"
                                        onClick={() => setNewPollForm({ ...newPollForm, dishOptions: [...newPollForm.dishOptions, ""] })}
                                        className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold"
                                    >
                                        + Add Option
                                    </button>
                                </div>
                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                    {newPollForm.dishOptions.map((opt, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                type="text"
                                                required
                                                value={opt}
                                                onChange={(e) => {
                                                    const copy = [...newPollForm.dishOptions];
                                                    copy[i] = e.target.value;
                                                    setNewPollForm({ ...newPollForm, dishOptions: copy });
                                                }}
                                                className="flex-1 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs"
                                                placeholder={`Option ${i + 1} dish name`}
                                            />
                                            {newPollForm.dishOptions.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const copy = newPollForm.dishOptions.filter((_, idx) => idx !== i);
                                                        setNewPollForm({ ...newPollForm, dishOptions: copy });
                                                    }}
                                                    className="text-stone-400 hover:text-rose-600 px-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-semibold text-xs uppercase tracking-wider transition"
                            >
                                Publish Poll to Students
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
