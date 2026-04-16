"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ClickEntry {
  timestamp: string;
  userAgent: string;
  ip: string;
}

interface LinkData {
  _id: string;
  originalUrl: string;
  urls: string[];
  shortCode: string;
  folder: string;
  clicks: number;
  clickHistory: ClickEntry[];
}

interface AnalyticsPageProps {
  params: { shortCode: string } | Promise<{ shortCode: string }>;
}

export default function AnalyticsPage({ params }: AnalyticsPageProps) {
  const [shortCode, setShortCode] = useState("");
  const [data, setData] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getParams() {
      const resolved = await params;
      setShortCode(resolved.shortCode);
    }
    getParams();
  }, [params]);

  useEffect(() => {
    if (!shortCode) return;
    fetch(`/api/links/${shortCode}`)
      .then((r) => r.json())
      .then((json) => {
        setData(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shortCode]);

  // Aggregate click history by day for the chart
  const chartData = useMemo(() => {
    if (!data?.clickHistory?.length) return [];
    const byDay: Record<string, number> = {};
    for (const entry of data.clickHistory) {
      const day = entry.timestamp.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    }
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, clicks]) => ({ date, clicks }));
  }, [data]);

  // Top IPs as a proxy for referrers
  const topIPs = useMemo(() => {
    if (!data?.clickHistory?.length) return [];
    const counts: Record<string, number> = {};
    for (const entry of data.clickHistory) {
      const key = entry.ip || "Unknown";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));
  }, [data]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  if (loading) return <p className="text-white text-center mt-20">Loading...</p>;

  if (!data) {
    return <p className="text-white text-center mt-20">Link not found.</p>;
  }

  const recentHistory = [...(data.clickHistory || [])].reverse().slice(0, 50);

  return (
    <main className="min-h-screen text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-black to-blue-700 opacity-80"></div>
      <div className="absolute w-[600px] h-[600px] bg-purple-500 rounded-full blur-[200px] opacity-20 animate-pulse top-[-100px] left-[-100px]"></div>
      <div className="absolute w-[500px] h-[500px] bg-blue-500 rounded-full blur-[200px] opacity-20 animate-pulse bottom-[-100px] right-[-100px]"></div>

      <div className="relative z-10 max-w-5xl mx-auto pt-10 px-4 pb-20">
        <a href="/dashboard" className="text-gray-400 text-sm hover:text-white mb-6 inline-flex items-center min-h-[44px]">
          ← Back to Dashboard
        </a>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Analytics</h1>

        {/* Link Info */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-5 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Short link</p>
          <a
            href={`${baseUrl}/${data.shortCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 font-medium text-lg"
          >
            {baseUrl}/{data.shortCode}
          </a>

          <p className="text-xs text-gray-500 uppercase tracking-wide mt-3 mb-1">Destination</p>
          <p className="text-gray-300 text-sm break-all">{data.originalUrl}</p>

          {data.urls?.length > 0 && (
            <>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-3 mb-1">
                Group URLs (round-robin)
              </p>
              <ul className="flex flex-col gap-1">
                {data.urls.map((u, i) => (
                  <li key={i} className="text-gray-300 text-sm break-all">
                    {i + 1}. {u}
                  </li>
                ))}
              </ul>
            </>
          )}

          {data.folder && (
            <p className="text-xs text-gray-500 mt-3">
              📁 {data.folder}
            </p>
          )}
        </div>

        {/* Total Clicks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-5 text-center">
            <p className="text-4xl font-bold text-blue-400">{data.clicks}</p>
            <p className="text-gray-400 text-sm mt-1">Total Clicks</p>
          </div>
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-5 text-center">
            <p className="text-4xl font-bold text-purple-400">{chartData.length}</p>
            <p className="text-gray-400 text-sm mt-1">Active Days</p>
          </div>
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-5 text-center">
            <p className="text-4xl font-bold text-green-400">
              {chartData.length > 0
                ? Math.max(...chartData.map((d) => d.clicks))
                : 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Best Day</p>
          </div>
        </div>

        {/* Clicks Over Time Chart */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Clicks Over Time</h2>

          {chartData.length === 0 ? (
            <p className="text-gray-400 text-sm">No click data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#818cf8"
                  strokeWidth={2}
                  dot={{ fill: "#818cf8", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Top IPs */}
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Top Visitors (by IP)</h2>
            {topIPs.length === 0 ? (
              <p className="text-gray-400 text-sm">No data yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {topIPs.map(({ ip, count }) => (
                  <div
                    key={ip}
                    className="flex justify-between text-sm bg-white/5 px-3 py-2 rounded-lg"
                  >
                    <span className="text-gray-300 font-mono">{ip}</span>
                    <span className="text-blue-400 font-medium">{count} clicks</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Placeholder for future referrer tracking */}
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Top Referrers</h2>
            <p className="text-gray-500 text-sm">
              Referrer tracking will be available in a future update. Currently the{" "}
              <span className="text-gray-400">Referer</span> header is not captured at redirect time.
            </p>
          </div>
        </div>

        {/* Recent Click History Table */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            Recent Clicks{" "}
            <span className="text-sm text-gray-500 font-normal">
              (last {recentHistory.length})
            </span>
          </h2>

          {recentHistory.length === 0 ? (
            <p className="text-gray-400 text-sm">No click history yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="pb-3 pr-4 font-medium">Timestamp</th>
                    <th className="pb-3 pr-4 font-medium">IP</th>
                    <th className="pb-3 font-medium">User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHistory.map((entry, i) => (
                    <tr
                      key={i}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="py-2.5 pr-4 text-gray-300 whitespace-nowrap font-mono text-xs">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-400 font-mono text-xs whitespace-nowrap">
                        {entry.ip || "—"}
                      </td>
                      <td
                        className="py-2.5 text-gray-500 text-xs max-w-xs truncate"
                        title={entry.userAgent}
                      >
                        {entry.userAgent || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
