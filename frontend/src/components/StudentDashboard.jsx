import React, { useState, useEffect } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { QRCodeSVG } from "qrcode.react";
import {
    QrCode,
    Utensils,
    CheckCircle2,
    XCircle,
    Star,
    AlertCircle,
    Calendar,
    FileText,
    Download,
    Flame,
    Leaf,
    Clock,
    Camera,
    CreditCard,
    Copy,
    X,
    Check
} from "lucide-react";

export default function StudentDashboard() {
    const { user } = useAuth();
    const { notify } = useNotification();
    const [activeTab, setActiveTab] = useState("menu");
    const [menu, setMenu] = useState([]);
    const [qrData, setQrData] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [selectedQRMeal, setSelectedQRMeal] = useState("");
    const [activePoll, setActivePoll] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [bill, setBill] = useState(null);
    const [myLeaves, setMyLeaves] = useState([]);
    const [myAttendance, setMyAttendance] = useState([]);
    const [optLoading, setOptLoading] = useState(false);
    const [payLoading, setPayLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Leave request form state
    const [leaveData, setLeaveData] = useState({ startDate: "", endDate: "", reason: "" });

    // Complaint form state
    const [complaintData, setComplaintData] = useState({ category: "FOOD_QUALITY", title: "", description: "" });
    const [complaintPhoto, setComplaintPhoto] = useState(null);

    const todayDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    const mealTimingDetails = {
        BREAKFAST: {
            registerCutoff: "08:00 AM",
            diningWindow: "07:30 AM - 11:30 AM",
            nextMeal: "Lunch (11:30 AM)"
        },
        LUNCH: {
            registerCutoff: "12:00 PM",
            diningWindow: "11:30 AM - 04:30 PM",
            nextMeal: "Snacks (04:30 PM)"
        },
        SNACKS: {
            registerCutoff: "04:30 PM",
            diningWindow: "04:30 PM - 07:30 PM",
            nextMeal: "Dinner (07:30 PM)"
        },
        DINNER: {
            registerCutoff: "07:30 PM",
            diningWindow: "07:30 PM - 11:30 PM",
            nextMeal: "Breakfast Tomorrow (07:30 AM)"
        }
    };

    const fetchDashboardData = async () => {
        try {
            // Fetch Menu
            const menuRes = await api.get(`/menu/daily?date=${todayDate}`);
            if (menuRes.data?.success) setMenu(menuRes.data.data);

            // Fetch Active Poll
            const pollRes = await api.get("/menu/poll/active");
            if (pollRes.data?.success) setActivePoll(pollRes.data.data);

            // Fetch My Complaints
            const compRes = await api.get("/complaints/my");
            if (compRes.data?.success) setComplaints(compRes.data.data);

            // Fetch Bill
            const billRes = await api.get("/billing/my-bill");
            if (billRes.data?.success) setBill(billRes.data.data);

            // Fetch My Leave Applications
            const leavesRes = await api.get("/billing/leaves/my");
            if (leavesRes.data?.success) setMyLeaves(leavesRes.data.data);

            // Fetch My Attendance for current month
            const attRes = await api.get("/attendance/my-history");
            if (attRes.data?.success) setMyAttendance(attRes.data.data || []);
        } catch (err) {
            console.error("Dashboard data fetch error:", err);
        }
    };

    const handleDownloadInvoice = async (billId) => {
        try {
            const res = await api.get(`/billing/invoice/${billId}`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Mess_Invoice_${billId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            notify({
                type: "error",
                title: "Download Failed",
                message: err.response?.data?.message || "Could not download PDF invoice."
            });
        }
    };

    const fetchQR = async (mealOverride = "") => {
        setQrLoading(true);
        try {
            const url = mealOverride ? `/attendance/my-qr?mealType=${mealOverride}` : "/attendance/my-qr";
            const res = await api.get(url);
            if (res.data?.success) {
                setQrData(res.data.data);
            }
        } catch (err) {
            notify({
                type: "error",
                title: "QR Generation Notice",
                message: err.response?.data?.message || "Failed to generate meal pass token."
            });
        } finally {
            setQrLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        fetchQR(selectedQRMeal);
    }, [selectedQRMeal]);

    const handleToggleOpt = async (mealType, desiredStatus) => {
        setOptLoading(true);
        try {
            await api.post("/attendance/opt-status", {
                date: todayDate,
                mealType,
                status: desiredStatus
            });

            const timings = mealTimingDetails[mealType] || {};

            notify({
                type: "success",
                title: desiredStatus === "OPTED_IN" ? "Meal Booking Confirmed! 🎉" : "Meal Skipped (Opt-Out) 👍",
                message: desiredStatus === "OPTED_IN"
                    ? `Your portion for ${mealType} has been reserved! You can attend the mess counter at any time during ${timings.diningWindow} (before ${timings.nextMeal}).`
                    : `Opt-Out confirmed for ${mealType}. You have skipped this meal and reduced food waste.`,
                details: {
                    Meal: mealType,
                    Date: todayDate,
                    Status: desiredStatus === "OPTED_IN" ? "Attending (Portion Reserved)" : "Skipped (Opt-Out)",
                    "Dining Window": timings.diningWindow || "Active before next meal",
                    "Next Meal Starts": timings.nextMeal || "Upcoming session"
                }
            });

            fetchDashboardData();
        } catch (err) {
            const msg = err.response?.data?.message || "Action failed or registration cutoff has passed.";
            notify({
                type: "error",
                title: "Registration Cut-Off Notice ⏱️",
                message: msg,
                details: {
                    Meal: mealType,
                    Date: todayDate,
                    "Rule": "Students must register before the cutoff time. Once registered, dining is available anytime before the next meal."
                }
            });
        } finally {
            setOptLoading(false);
        }
    };

    const handleRateDish = async (menuItemId, rating, dishName = "Dish") => {
        try {
            await api.post("/menu/rate-dish", { menuItemId, rating });
            notify({
                type: "success",
                title: "Rating Recorded! ⭐",
                message: `Thank you for rating ${dishName} with ${rating} stars. Your feedback helps the kitchen improve daily quality.`
            });
            fetchDashboardData();
        } catch (err) {
            notify({
                type: "error",
                title: "Rating Failed",
                message: err.response?.data?.message || "Could not save dish rating."
            });
        }
    };

    const handleVotePoll = async (optionId, dishName) => {
        try {
            await api.post("/menu/poll/vote", { optionId });
            notify({
                type: "success",
                title: "Vote Recorded! 🗳️",
                message: `Your vote for '${dishName}' has been submitted. The winning dish will be prepared for the special weekend feast!`,
                details: {
                    "Voted Item": dishName,
                    "Poll Status": "Vote counted live in Manager Console"
                }
            });
            const pollRes = await api.get("/menu/poll/active");
            if (pollRes.data?.success) setActivePoll(pollRes.data.data);
        } catch (err) {
            notify({
                type: "error",
                title: "Vote Failed",
                message: err.response?.data?.message || "Could not record vote."
            });
        }
    };

    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/billing/leave", leaveData);
            notify({
                type: "success",
                title: "Leave Request Submitted! 📅",
                message: `Your leave request from ${leaveData.startDate} to ${leaveData.endDate} has been sent to the Warden for review and rebate credit.`,
                details: {
                    "Start Date": leaveData.startDate,
                    "End Date": leaveData.endDate,
                    Status: "Pending Warden Approval"
                }
            });
            setLeaveData({ startDate: "", endDate: "", reason: "" });
            fetchDashboardData();
        } catch (err) {
            notify({
                type: "error",
                title: "Leave Submission Failed",
                message: err.response?.data?.message || "Could not submit leave request."
            });
        }
    };

    const handleComplaintSubmit = async (e) => {
        e.preventDefault();
        const form = new FormData();
        form.append("category", complaintData.category);
        form.append("title", complaintData.title);
        form.append("description", complaintData.description);
        if (complaintPhoto) form.append("photo", complaintPhoto);

        try {
            await api.post("/complaints/submit", form, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            notify({
                type: "success",
                title: "Complaint Lodged Successfully! 📋",
                message: `Your report '${complaintData.title}' with category ${complaintData.category} has been submitted for Warden supervision and kitchen corrective action.`,
                details: {
                    Issue: complaintData.title,
                    Category: complaintData.category,
                    Status: "Pending Warden Review"
                }
            });
            setComplaintData({ category: "FOOD_QUALITY", title: "", description: "" });
            setComplaintPhoto(null);
            const compRes = await api.get("/complaints/my");
            if (compRes.data?.success) setComplaints(compRes.data.data);
        } catch (err) {
            notify({
                type: "error",
                title: "Complaint Submission Failed",
                message: err.response?.data?.message || "Could not lodge complaint."
            });
        }
    };

    // Razorpay Checkout Integration
    const handlePayRazorpay = async () => {
        if (!bill || bill.status === "PAID") return;
        setPayLoading(true);

        try {
            const orderRes = await api.post("/billing/create-order", { billId: bill.id });
            if (!orderRes.data?.success) {
                throw new Error(orderRes.data?.message || "Order initialization failed");
            }

            const { orderId, amount, currency, keyId, isDemoMode } = orderRes.data.data;

            if (!isDemoMode && window.Razorpay) {
                const options = {
                    key: keyId,
                    amount: amount,
                    currency: currency,
                    name: "Smart College Mess",
                    description: `Mess Billing for ${bill.month}/${bill.year}`,
                    order_id: orderId,
                    handler: async (response) => {
                        try {
                            await api.post("/billing/verify-payment", {
                                billId: bill.id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });
                            notify({
                                type: "success",
                                title: "Payment Verified! 💳",
                                message: `Mess bill of Rs. ${bill.totalDue} for period ${bill.month}/${bill.year} has been marked as PAID.`,
                                details: {
                                    Amount: `Rs. ${bill.totalDue}`,
                                    Status: "PAID",
                                    "Payment ID": response.razorpay_payment_id
                                }
                            });
                            fetchDashboardData();
                        } catch (vErr) {
                            notify({
                                type: "error",
                                title: "Signature Verification Failed",
                                message: "Payment was processed but server signature verification failed. Please contact accounts."
                            });
                        }
                    },
                    prefill: {
                        name: user?.name || "Student",
                        email: user?.email || "student@college.edu"
                    },
                    theme: { color: "#047857" }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                // Seamless simulation mode
                const simPaymentId = `pay_upi_sim_${Date.now()}`;
                await api.post("/billing/verify-payment", {
                    billId: bill.id,
                    razorpay_order_id: orderId,
                    razorpay_payment_id: simPaymentId,
                    razorpay_signature: "simulated_signature"
                });
                notify({
                    type: "success",
                    title: "Payment Received! 💳",
                    message: `Payment of Rs. ${bill.totalDue} completed successfully via Razorpay (UPI Simulated). Bill marked as PAID.`,
                    details: {
                        Amount: `Rs. ${bill.totalDue}`,
                        Period: `${bill.month}/${bill.year}`,
                        "Transaction Ref": simPaymentId
                    }
                });
                fetchDashboardData();
            }
        } catch (err) {
            notify({
                type: "error",
                title: "Payment Failed",
                message: err.response?.data?.message || err.message || "Could not initialize payment transaction."
            });
        } finally {
            setPayLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Quick Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
                {[
                    { id: "menu", label: "Today's Menu & Registration", icon: Utensils },
                    { id: "qr", label: "Meal Pass (QR Badge)", icon: QrCode },
                    { id: "poll", label: "Special Dish Poll", icon: Star },
                    { id: "complaints", label: "Complaints & Feedback", icon: AlertCircle },
                    { id: "billing", label: "Monthly Bill & Leaves", icon: FileText }
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

            {/* TAB 1: MENU & OPT-IN */}
            {activeTab === "menu" && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-sm">
                        <div>
                            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Daily Dining Menu & Registration</h2>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                                Register before preparation cutoff. After registering, you can dine anytime before the next meal session.
                            </p>
                        </div>
                        <div className="text-xs bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-lg text-stone-600 dark:text-stone-300">
                            Date: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{todayDate}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {["BREAKFAST", "LUNCH", "SNACKS", "DINNER"].map((mealType) => {
                            const mealMenu = menu.find((m) => m.mealType === mealType);
                            const timings = mealTimingDetails[mealType] || {};

                            return (
                                <div
                                    key={mealType}
                                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-emerald-600/40 transition"
                                >
                                    <div>
                                        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                                            <div>
                                                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">{mealType}</h3>
                                                <p className="text-xs text-stone-500 dark:text-stone-400">
                                                    {mealMenu?.title || "Daily College Mess Preparation"}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg">
                                                    Dining: {timings.diningWindow}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Timing and Cutoff Badge Note */}
                                        <div className="my-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800/80 text-[11px] space-y-1">
                                            <div className="flex items-center justify-between text-stone-600 dark:text-stone-300">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                                    <strong>Register Before:</strong>
                                                </span>
                                                <span className="font-bold text-amber-700 dark:text-amber-400">{timings.registerCutoff}</span>
                                            </div>
                                            <p className="text-[10px] text-stone-500 dark:text-stone-400">
                                                ✓ Once registered, you may enter the mess anytime before {timings.nextMeal}.
                                            </p>
                                        </div>

                                        {/* Dishes List */}
                                        <div className="py-2 space-y-2.5">
                                            {mealMenu?.items && mealMenu.items.length > 0 ? (
                                                mealMenu.items.map((item) => (
                                                    <div key={item.id} className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">{item.name}</span>
                                                                {item.category === "VEG" && (
                                                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                                                                        VEG
                                                                    </span>
                                                                )}
                                                                {item.isSpecial && (
                                                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Special
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                                                                {item.calories && (
                                                                    <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-mono">
                                                                        <Flame className="w-3.5 h-3.5" /> {item.calories} kcal
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Rating Row */}
                                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-200 dark:border-stone-800/60 text-xs">
                                                            <span className="text-stone-500 dark:text-stone-400">
                                                                Avg: {item.avgRating ? `${item.avgRating} ★ (${item.ratingsCount})` : "Not rated yet"}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        onClick={() => handleRateDish(item.id, star, item.name)}
                                                                        className="hover:scale-125 transition text-stone-300 dark:text-stone-600 hover:text-amber-500"
                                                                        title={`Rate ${star} star`}
                                                                    >
                                                                        ★
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-stone-400 italic py-2">
                                                    Menu items to be finalized by kitchen staff. Standard meal offered.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                                        {(() => {
                                            const att = myAttendance.find(
                                                (a) => a.mealType === mealType && String(a.date).slice(0, 10) === todayDate
                                            );
                                            const statusLabel =
                                                att?.status === "ATTENDED"
                                                    ? "Attended"
                                                    : att?.status === "OPTED_OUT"
                                                    ? "Opted Out"
                                                    : att?.status === "OPTED_IN"
                                                    ? "Opted In"
                                                    : "Registered default";
                                            const statusColor =
                                                att?.status === "ATTENDED"
                                                    ? "text-emerald-700 dark:text-emerald-400"
                                                    : att?.status === "OPTED_OUT"
                                                    ? "text-rose-700 dark:text-rose-400"
                                                    : att?.status === "OPTED_IN"
                                                    ? "text-teal-700 dark:text-teal-400"
                                                    : "text-stone-700 dark:text-stone-300";
                                            return (
                                                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                                                    Status: <span className={`font-semibold ${statusColor}`}>{statusLabel}</span>
                                                </div>
                                            );
                                        })()}
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={optLoading}
                                                onClick={() => handleToggleOpt(mealType, "OPTED_IN")}
                                                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-semibold transition shadow-sm disabled:opacity-50"
                                            >
                                                Book / Reserve Meal
                                            </button>
                                            <button
                                                disabled={optLoading}
                                                onClick={() => handleToggleOpt(mealType, "OPTED_OUT")}
                                                className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 text-xs font-semibold transition disabled:opacity-50"
                                            >
                                                Skip (Opt-Out)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: QR MEAL PASS */}
            {activeTab === "qr" && (
                <div className="max-w-md mx-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-center space-y-6 shadow-sm">
                    <div>
                        <span className="text-[10px] font-bold tracking-wider text-emerald-800 bg-emerald-100 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-full uppercase">
                            Digital Dining Pass
                        </span>
                        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-2">Contactless QR Pass</h2>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                            Present this QR at the mess counter entrance anytime during your registered meal window.
                        </p>
                    </div>

                    {/* Meal selector for QR */}
                    <div className="flex justify-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
                        {["", "BREAKFAST", "LUNCH", "SNACKS", "DINNER"].map((m) => (
                            <button
                                key={m}
                                onClick={() => setSelectedQRMeal(m)}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                                    selectedQRMeal === m
                                        ? "bg-emerald-700 text-white dark:bg-emerald-600 shadow-sm"
                                        : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
                                }`}
                            >
                                {m === "" ? "Auto Active" : m}
                            </button>
                        ))}
                    </div>

                    <div className="bg-stone-50 dark:bg-stone-950 p-6 rounded-2xl inline-block border border-stone-200 dark:border-stone-800 shadow-inner">
                        {qrData?.token ? (
                            <QRCodeSVG value={qrData.token} size={220} level="H" />
                        ) : (
                            <div className="w-52 h-52 flex items-center justify-center text-stone-400 text-xs">
                                Generating pass code...
                            </div>
                        )}
                    </div>

                    {qrData?.token && (
                        <div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(qrData.token);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2500);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-mono transition border border-stone-200 dark:border-stone-700"
                            >
                                <Copy className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                                {copied ? "Pass Token Copied to Clipboard!" : "Copy Pass Token String"}
                            </button>
                        </div>
                    )}

                    <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4 text-left space-y-1.5 text-xs">
                        <div className="flex justify-between">
                            <span className="text-stone-500 dark:text-stone-400">Meal Session:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">{qrData?.currentMeal || "LUNCH"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-500 dark:text-stone-400">Student Name:</span>
                            <span className="font-semibold text-stone-800 dark:text-stone-200">{qrData?.student?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-500 dark:text-stone-400">Hostel Room:</span>
                            <span className="text-stone-700 dark:text-stone-300">{qrData?.student?.roomNo || "Campus Resident"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-500 dark:text-stone-400">Single Entry Guard:</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Active (Anti-Duplicate)</span>
                        </div>
                    </div>

                    <button
                        onClick={() => fetchQR(selectedQRMeal)}
                        disabled={qrLoading}
                        className="w-full py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition"
                    >
                        {qrLoading ? "Refreshing Pass..." : "Refresh Pass Code"}
                    </button>
                </div>
            )}

            {/* TAB 3: SPECIAL DISH POLL */}
            {activeTab === "poll" && (
                <div className="max-w-2xl mx-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-6 shadow-sm">
                    <div>
                        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Special Dish Voting Poll</h2>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                            Vote for your favorite dish. The mess manager views live results and prepares the winning dish this weekend!
                        </p>
                    </div>

                    {activePoll ? (
                        <div className="space-y-4">
                            <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4">
                                <h3 className="font-semibold text-stone-800 dark:text-stone-200 text-base">{activePoll.title}</h3>
                                {activePoll.description && (
                                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{activePoll.description}</p>
                                )}
                            </div>

                            <div className="space-y-3">
                                {activePoll.options?.map((opt) => {
                                    const isVoted = activePoll.userVotedOptionId === opt.id;
                                    return (
                                        <div
                                            key={opt.id}
                                            onClick={() => handleVotePoll(opt.id, opt.dishName)}
                                            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                                isVoted
                                                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm"
                                                    : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 hover:border-stone-300"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                        isVoted ? "border-emerald-600 bg-emerald-600" : "border-stone-400"
                                                    }`}
                                                >
                                                    {isVoted && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                </div>
                                                <span className="font-semibold text-sm text-stone-900 dark:text-stone-100">{opt.dishName}</span>
                                            </div>
                                            <span className="text-xs bg-stone-200 dark:bg-stone-800 px-2.5 py-1 rounded-full text-stone-700 dark:text-stone-300 font-mono">
                                                {opt.voteCount} votes ({opt.percentage || 0}%)
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-stone-400 italic">No special poll active right now. Mess manager will publish upcoming choices soon.</p>
                    )}
                </div>
            )}

            {/* TAB 4: COMPLAINTS */}
            {activeTab === "complaints" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                        <div>
                            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Report Hygiene / Food Quality Issue</h2>
                            <p className="text-xs text-stone-500 dark:text-stone-400">Attach photo evidence for warden review and quick corrective action</p>
                        </div>

                        <form onSubmit={handleComplaintSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Issue Category</label>
                                <select
                                    value={complaintData.category}
                                    onChange={(e) => setComplaintData({ ...complaintData, category: e.target.value })}
                                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-stone-100"
                                >
                                    <option value="FOOD_QUALITY">Food Quality / Taste</option>
                                    <option value="HYGIENE">Hygiene & Cleanliness</option>
                                    <option value="SERVICE">Service & Staff</option>
                                    <option value="TIMING">Mess Timing Delay</option>
                                    <option value="OTHER">Other Issues</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Issue Title</label>
                                <input
                                    type="text"
                                    required
                                    value={complaintData.title}
                                    onChange={(e) => setComplaintData({ ...complaintData, title: e.target.value })}
                                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-stone-100"
                                    placeholder="e.g. Under-cooked rice in lunch"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Detailed Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={complaintData.description}
                                    onChange={(e) => setComplaintData({ ...complaintData, description: e.target.value })}
                                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-stone-100"
                                    placeholder="Describe specific details, time, and counter..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Photo Proof (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setComplaintPhoto(e.target.files[0])}
                                    className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 dark:file:bg-stone-800 file:text-emerald-700 dark:file:text-emerald-400"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-semibold text-sm transition shadow-sm"
                            >
                                Submit Complaint to Warden
                            </button>
                        </form>
                    </div>

                    {/* Complaint History */}
                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">My Complaint Log</h2>
                        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                            {complaints.length > 0 ? (
                                complaints.map((c) => (
                                    <div key={c.id} className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{c.title}</span>
                                            <span
                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                                    c.status === "RESOLVED"
                                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800"
                                                        : c.status === "IN_PROGRESS"
                                                        ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800"
                                                        : "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800"
                                                }`}
                                            >
                                                {c.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-stone-600 dark:text-stone-400">{c.description}</p>
                                        {c.photoUrl && (
                                            <a
                                                href={c.photoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
                                            >
                                                <Camera className="w-3.5 h-3.5" /> View Photo Evidence
                                            </a>
                                        )}
                                        {c.wardenRemark && (
                                            <div className="p-2 rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-800 dark:text-purple-300">
                                                <span className="font-semibold">Warden Remark:</span> {c.wardenRemark}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-stone-400 italic">No complaints logged.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 5: BILLING & LEAVE REBATES */}
            {activeTab === "billing" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Current Bill */}
                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Current Monthly Bill</h2>
                                <p className="text-xs text-stone-500 dark:text-stone-400">Fair billing based on actual meals attended & leave rebates</p>
                            </div>
                            {bill && (
                                <button
                                    type="button"
                                    onClick={() => handleDownloadInvoice(bill.id)}
                                    className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition"
                                    title="Download PDF Invoice"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {bill ? (
                            <div className="space-y-4">
                                <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-stone-500 dark:text-stone-400">Billing Period:</span>
                                        <span className="font-semibold text-stone-800 dark:text-stone-200">{bill.month} / {bill.year}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-500 dark:text-stone-400">Meals Attended:</span>
                                        <span className="font-semibold text-stone-800 dark:text-stone-200">{bill.mealsCount} meals</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-500 dark:text-stone-400">Gross Meal Charges:</span>
                                        <span className="text-stone-700 dark:text-stone-300">Rs. {bill.amount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-stone-500 dark:text-stone-400">Leave Rebate (Days Away):</span>
                                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">- Rs. {bill.rebate}</span>
                                    </div>
                                    <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between text-base">
                                        <span className="font-bold text-stone-900 dark:text-stone-100">Net Amount Due:</span>
                                        <span className="font-bold text-emerald-700 dark:text-emerald-400">Rs. {bill.totalDue}</span>
                                    </div>
                                </div>

                                {bill.status === "PENDING" ? (
                                    <div className="space-y-2">
                                        <button
                                            disabled={payLoading}
                                            onClick={handlePayRazorpay}
                                            className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            {payLoading ? "Connecting Razorpay..." : `Pay Rs. ${bill.totalDue} via UPI / Card (Razorpay)`}
                                        </button>
                                        <p className="text-[10px] text-center text-stone-500 dark:text-stone-400">
                                            Secured by Razorpay. Supports Google Pay, PhonePe, Paytm, Cards & Netbanking.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-3.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-2 font-semibold">
                                            <CheckCircle2 className="w-4 h-4" /> Bill Paid via Razorpay ({bill.razorpayPaymentId || "UPI"})
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleDownloadInvoice(bill.id)}
                                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-300 font-semibold inline-flex items-center gap-1"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Receipt
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-6 text-center text-xs text-stone-400">
                                Bill calculation is run at the close of every month. Your attendance is currently recorded daily.
                            </div>
                        )}
                    </div>

                    {/* Apply for Leave (Rebate) */}
                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                        <div>
                            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Apply for Mess Leave (Rebate)</h2>
                            <p className="text-xs text-stone-500 dark:text-stone-400">Going home or on leave? Auto-deduct meal charges for approved days</p>
                        </div>

                        <form onSubmit={handleLeaveSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={leaveData.startDate}
                                        onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                                        className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-stone-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={leaveData.endDate}
                                        onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                                        className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-stone-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Reason for Leave</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={leaveData.reason}
                                    onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
                                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-900 dark:text-stone-100"
                                    placeholder="e.g. Traveling home for festival holidays"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-semibold text-sm transition shadow-sm"
                            >
                                Apply for Leave Rebate
                            </button>
                        </form>

                        {/* My Submitted Leave Applications */}
                        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-2.5">
                            <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                                My Leave & Rebate History ({myLeaves.length})
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {myLeaves.length > 0 ? (
                                    myLeaves.map((l) => (
                                        <div
                                            key={l.id}
                                            className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl p-3 text-xs space-y-1"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                                    📅 {new Date(l.startDate).toLocaleDateString()} ➔ {new Date(l.endDate).toLocaleDateString()}
                                                </span>
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                        l.status === "APPROVED"
                                                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                                            : l.status === "REJECTED"
                                                            ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                                                            : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                                    }`}
                                                >
                                                    {l.status}
                                                </span>
                                            </div>
                                            <p className="text-stone-600 dark:text-stone-400 text-[11px] truncate">
                                                Reason: {l.reason}
                                            </p>
                                            {l.status === "APPROVED" && (
                                                <p className="text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">
                                                    ✓ Approved by {l.approvedBy || "Warden"} (Rebate credited at month-end)
                                                </p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-stone-400 italic">No leaves applied yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
