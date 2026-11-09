"use client";

import { useState } from "react";
import { MessageSquare, Users, TrendingUp, PieChart as PieIcon } from "lucide-react";

interface TimelinePoint {
    date: string;
    label: string;
    messages: number;
    users: number;
}

interface AdminChartsProps {
    timeline: TimelinePoint[];
    directCount: number;
    groupCount: number;
    totalMessages: number;
    deletedMessages: number;
    pendingRequests: number;
    acceptedRequests: number;
}

export default function AdminCharts({
    timeline,
    directCount,
    groupCount,
    totalMessages,
    deletedMessages,
    pendingRequests,
    acceptedRequests
}: AdminChartsProps) {
    const [activeSeries, setActiveSeries] = useState<"both" | "messages" | "users">("both");
    const [hoveredPoint, setHoveredPoint] = useState<TimelinePoint | null>(null);

    // Calculate maximum values for SVG scaling
    const maxMessages = Math.max(1, ...timeline.map((t) => t.messages));
    const maxUsers = Math.max(1, ...timeline.map((t) => t.users));
    const maxGlobal = Math.max(maxMessages, maxUsers, 10);

    const svgWidth = 700;
    const svgHeight = 220;
    const padding = { top: 20, right: 25, bottom: 35, left: 35 };
    const innerWidth = svgWidth - padding.left - padding.right;
    const innerHeight = svgHeight - padding.top - padding.bottom;

    const points = timeline.map((item, index) => {
        const x = padding.left + (index / Math.max(1, timeline.length - 1)) * innerWidth;
        const yMsg = padding.top + innerHeight - (item.messages / maxGlobal) * innerHeight;
        const yUser = padding.top + innerHeight - (item.users / maxGlobal) * innerHeight;
        return { ...item, x, yMsg, yUser };
    });

    const createPath = (key: "yMsg" | "yUser") => {
        if (points.length === 0) return "";
        let path = `M ${points[0].x} ${points[0][key]}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cx1 = prev.x + (curr.x - prev.x) / 2;
            const cy1 = prev[key];
            const cx2 = prev.x + (curr.x - prev.x) / 2;
            const cy2 = curr[key];
            path += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr[key]}`;
        }
        return path;
    };

    const msgPath = createPath("yMsg");
    const userPath = createPath("yUser");

    const msgArea = points.length > 0
        ? `${msgPath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`
        : "";

    // Donut chart calculations
    const totalConv = Math.max(1, directCount + groupCount);
    const directPct = Math.round((directCount / totalConv) * 100);
    const groupPct = 100 - directPct;
    const circumference = 2 * Math.PI * 40; // radius = 40
    const directOffset = circumference * (1 - directPct / 100);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Activity Chart (2 Cols) */}
            <div className="lg:col-span-2 bg-gray-900/80 border border-gray-800 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col justify-between">
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="text-blue-500" size={18} />
                                <h3 className="font-bold text-lg text-white">System Activity Timeline</h3>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Real-time messages & registrations over the last 14 days
                            </p>
                        </div>

                        {/* Series Filter Buttons */}
                        <div className="flex items-center gap-1.5 p-1 bg-gray-950 rounded-xl border border-gray-800/80 self-start sm:self-auto">
                            <button
                                onClick={() => setActiveSeries("both")}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                                    activeSeries === "both"
                                        ? "bg-blue-600 text-white shadow-xs"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setActiveSeries("messages")}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                                    activeSeries === "messages"
                                        ? "bg-blue-500 text-white shadow-xs"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                Messages
                            </button>
                            <button
                                onClick={() => setActiveSeries("users")}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                                    activeSeries === "users"
                                        ? "bg-purple-600 text-white shadow-xs"
                                        : "text-gray-400 hover:text-white"
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                Users
                            </button>
                        </div>
                    </div>

                    {/* SVG Chart Container */}
                    <div className="relative w-full overflow-hidden">
                        <svg
                            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                            className="w-full h-auto overflow-visible select-none"
                        >
                            <defs>
                                <linearGradient id="msgGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>

                            {/* Background Grid Lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                                const y = padding.top + innerHeight * ratio;
                                return (
                                    <line
                                        key={ratio}
                                        x1={padding.left}
                                        y1={y}
                                        x2={padding.left + innerWidth}
                                        y2={y}
                                        stroke="#1f2937"
                                        strokeDasharray="4 4"
                                        strokeWidth="1"
                                    />
                                );
                            })}

                            {/* Messages Area Fill */}
                            {(activeSeries === "both" || activeSeries === "messages") && (
                                <path d={msgArea} fill="url(#msgGradient)" />
                            )}

                            {/* Messages Line */}
                            {(activeSeries === "both" || activeSeries === "messages") && (
                                <path
                                    d={msgPath}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />
                            )}

                            {/* Users Line */}
                            {(activeSeries === "both" || activeSeries === "users") && (
                                <path
                                    d={userPath}
                                    fill="none"
                                    stroke="#a855f7"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeDasharray="2 2"
                                />
                            )}

                            {/* Interactive Data Points */}
                            {points.map((pt, i) => (
                                <g key={i}>
                                    {(activeSeries === "both" || activeSeries === "messages") && (
                                        <circle
                                            cx={pt.x}
                                            cy={pt.yMsg}
                                            r={hoveredPoint?.date === pt.date ? "6" : "3.5"}
                                            fill="#3b82f6"
                                            stroke="#0f172a"
                                            strokeWidth="2"
                                            className="transition-all cursor-pointer"
                                            onMouseEnter={() => setHoveredPoint(pt)}
                                            onMouseLeave={() => setHoveredPoint(null)}
                                        />
                                    )}
                                    {(activeSeries === "both" || activeSeries === "users") && (
                                        <circle
                                            cx={pt.x}
                                            cy={pt.yUser}
                                            r={hoveredPoint?.date === pt.date ? "6" : "3"}
                                            fill="#a855f7"
                                            stroke="#0f172a"
                                            strokeWidth="2"
                                            className="transition-all cursor-pointer"
                                            onMouseEnter={() => setHoveredPoint(pt)}
                                            onMouseLeave={() => setHoveredPoint(null)}
                                        />
                                    )}
                                    {/* X-axis Labels (every 2nd item for clean readability) */}
                                    {i % 2 === 0 && (
                                        <text
                                            x={pt.x}
                                            y={svgHeight - 10}
                                            fontSize="10"
                                            fill="#6b7280"
                                            textAnchor="middle"
                                        >
                                            {pt.label}
                                        </text>
                                    )}
                                </g>
                            ))}
                        </svg>

                        {/* Interactive Tooltip Card */}
                        {hoveredPoint && (
                            <div className="absolute top-2 right-4 bg-gray-950/95 border border-gray-700 rounded-xl p-2.5 shadow-2xl text-xs space-y-1 backdrop-blur-md pointer-events-none">
                                <p className="font-bold text-gray-200 border-b border-gray-800 pb-1">
                                    {hoveredPoint.label} ({hoveredPoint.date})
                                </p>
                                <div className="flex items-center justify-between gap-4 text-blue-400">
                                    <span>Messages:</span>
                                    <span className="font-bold">{hoveredPoint.messages}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-purple-400">
                                    <span>New Users:</span>
                                    <span className="font-bold">{hoveredPoint.users}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Legend */}
                <div className="flex items-center gap-6 pt-4 border-t border-gray-800/80 text-xs text-gray-400 mt-2">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500 shadow-xs shadow-blue-500/50" />
                        <span>Messages Volume</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-500 shadow-xs shadow-purple-500/50" />
                        <span>User Signups</span>
                    </div>
                </div>
            </div>

            {/* Distribution & Engagement Donut / Metrics Card (1 Col) */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <PieIcon className="text-purple-500" size={18} />
                        <h3 className="font-bold text-lg text-white">Conversation Types</h3>
                    </div>

                    {/* Donut Chart */}
                    <div className="relative flex items-center justify-center my-4">
                        <svg width="150" height="150" viewBox="0 0 100 100" className="-rotate-90">
                            {/* Background ring */}
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#1e293b"
                                strokeWidth="12"
                            />
                            {/* Direct Chats segment */}
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="12"
                                strokeDasharray={circumference}
                                strokeDashoffset={directOffset}
                                strokeLinecap="round"
                                className="transition-all duration-700 ease-out"
                            />
                        </svg>
                        <div className="absolute text-center">
                            <span className="text-2xl font-black text-white">{directCount + groupCount}</span>
                            <span className="block text-[10px] uppercase font-bold text-gray-400">Total</span>
                        </div>
                    </div>

                    {/* Breakdown Details */}
                    <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950 border border-gray-800/80">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="text-xs text-gray-300 font-medium">Direct 1-on-1</span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-white">{directCount}</span>
                                <span className="text-[10px] text-gray-400 ml-1.5">({directPct}%)</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950 border border-gray-800/80">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                                <span className="text-xs text-gray-300 font-medium">Group Chats</span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-white">{groupCount}</span>
                                <span className="text-[10px] text-gray-400 ml-1.5">({groupPct}%)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Moderation / Integrity Metrics */}
                <div className="pt-4 border-t border-gray-800/80 mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-400">
                        <span>Active vs Deleted Msgs:</span>
                        <span className="font-semibold text-gray-200">
                            {totalMessages - deletedMessages} / {deletedMessages} deleted
                        </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{
                                width: `${totalMessages > 0 ? ((totalMessages - deletedMessages) / totalMessages) * 100 : 100}%`
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
