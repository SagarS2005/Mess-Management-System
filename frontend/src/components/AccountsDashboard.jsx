import React, { useState, useEffect } from "react";
import api from "../api/client";
import { useNotification } from "../context/NotificationContext";
import { DollarSign, Download, Calculator } from "lucide-react";

export default function AccountsDashboard() {
    const { notify } = useNotification();
    const [month, setMonth] = useState(() => new Date().getMonth() + 1);
    const [year, setYear] = useState(() => new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [calcResult, setCalcResult] = useState(null);
    const [ledgerBills, setLedgerBills] = useState([]);

    const fetchBills = async () => {
        try {
            const res = await api.get("/billing/all");
            if (res.data?.success) setLedgerBills(res.data.data || []);
        } catch (err) {
            console.error("Accounts fetch bills error:", err);
        }
    };

    useEffect(() => {
        fetchBills();
    }, []);

    const handleDownloadInvoice = async (billId) => {
        try {
            const res = await api.get(`/billing/invoice/${billId}`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Invoice_${billId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            notify({
                type: "error",
                title: "Download Failed",
                message: err.response?.data?.message || "Could not download invoice PDF."
            });
        }
    };

    const handleGenerateBills = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post("/billing/generate-monthly", { month, year });
            const data = res.data?.data;
            setCalcResult(data);
            fetchBills();

            notify({
                type: "success",
                title: "Monthly Billing Run Complete! 💰",
                message: `Successfully computed and generated mess bills for period ${month}/${year} across ${data?.totalGenerated || 0} student accounts.`,
                details: {
                    Period: `${month}/${year}`,
                    "Accounts Computed": `${data?.totalGenerated || 0} Students`,
                    Formula: "Meals Attended × Rate - Approved Leave Rebates"
                }
            });
        } catch (err) {
            notify({
                type: "error",
                title: "Billing Run Failed",
                message: err.response?.data?.message || "Failed to execute monthly billing calculations."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-sm">
                <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-700 dark:text-amber-400" /> Accounts & Mess Billing Office
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                    Automated month-end calculations based on actual verified QR meal attendance & warden-approved leave rebates
                </p>
            </div>

            {/* Run Calculation Trigger */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm max-w-2xl">
                <div>
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">Generate Monthly Billing Run</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                        Institutional Rule: (Total Meals Attended × ₹60) - (Approved Leave Days × ₹150)
                    </p>
                </div>

                <form onSubmit={handleGenerateBills} className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-stone-600 dark:text-stone-300 font-medium">Month:</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                                <option key={m} value={m}>
                                    Month {m}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-xs text-stone-600 dark:text-stone-300 font-medium">Year:</label>
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="w-24 bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white dark:bg-amber-600 dark:hover:bg-amber-500 font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                        <Calculator className="w-4 h-4" />
                        {loading ? "Computing Bills..." : "Execute Billing Calculation"}
                    </button>
                </form>

                {calcResult && (
                    <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                            ✓ Processed {calcResult.totalGenerated} student accounts for {month}/{year}
                        </p>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {calcResult.bills?.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-3 rounded-xl flex items-center justify-between text-xs"
                                >
                                    <div>
                                        <span className="font-bold text-stone-900 dark:text-stone-100">{item.student}</span>
                                        <div className="text-[11px] text-stone-500 dark:text-stone-400">
                                            {item.bill.mealsCount} meals attended | Rebate: Rs. {item.bill.rebate}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">
                                            Rs. {item.bill.totalDue}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleDownloadInvoice(item.bill.id)}
                                            className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                                            title="Download PDF"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* All Student Bills Ledger */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">Student Billing Ledger</h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400">All generated student invoices and payment status</p>
                    </div>
                    <span className="text-xs bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full text-stone-700 dark:text-stone-300 font-mono">
                        {ledgerBills.length} Records
                    </span>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {ledgerBills.length > 0 ? (
                        ledgerBills.map((b) => (
                            <div
                                key={b.id}
                                className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs"
                            >
                                <div>
                                    <span className="font-bold text-stone-900 dark:text-stone-100">{b.user?.name || `Student #${b.userId}`}</span>
                                    <span className="text-stone-400 ml-2">({b.month}/{b.year})</span>
                                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                                        Meals: {b.mealsCount} | Gross: Rs. {b.amount} | Rebate: Rs. {b.rebate}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                            b.status === "PAID"
                                                ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                                : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                        }`}
                                    >
                                        {b.status}
                                    </span>
                                    <span className="font-bold text-amber-700 dark:text-amber-400 text-sm">
                                        Rs. {b.totalDue}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleDownloadInvoice(b.id)}
                                        className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300"
                                        title="Download PDF"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-stone-400 italic">No bills generated yet. Run monthly billing calculation above.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
