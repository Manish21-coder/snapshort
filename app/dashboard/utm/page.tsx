"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, SignInButton } from "@clerk/nextjs";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CustomParam {
  id: string;
  key: string;
  value: string;
}

interface Preset {
  name: string;
  baseUrl: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  utmId: string;
  coupon: string;
  customParams: CustomParam[];
}

interface HistoryItem {
  _id?: string;
  baseUrl: string;
  utmParams: {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_term?: string;
    utm_content?: string;
    utm_id?: string;
    coupon?: string;
  };
  customParams?: { key: string; value: string }[];
  finalUrl: string;
  shortUrl?: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_PRESETS = ["google", "facebook", "instagram", "twitter", "newsletter", "linkedin"];
const MEDIUM_PRESETS = ["cpc", "email", "social", "organic", "referral", "display"];

const BUILTIN_TEMPLATES: Preset[] = [
  { name: "Google Ads", baseUrl: "", source: "google", medium: "cpc", campaign: "", term: "", content: "", utmId: "", coupon: "", customParams: [] },
  { name: "Facebook Ads", baseUrl: "", source: "facebook", medium: "cpc", campaign: "", term: "", content: "", utmId: "", coupon: "", customParams: [] },
  { name: "Email Newsletter", baseUrl: "", source: "newsletter", medium: "email", campaign: "", term: "", content: "", utmId: "", coupon: "", customParams: [] },
  { name: "Instagram Bio", baseUrl: "", source: "instagram", medium: "social", campaign: "", term: "", content: "", utmId: "", coupon: "", customParams: [] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitize(val: string) {
  return val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "");
}

function buildUrl(
  baseUrl: string,
  source: string,
  medium: string,
  campaign: string,
  term: string,
  content: string,
  utmId: string,
  coupon: string,
  customParams: CustomParam[]
): string {
  if (!baseUrl) return "";
  let base = baseUrl.trim();
  if (!base.startsWith("http://") && !base.startsWith("https://")) return "";

  const params: [string, string][] = [];
  const seenKeys = new Set<string>();

  const add = (k: string, v: string) => {
    if (v && !seenKeys.has(k)) {
      params.push([k, encodeURIComponent(v)]);
      seenKeys.add(k);
    }
  };

  add("utm_source", source);
  add("utm_medium", medium);
  add("utm_campaign", campaign);
  add("utm_term", term);
  add("utm_content", content);
  add("utm_id", utmId);
  add("coupon", coupon);

  for (const cp of customParams) {
    if (cp.key) add(cp.key, cp.value);
  }

  if (params.length === 0) return base;

  const sep = base.includes("?") ? "&" : "?";
  return base + sep + params.map(([k, v]) => `${k}=${v}`).join("&");
}

function uid() {
  return Math.random().toString(36).slice(2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UTMGeneratorPage() {
  const { isSignedIn, isLoaded } = useUser();

  // Form state
  const [baseUrl, setBaseUrl] = useState("");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");
  const [utmId, setUtmId] = useState("");
  const [coupon, setCoupon] = useState("");
  const [customParams, setCustomParams] = useState<CustomParam[]>([]);
  const [urlError, setUrlError] = useState("");

  // Output state
  const [copied, setCopied] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [shortUrl, setShortUrl] = useState("");
  const [shortCopied, setShortCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Presets
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [showPresetSave, setShowPresetSave] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyRange, setHistoryRange] = useState("all");
  const [historySource, setHistorySource] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTab, setHistoryTab] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);

  // Load presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("utm_presets");
      if (stored) setPresets(JSON.parse(stored));
    } catch {}
  }, []);

  // Fetch server history when tab opens or signed in
  const fetchHistory = useCallback(async () => {
    if (!isSignedIn) return;
    setHistoryLoading(true);
    try {
      const p = new URLSearchParams({
        search: historySearch,
        range: historyRange === "all" ? "" : historyRange,
        source: historySource,
      });
      const res = await fetch(`/api/utm?${p}`);
      const data = await res.json();
      setHistory(data.data || []);
    } catch {}
    setHistoryLoading(false);
  }, [isSignedIn, historySearch, historyRange, historySource]);

  useEffect(() => {
    if (historyTab) fetchHistory();
  }, [historyTab, fetchHistory]);

  // Generated URL
  const generatedUrl = useMemo(
    () => buildUrl(baseUrl, source, medium, campaign, term, content, utmId, coupon, customParams),
    [baseUrl, source, medium, campaign, term, content, utmId, coupon, customParams]
  );

  // Validate base URL live
  useEffect(() => {
    if (!baseUrl) { setUrlError(""); return; }
    try {
      const u = new URL(baseUrl);
      if (!["http:", "https:"].includes(u.protocol)) setUrlError("Must start with http:// or https://");
      else setUrlError("");
    } catch {
      setUrlError("Enter a valid URL (e.g. https://example.com)");
    }
  }, [baseUrl]);

  // Reset short URL when form changes
  useEffect(() => { setShortUrl(""); }, [generatedUrl]);

  // ── Custom params ──────────────────────────────────────────────────────────

  const addCustomParam = () =>
    setCustomParams((p) => [...p, { id: uid(), key: "", value: "" }]);

  const updateCustomParam = (id: string, field: "key" | "value", val: string) =>
    setCustomParams((p) =>
      p.map((cp) => (cp.id === id ? { ...cp, [field]: sanitize(val) } : cp))
    );

  const removeCustomParam = (id: string) =>
    setCustomParams((p) => p.filter((cp) => cp.id !== id));

  // ── Copy ──────────────────────────────────────────────────────────────────

  const copy = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // ── Shorten ───────────────────────────────────────────────────────────────

  const shortenLink = async () => {
    if (!generatedUrl) return;
    setShortening(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl: generatedUrl }),
      });
      const data = await res.json();
      if (data.data?.shortCode) {
        const short = `${window.location.origin}/${data.data.shortCode}`;
        setShortUrl(short);
      }
    } catch {}
    setShortening(false);
  };

  // ── Save to server history ─────────────────────────────────────────────────

  const saveToHistory = async () => {
    if (!isSignedIn || !generatedUrl) return;
    setSaving(true);
    try {
      await fetch("/api/utm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl,
          utmParams: { utm_source: source, utm_medium: medium, utm_campaign: campaign, utm_term: term, utm_content: content, utm_id: utmId, coupon },
          customParams: customParams.map(({ key, value }) => ({ key, value })),
          finalUrl: generatedUrl,
          shortUrl,
        }),
      });
      if (historyTab) fetchHistory();
    } catch {}
    setSaving(false);
  };

  // ── Presets ───────────────────────────────────────────────────────────────

  const savePreset = () => {
    if (!presetName.trim()) return;
    const newPreset: Preset = { name: presetName.trim(), baseUrl, source, medium, campaign, term, content, utmId, coupon, customParams };
    const updated = [...presets.filter((p) => p.name !== newPreset.name), newPreset];
    setPresets(updated);
    localStorage.setItem("utm_presets", JSON.stringify(updated));
    setPresetName("");
    setShowPresetSave(false);
  };

  const loadPreset = (preset: Preset) => {
    if (preset.baseUrl) setBaseUrl(preset.baseUrl);
    setSource(preset.source);
    setMedium(preset.medium);
    setCampaign(preset.campaign);
    setTerm(preset.term);
    setContent(preset.content);
    setUtmId(preset.utmId);
    setCoupon(preset.coupon);
    setCustomParams(preset.customParams.map((cp) => ({ ...cp, id: uid() })));
    setShortUrl("");
  };

  const deletePreset = (name: string) => {
    const updated = presets.filter((p) => p.name !== name);
    setPresets(updated);
    localStorage.setItem("utm_presets", JSON.stringify(updated));
  };

  // ── Load history item ──────────────────────────────────────────────────────

  const loadHistoryItem = (item: HistoryItem) => {
    setBaseUrl(item.baseUrl);
    setSource(item.utmParams.utm_source || "");
    setMedium(item.utmParams.utm_medium || "");
    setCampaign(item.utmParams.utm_campaign || "");
    setTerm(item.utmParams.utm_term || "");
    setContent(item.utmParams.utm_content || "");
    setUtmId(item.utmParams.utm_id || "");
    setCoupon(item.utmParams.coupon || "");
    setCustomParams((item.customParams || []).map((cp) => ({ ...cp, id: uid() })));
    setShortUrl(item.shortUrl || "");
    setHistoryTab(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearHistory = async () => {
    if (!isSignedIn) return;
    setClearingHistory(true);
    try {
      await fetch("/api/utm", { method: "DELETE" });
      setHistory([]);
    } catch {}
    setClearingHistory(false);
  };

  // ── Auth guard ─────────────────────────────────────────────────────────────

  if (!isLoaded) return <p className="text-white text-center mt-20">Loading...</p>;

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white text-center px-6">
        <h1 className="text-3xl font-bold mb-4">Please login</h1>
        <p className="text-gray-400 mb-6">You need to login to use the UTM Generator.</p>
        <SignInButton>
          <button className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 rounded-lg font-medium hover:scale-105 transition">
            Login
          </button>
        </SignInButton>
      </div>
    );
  }

  const allPresets = [...BUILTIN_TEMPLATES, ...presets];
  const isValid = !urlError && baseUrl.length > 0 && source && medium && campaign;

  return (
    <main className="min-h-screen text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-black to-blue-700 opacity-80" />
      <div className="absolute w-[600px] h-[600px] bg-purple-500 rounded-full blur-[200px] opacity-30 animate-pulse top-[-100px] left-[-100px]" />
      <div className="absolute w-[500px] h-[500px] bg-blue-500 rounded-full blur-[200px] opacity-30 animate-pulse bottom-[-100px] right-[-100px]" />

      <div className="relative z-10 max-w-4xl mx-auto pt-10 px-4 pb-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">UTM Link Generator</h1>
          <p className="text-gray-400 text-sm">Build, track, and manage your campaign URLs.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setHistoryTab(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!historyTab ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-white/10 hover:bg-white/20"}`}
          >
            Generator
          </button>
          <button
            onClick={() => setHistoryTab(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${historyTab ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-white/10 hover:bg-white/20"}`}
          >
            History
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!historyTab ? (
            <motion.div key="generator" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-6">

              {/* Presets */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Templates & Presets</h2>
                <div className="flex flex-wrap gap-2">
                  {allPresets.map((p) => (
                    <div key={p.name} className="flex items-center gap-1">
                      <button
                        onClick={() => loadPreset(p)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium border border-white/10 transition"
                      >
                        {p.name}
                      </button>
                      {!BUILTIN_TEMPLATES.find((t) => t.name === p.name) && (
                        <button
                          onClick={() => deletePreset(p.name)}
                          className="text-red-400 hover:text-red-300 text-xs px-1"
                          title="Delete preset"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setShowPresetSave((v) => !v)}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-xs font-medium border border-blue-400/30 text-blue-300 transition"
                  >
                    + Save Current
                  </button>
                </div>

                <AnimatePresence>
                  {showPresetSave && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <div className="flex gap-2">
                        <input
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          placeholder="Preset name..."
                          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none"
                          onKeyDown={(e) => e.key === "Enter" && savePreset()}
                        />
                        <button
                          onClick={savePreset}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm transition"
                        >
                          Save
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Form */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">Campaign Parameters</h2>

                <div className="flex flex-col gap-4">
                  {/* Base URL */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Base URL <span className="text-red-400">*</span></label>
                    <input
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://example.com/page"
                      className={`w-full bg-white/10 border ${urlError ? "border-red-400" : "border-white/20"} rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500`}
                    />
                    {urlError && <p className="text-red-400 text-xs mt-1">{urlError}</p>}
                  </div>

                  {/* Source + Medium */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">utm_source <span className="text-red-400">*</span></label>
                      <input
                        value={source}
                        onChange={(e) => setSource(sanitize(e.target.value))}
                        placeholder="e.g. google"
                        list="source-list"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500"
                      />
                      <datalist id="source-list">
                        {SOURCE_PRESETS.map((s) => <option key={s} value={s} />)}
                      </datalist>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {SOURCE_PRESETS.map((s) => (
                          <button key={s} onClick={() => setSource(s)} className="text-xs px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 transition">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">utm_medium <span className="text-red-400">*</span></label>
                      <input
                        value={medium}
                        onChange={(e) => setMedium(sanitize(e.target.value))}
                        placeholder="e.g. cpc"
                        list="medium-list"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500"
                      />
                      <datalist id="medium-list">
                        {MEDIUM_PRESETS.map((m) => <option key={m} value={m} />)}
                      </datalist>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {MEDIUM_PRESETS.map((m) => (
                          <button key={m} onClick={() => setMedium(m)} className="text-xs px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 transition">
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Campaign */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">utm_campaign <span className="text-red-400">*</span></label>
                    <input
                      value={campaign}
                      onChange={(e) => setCampaign(sanitize(e.target.value))}
                      placeholder="e.g. spring_sale"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500"
                    />
                  </div>

                  {/* Optional fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">utm_term <span className="text-gray-600">(optional)</span></label>
                      <input
                        value={term}
                        onChange={(e) => setTerm(sanitize(e.target.value))}
                        placeholder="e.g. running_shoes"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">utm_content <span className="text-gray-600">(optional)</span></label>
                      <input
                        value={content}
                        onChange={(e) => setContent(sanitize(e.target.value))}
                        placeholder="e.g. banner_v2"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">utm_id <span className="text-gray-600">(optional)</span></label>
                      <input
                        value={utmId}
                        onChange={(e) => setUtmId(sanitize(e.target.value))}
                        placeholder="e.g. abc123"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">coupon <span className="text-gray-600">(optional)</span></label>
                      <input
                        value={coupon}
                        onChange={(e) => setCoupon(sanitize(e.target.value))}
                        placeholder="e.g. save20"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Custom params */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-gray-400 uppercase tracking-wide">Custom Parameters</label>
                      <button
                        onClick={addCustomParam}
                        className="text-xs px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-300 rounded-lg transition"
                      >
                        + Add Custom Parameter
                      </button>
                    </div>

                    <AnimatePresence>
                      {customParams.map((cp) => (
                        <motion.div
                          key={cp.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex gap-2 mb-2">
                            <input
                              value={cp.key}
                              onChange={(e) => updateCustomParam(cp.id, "key", e.target.value)}
                              placeholder="key"
                              className="w-1/3 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm outline-none placeholder:text-gray-500"
                            />
                            <input
                              value={cp.value}
                              onChange={(e) => updateCustomParam(cp.id, "value", e.target.value)}
                              placeholder="value"
                              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm outline-none placeholder:text-gray-500"
                            />
                            <button
                              onClick={() => removeCustomParam(cp.id)}
                              className="text-red-400 hover:text-red-300 px-2 text-sm transition"
                            >
                              ✕
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Generated URL</h2>
                  {generatedUrl && (
                    <span className="text-xs text-gray-500">{generatedUrl.length} characters</span>
                  )}
                </div>

                {generatedUrl ? (
                  <>
                    <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-4 break-all text-sm text-blue-300 font-mono leading-relaxed">
                      {generatedUrl}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => copy(generatedUrl, setCopied)}
                        className="min-h-[40px] px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-sm font-medium hover:scale-105 transition"
                      >
                        {copied ? "Copied!" : "Copy Link"}
                      </button>

                      {isValid && (
                        <button
                          onClick={shortenLink}
                          disabled={shortening}
                          className="min-h-[40px] px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm transition disabled:opacity-50"
                        >
                          {shortening ? "Shortening..." : "Shorten this link"}
                        </button>
                      )}

                      {isValid && (
                        <button
                          onClick={saveToHistory}
                          disabled={saving}
                          className="min-h-[40px] px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-300 rounded-lg text-sm transition disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save to History"}
                        </button>
                      )}
                    </div>

                    {shortUrl && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-center gap-3 bg-green-500/10 border border-green-400/20 rounded-xl p-3"
                      >
                        <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-green-300 text-sm font-mono break-all hover:underline">
                          {shortUrl}
                        </a>
                        <button
                          onClick={() => copy(shortUrl, setShortCopied)}
                          className="shrink-0 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-xs text-green-300 transition"
                        >
                          {shortCopied ? "Copied!" : "Copy"}
                        </button>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Fill in the required fields above to generate your URL.</p>
                )}
              </div>

            </motion.div>
          ) : (
            /* ── History Tab ── */
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-4">

              {/* Filters */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Search & Filter</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search by URL or campaign..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500"
                  />
                  <select
                    value={historyRange}
                    onChange={(e) => setHistoryRange(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none"
                  >
                    <option value="all" className="bg-gray-900">All time</option>
                    <option value="today" className="bg-gray-900">Today</option>
                    <option value="7days" className="bg-gray-900">Last 7 days</option>
                    <option value="30days" className="bg-gray-900">Last 30 days</option>
                  </select>
                  <select
                    value={historySource}
                    onChange={(e) => setHistorySource(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none"
                  >
                    <option value="" className="bg-gray-900">All sources</option>
                    {SOURCE_PRESETS.map((s) => (
                      <option key={s} value={s} className="bg-gray-900">{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={fetchHistory}
                    className="min-h-[40px] px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-sm font-medium hover:scale-105 transition"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* History list */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Recent Links <span className="text-gray-500 font-normal">({history.length})</span>
                  </h2>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      disabled={clearingHistory}
                      className="text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 rounded-lg transition disabled:opacity-50"
                    >
                      {clearingHistory ? "Clearing..." : "Clear All"}
                    </button>
                  )}
                </div>

                {historyLoading && <p className="text-gray-400 text-sm">Loading history...</p>}
                {!historyLoading && history.length === 0 && (
                  <p className="text-gray-500 text-sm">No history found. Generate and save some links!</p>
                )}

                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {history.map((item, i) => (
                      <motion.div
                        key={item._id || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-black/20 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 text-xs truncate mb-1">{item.baseUrl}</p>
                          <p className="text-white text-sm font-medium truncate">
                            {item.utmParams.utm_campaign || "(no campaign)"}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {item.utmParams.utm_source && (
                              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">{item.utmParams.utm_source}</span>
                            )}
                            {item.utmParams.utm_medium && (
                              <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">{item.utmParams.utm_medium}</span>
                            )}
                          </div>
                          <p className="text-gray-600 text-xs mt-1.5">
                            {new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => copy(item.finalUrl, () => {})}
                            className="min-h-[36px] px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => loadHistoryItem(item)}
                            className="min-h-[36px] px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 rounded-lg text-xs transition"
                          >
                            Load
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
