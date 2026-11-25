import React, { useState, useEffect } from "react";
import api from "../api/client";
import { useNotification } from "../context/NotificationContext";
import { AlertCircle, CheckCircle2, Camera, Check, X, Shield, Calendar, FileText } from "lucide-react";

export default function WardenDashboard() {
    const { notify } = useNotification();
    const [complaints, setComplaints] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [activeTab, setActiveTab] = useState("complaints");
    const [wardenRemark, setWardenRemark] = useState({});

    const fetchData = async () => {
        try {
            const compRes = await api.get("/complaints/all");
            if (compRes.data?.success) setComplaints(compRes.data.data);

            const leaveRes = await api.get("/billing/leaves/all");
            if (leaveRes.data?.success) setLeaves(leaveRes.data.data);
        } catch (err) {
            console.error("Warden fetch error:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateComplaint = async (id, status) => {
        try {
            await api.patch(`/complaints/${id}/status`, {
                status,
                wardenRemark: wardenRemark[id] || ""
            });

            notify({
                type: "success",
                title: "Complaint Status Updated! 📋",
                message: `Complaint record #${id} has been marked as ${status}. Student can view the updated remark.`,
                details: {
                    Status: status,
                    Remark: wardenRemark[id] || "No extra remark added"
                }
            });

            fetchData();
        } catch (err) {
            notify({
                type: "error",
                title: "Update Failed",
                message: err.response?.data?.message || "Failed to update complaint status."
            });
        }
    };

    const handleReviewLeave = async (id, status) => {
        try {
            await api.patch(`/billing/leave/${id}/review`, { status });

            notify({
                type: "success",
                title: status === "APPROVED" ? "Leave Approved & Rebate Credited! 📅" : "Leave Request Rejected ❌",
                message: `Student leave application has been set to ${status}. Accounts engine will calculate the monthly rebate accordingly.`,
                details: {
                    Decision: status,
                    "Rebate Applied": status === "APPROVED" ? "Yes (₹150/day deduction)" : "No deduction"
                }
            });

            fetchData();
        } catch (err) {
            notify({
                type: "error",
                title: "Review Failed",
                message: err.response?.data?.message || "Failed to process leave request decision."
            });
        }
    };

    const pendingComplaintsCount = complaints.filter((c) => c.status === "PENDING").length;
    const pendingLeavesCount = leaves.filter((l) => l.status === "PENDING").length;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-700 dark:text-purple-400" /> Warden Supervision Console
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Hostel mess discipline, complaint resolution & leave reviews</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
                    <button
                        onClick={() => setActiveTab("complaints")}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                            activeTab === "complaints"
                                ? "bg-purple-700 text-white dark:bg-purple-600 shadow-sm"
                                : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
                        }`}
                    >
                        <AlertCircle className="w-4 h-4" />
                        Complaints Queue
                        {pendingComplaintsCount > 0 && (
                            <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {pendingComplaintsCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("leaves")}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                            activeTab === "leaves"
                                ? "bg-emerald-700 text-white dark:bg-emerald-600 shadow-sm"
                                : "text-stone-600 dark:text-stone-300 hover:text-stone-900"
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Leave & Rebates
                        {pendingLeavesCount > 0 && (
                            <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {pendingLeavesCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* TAB 1: COMPLAINTS QUEUE */}
            {activeTab === "complaints" && (
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">Hostel Mess Complaints Queue</h3>
                            <p className="text-xs text-stone-500 dark:text-stone-400">Hygiene, food quality and service issues reported by students</p>
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-800 px-3 py-1 rounded-full font-mono">
                            {pendingComplaintsCount} Open Complaints
                        </span>
                    </div>

                    <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                        {complaints.length > 0 ? (
                            complaints.map((c) => (
                                <div key={c.id} className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 px-2.5 py-0.5 rounded font-semibold">
                                                {c.category}
                                            </span>
                                            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">{c.title}</h4>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                                            <span>Student: <strong className="text-stone-800 dark:text-stone-200">{c.user.name}</strong> (Room {c.user.roomNo || "N/A"})</span>
                                            <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
                                        {c.description}
                                    </p>

                                    {c.photoUrl && (
                                        <div>
                                            <a
                                                href={c.photoUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg"
                                            >
                                                <Camera className="w-4 h-4" /> View Timestamped Photo Proof
                                            </a>
                                        </div>
                                    )}

                                    {/* Status update & remarks */}
                                    <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                                        <input
                                            type="text"
                                            placeholder="Add resolution remark (e.g. Kitchen inspected, cook warned)..."
                                            value={wardenRemark[c.id] || ""}
                                            onChange={(e) => setWardenRemark({ ...wardenRemark, [c.id]: e.target.value })}
                                            className="flex-1 min-w-[260px] bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400"
                                        />
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUpdateComplaint(c.id, "RESOLVED")}
                                                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-semibold flex items-center gap-1 shadow-sm"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Mark Resolved
                                            </button>
                                            <button
                                                onClick={() => handleUpdateComplaint(c.id, "IN_PROGRESS")}
                                                className="px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 text-xs font-semibold"
                                            >
                                                In-Review
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-stone-400 italic py-4">No complaints in the queue.</p>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: LEAVE & REBATES */}
            {activeTab === "leaves" && (
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">Student Mess Leave & Rebate Requests</h3>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                                Approved leaves auto-credit ₹150/day rebate deduction in the monthly mess billing engine
                            </p>
                        </div>
                        <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-3 py-1 rounded-full font-mono">
                            {pendingLeavesCount} Pending Review
                        </span>
                    </div>

                    <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                        {leaves.length > 0 ? (
                            leaves.map((l) => {
                                const startStr = new Date(l.startDate).toLocaleDateString();
                                const endStr = new Date(l.endDate).toLocaleDateString();
                                const diffDays = Math.ceil(Math.abs(new Date(l.endDate) - new Date(l.startDate)) / (1000 * 60 * 60 * 24)) + 1;

                                return (
                                    <div key={l.id} className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">{l.user.name}</span>
                                                    <span className="text-xs text-stone-500 dark:text-stone-400">Room {l.user.roomNo || "N/A"}</span>
                                                    <span className="text-[10px] bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded">
                                                        {l.user.email}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
                                                    📅 {startStr} ➔ {endStr} ({diffDays} Days Away)
                                                </p>
                                            </div>

                                            <span
                                                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                                    l.status === "APPROVED"
                                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                                        : l.status === "REJECTED"
                                                        ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800"
                                                        : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800"
                                                }`}
                                            >
                                                {l.status}
                                            </span>
                                        </div>

                                        <p className="text-xs text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
                                            <strong>Reason:</strong> {l.reason}
                                        </p>

                                        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                                            <span className="text-stone-500 dark:text-stone-400">
                                                Rebate Deduction: <strong className="text-emerald-700 dark:text-emerald-400">₹{diffDays * 150}</strong>
                                                {l.approvedBy && ` (Reviewed by ${l.approvedBy})`}
                                            </span>

                                            {l.status === "PENDING" ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleReviewLeave(l.id, "APPROVED")}
                                                        className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold text-xs transition flex items-center gap-1 shadow-sm"
                                                    >
                                                        <Check className="w-3.5 h-3.5" /> Approve Rebate
                                                    </button>
                                                    <button
                                                        onClick={() => handleReviewLeave(l.id, "REJECTED")}
                                                        className="px-3.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-700 font-semibold text-xs transition"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-stone-400 italic">
                                                    Decision locked. Accounts billing will compute accordingly.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-xs text-stone-400 italic py-4">No student leave requests pending review.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
