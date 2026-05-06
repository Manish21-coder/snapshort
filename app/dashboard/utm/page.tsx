"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, SignInButton } from "@clerk/nextjs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomParam {
  id: string;
  key: string;
  value: string;
}

interface Preset {
  name: string;
  baseUrl: string;
  source: string;
  subsource: string;
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

// ─── Option Lists ─────────────────────────────────────────────────────────────

const SOURCE_OPTIONS = [
  "youtube", "telegramint", "telegramext", "instagram", "appnotif",
  "crm", "seo", "meta", "google", "yt_promote", "ig_boosting",
  "crm_outbound", "crm_inbound",
];

const SUBSOURCE_OPTIONS = [
  "psci", "pcom", "psslc", "pbpsci", "pbpcom", "pbpsslc",
  "pscipu1", "pscipu2", "pcommpu1", "pcommpu2",
  "psslckannadamed", "psslcenglishmed", "pninth", "pcomm",
  "bulk_offer_msg", "live_reminder_msg", "result_followup_msg",
  "failed_payment_followup", "buy_now_clicker_followup",
  "echo_inbound", "niaa_reply", "walkin_intent",
  "direct_whatsapp_message", "sslc",
  "pu1sci", "pu2sci", "pu1com", "pu2com",
];

const MEDIUM_OPTIONS = [
  "live", "video", "shorts", "post", "bio", "story", "reel", "carousel",
  "popup", "push", "inbound", "outbound", "leadgenform", "walkin",
  "conversion", "subscribe", "app install", "leadgenlandingpage",
  "followus", "live link", "skippable_ad", "not skippable_ad",
  "whatsapp_niaa", "whatsapp_manual", "echo", "whatsapp_bulk",
  "blog", "landingpage",
];

const CAMPAIGN_OPTIONS = [
  "sales", "puller", "academic", "loop", "Conversion",
  "Offer", "Retargeting", "Awareness", "Campaign name on the platform",
];

const TERM_OPTIONS = [
  "teacher1", "teacher2", "teacher3", "assetid1",
  "message_name", "flow_name", "keyword", "blog_name",
  "Page_name", "teacher_name", "asset_name",
];

const CONTENT_OPTIONS = [
  "publishdate", "13Apr", "14Apr", "7May",
  "tggrp1", "tggrp2", "Start_date", "date",
];

const BUILTIN_TEMPLATES: Preset[] = [
  { name: "YouTube Live",    baseUrl: "", source: "youtube",      subsource: "", medium: "live",           campaign: "", term: "", content: "", utmId: "", coupon: "", customParams: [] },
  { name: "Instagram Reel",  baseUrl: "", source: "instagram",    subsource: "", medium: "reel",           campaign: "", term: "", content: "", utmId: "", coupon: "", customParams: [] },
  { name: "CRM Outbound",    baseUrl: "", source: "crm_outbound", subsource: "", medium: "whatsapp_manual", campaign: "", term: "", content: "", utmId: "", coupon: "", customParams: [] },
  { name: "Google SEO",      baseUrl: "", source: "google",       subsource: "", medium: "blog",           campaign: "", term: "", content: "", utmId: "", coupon: "", customParams: [] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitize(val: string) {
  return val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "");
}

function buildUrl(
  baseUrl: string,
  source: string,
  subsource: string,
  medium: string,
  campaign: string,
  term: string,
  content: string,
  utmId: string,
  coupon: string,
  customParams: CustomParam[]
): string {
  if (!baseUrl) return "";
  const base = baseUrl.trim();
  if (!base.startsWith("http://") && !base.startsWith("https://")) return "";

  const params: [string, string][] = [];
  const seen = new Set<string>();

  const add = (k: string, v: string) => {
    if (v && !seen.has(k)) {
      params.push([k, encodeURIComponent(v)]);
      seen.add(k);
    }
  };

  add("utm_source", source);
  add("subsource", subsource);
  add("utm_medium", medium);
  add("utm_campaign", campaign);
  add("utm_term", term);
  add("utm_content", content);
  add("utm_id", utmId);
  add("coupon", coupon);
  for (const cp of customParams) { if (cp.key) add(cp.key, cp.value); }

  if (params.length === 0) return base;
  const sep = base.includes("?") ? "&" : "?";
  return base + sep + params.map(([k, v]) => `${k}=${v}`).join("&");
}

function uid() {
  return Math.random().toString(36).slice(2);
}

// ─── SearchableSelect ─────────────────────────────────────────────────────────
// Combobox: type to filter, click to select, or keep typing for a custom value.
// "Other (type custom)" closes the dropdown so the user can finish typing freely.

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = value
    ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))
    : options;

  const isExactMatch = options.includes(value);

  return (
    <div ref={ref} className="relative">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 pr-8 text-white text-sm outline-none placeholder:text-gray-500 focus:border-white/40 transition"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none select-none">
        ▾
      </span>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.1 }}
            className="absolute z-30 top-full mt-1 w-full bg-gray-950 border border-white/20 rounded-xl overflow-hidden shadow-2xl"
          >
            <div className="max-h-52 overflow-y-auto overscroll-contain">
              {filtered.length === 0 && (
                <p className="px-4 py-2.5 text-xs text-gray-500 italic">
                  No matches — your typed value will be used
                </p>
              )}
              {filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-white/10 ${
                    isExactMatch && value === opt
                      ? "bg-blue-500/20 text-blue-300 font-medium"
                      : "text-gray-200"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {/* Always visible at bottom */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-xs text-purple-400 hover:bg-white/10 border-t border-white/10 transition italic"
            >
              ✎ Other (type custom)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block">
        {label}{" "}
        {required && <span className="text-red-400">*</span>}
        {optional && <span className="text-gray-600">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UTMGeneratorPage() {
  const { isSignedIn, isLoaded } = useUser();

  // Form state
  const [baseUrl, setBaseUrl]     = useState("");
  const [source, setSource]       = useState("");
  const [subsource, setSubsource] = useState("");
  const [medium, setMedium]       = useState("");
  const [campaign, setCampaign]   = useState("");
  const [term, setTerm]           = useState("");
  const [content, setContent]     = useState("");
  const [utmId, setUtmId]         = useState("");
  const [coupon, setCoupon]       = useState("");
  const [customParams, setCustomParams] = useState<CustomParam[]>([]);
  const [urlError, setUrlError]   = useState("");

  // Output state
  const [copied, setCopied]           = useState(false);
  const [shortening, setShortening]   = useState(false);
  const [shortUrl, setShortUrl]       = useState("");
  const [shortCopied, setShortCopied] = useState(false);
  const [saving, setSaving]           = useState(false);

  // Presets
  const [presets, setPresets]             = useState<Preset[]>([]);
  const [presetName, setPresetName]       = useState("");
  const [showPresetSave, setShowPresetSave] = useState(false);

  // History
  const [history, setHistory]             = useState<HistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyRange, setHistoryRange]   = useState("all");
  const [historySource, setHistorySource] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTab, setHistoryTab]       = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);

  // Load presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("utm_presets");
      if (stored) setPresets(JSON.parse(stored));
    } catch {}
  }, []);

  // Fetch server history
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

  // Generated URL (live)
  const generatedUrl = useMemo(
    () => buildUrl(baseUrl, source, subsource, medium, campaign, term, content, utmId, coupon, customParams),
    [baseUrl, source, subsource, medium, campaign, term, content, utmId, coupon, customParams]
  );

  // Base URL validation
  useEffect(() => {
    if (!baseUrl) { setUrlError(""); return; }
    try {
      const u = new URL(baseUrl);
      setUrlError(["http:", "https:"].includes(u.protocol) ? "" : "Must start with http:// or https://");
    } catch {
      setUrlError("Enter a valid URL (e.g. https://example.com)");
    }
  }, [baseUrl]);

  // Reset short URL when generated URL changes
  useEffect(() => { setShortUrl(""); }, [generatedUrl]);

  // ── Custom params ────────────────────────────────────────────────────────────

  const addCustomParam = () =>
    setCustomParams((p) => [...p, { id: uid(), key: "", value: "" }]);

  const updateCustomParam = (id: string, field: "key" | "value", val: string) =>
    setCustomParams((p) =>
      p.map((cp) => (cp.id === id ? { ...cp, [field]: sanitize(val) } : cp))
    );

  const removeCustomParam = (id: string) =>
    setCustomParams((p) => p.filter((cp) => cp.id !== id));

  // ── Copy ─────────────────────────────────────────────────────────────────────

  const copy = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // ── Shorten ──────────────────────────────────────────────────────────────────

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
        setShortUrl(`${window.location.origin}/${data.data.shortCode}`);
      }
    } catch {}
    setShortening(false);
  };

  // ── Save to server history ────────────────────────────────────────────────────
  // subsource is stored as a custom param so the DB model stays unchanged.

  const saveToHistory = async () => {
    if (!isSignedIn || !generatedUrl) return;
    setSaving(true);
    try {
      const allCustom = [
        ...(subsource ? [{ key: "subsource", value: subsource }] : []),
        ...customParams.map(({ key, value }) => ({ key, value })),
      ];
      await fetch("/api/utm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl,
          utmParams: { utm_source: source, utm_medium: medium, utm_campaign: campaign, utm_term: term, utm_content: content, utm_id: utmId, coupon },
          customParams: allCustom,
          finalUrl: generatedUrl,
          shortUrl,
        }),
      });
      if (historyTab) fetchHistory();
    } catch {}
    setSaving(false);
  };

  // ── Presets ───────────────────────────────────────────────────────────────────

  const savePreset = () => {
    if (!presetName.trim()) return;
    const newPreset: Preset = {
      name: presetName.trim(),
      baseUrl, source, subsource, medium, campaign, term, content, utmId, coupon, customParams,
    };
    const updated = [...presets.filter((p) => p.name !== newPreset.name), newPreset];
    setPresets(updated);
    localStorage.setItem("utm_presets", JSON.stringify(updated));
    setPresetName("");
    setShowPresetSave(false);
  };

  const loadPreset = (preset: Preset) => {
    if (preset.baseUrl) setBaseUrl(preset.baseUrl);
    setSource(preset.source);
    setSubsource(preset.subsource ?? "");
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

  // ── Load history item ─────────────────────────────────────────────────────────
  // Pull subsource back out of customParams when reloading a saved item.

  const loadHistoryItem = (item: HistoryItem) => {
    setBaseUrl(item.baseUrl);
    setSource(item.utmParams.utm_source || "");
    setMedium(item.utmParams.utm_medium || "");
    setCampaign(item.utmParams.utm_campaign || "");
    setTerm(item.utmParams.utm_term || "");
    setContent(item.utmParams.utm_content || "");
    setUtmId(item.utmParams.utm_id || "");
    setCoupon(item.utmParams.coupon || "");

    const all = item.customParams || [];
    const sub = all.find((cp) => cp.key === "subsource");
    setSubsource(sub?.value || "");
    setCustomParams(
      all
        .filter((cp) => cp.key !== "subsource")
        .map((cp) => ({ ...cp, id: uid() }))
    );
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

  // ── Auth guard ────────────────────────────────────────────────────────────────

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

          {/* ── Generator Tab ── */}
          {!historyTab ? (
            <motion.div
              key="generator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >

              {/* Templates & Presets */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5">
                <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Templates & Presets</h2>
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
                          onKeyDown={(e) => e.key === "Enter" && savePreset()}
                          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none"
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
                <h2 className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wide">Campaign Parameters</h2>

                <div className="flex flex-col gap-5">

                  {/* Base URL */}
                  <Field label="Base URL" required>
                    <input
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://example.com/page"
                      className={`w-full bg-white/10 border ${urlError ? "border-red-400" : "border-white/20"} rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500 focus:border-white/40 transition`}
                    />
                    {urlError && <p className="text-red-400 text-xs mt-1">{urlError}</p>}
                  </Field>

                  {/* Source */}
                  <Field label="utm_source" required>
                    <SearchableSelect
                      value={source}
                      onChange={setSource}
                      options={SOURCE_OPTIONS}
                      placeholder="e.g. youtube, google, instagram…"
                    />
                  </Field>

                  {/* Sub Source (new field) */}
                  <Field label="Sub Source" optional>
                    <SearchableSelect
                      value={subsource}
                      onChange={setSubsource}
                      options={SUBSOURCE_OPTIONS}
                      placeholder="e.g. psci, pcom, sslc…"
                    />
                  </Field>

                  {/* Medium */}
                  <Field label="utm_medium" required>
                    <SearchableSelect
                      value={medium}
                      onChange={setMedium}
                      options={MEDIUM_OPTIONS}
                      placeholder="e.g. live, reel, whatsapp_manual…"
                    />
                  </Field>

                  {/* Campaign */}
                  <Field label="utm_campaign" required>
                    <SearchableSelect
                      value={campaign}
                      onChange={setCampaign}
                      options={CAMPAIGN_OPTIONS}
                      placeholder="e.g. sales, puller, Conversion…"
                    />
                  </Field>

                  {/* Term + Content */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Term / Teacher Name / Asset" optional>
                      <SearchableSelect
                        value={term}
                        onChange={setTerm}
                        options={TERM_OPTIONS}
                        placeholder="e.g. teacher_name, keyword…"
                      />
                    </Field>

                    <Field label="Content / Date / Group" optional>
                      <SearchableSelect
                        value={content}
                        onChange={setContent}
                        options={CONTENT_OPTIONS}
                        placeholder="e.g. 13Apr, tggrp1…"
                      />
                    </Field>
                  </div>

                  {/* utm_id + coupon */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="utm_id" optional>
                      <input
                        value={utmId}
                        onChange={(e) => setUtmId(sanitize(e.target.value))}
                        placeholder="e.g. abc123"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500 focus:border-white/40 transition"
                      />
                    </Field>
                    <Field label="coupon" optional>
                      <input
                        value={coupon}
                        onChange={(e) => setCoupon(sanitize(e.target.value))}
                        placeholder="e.g. save20"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500 focus:border-white/40 transition"
                      />
                    </Field>
                  </div>

                  {/* Custom params */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">Custom Parameters</span>
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
                              className="text-red-400 hover:text-red-300 px-2 text-sm transition shrink-0"
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

              {/* Generated URL Output */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Generated URL</h2>
                  {generatedUrl && (
                    <span className="text-xs text-gray-500">{generatedUrl.length} characters</span>
                  )}
                </div>

                {generatedUrl ? (
                  <>
                    <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-4 break-all text-sm text-blue-300 font-mono leading-relaxed select-all">
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
                          {shortening ? "Shortening…" : "Shorten this link"}
                        </button>
                      )}

                      {isValid && (
                        <button
                          onClick={saveToHistory}
                          disabled={saving}
                          className="min-h-[40px] px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-300 rounded-lg text-sm transition disabled:opacity-50"
                        >
                          {saving ? "Saving…" : "Save to History"}
                        </button>
                      )}
                    </div>

                    {shortUrl && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-center gap-3 bg-green-500/10 border border-green-400/20 rounded-xl p-3"
                      >
                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-green-300 text-sm font-mono break-all hover:underline"
                        >
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
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >

              {/* Filters */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-5">
                <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Search & Filter</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search by URL or campaign…"
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500"
                  />
                  <select
                    value={historyRange}
                    onChange={(e) => setHistoryRange(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none"
                  >
                    <option value="all"    className="bg-gray-900">All time</option>
                    <option value="today"  className="bg-gray-900">Today</option>
                    <option value="7days"  className="bg-gray-900">Last 7 days</option>
                    <option value="30days" className="bg-gray-900">Last 30 days</option>
                  </select>
                  <select
                    value={historySource}
                    onChange={(e) => setHistorySource(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none"
                  >
                    <option value="" className="bg-gray-900">All sources</option>
                    {SOURCE_OPTIONS.map((s) => (
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
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Recent Links <span className="text-gray-500 font-normal normal-case">({history.length})</span>
                  </h2>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      disabled={clearingHistory}
                      className="text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 rounded-lg transition disabled:opacity-50"
                    >
                      {clearingHistory ? "Clearing…" : "Clear All"}
                    </button>
                  )}
                </div>

                {historyLoading && <p className="text-gray-400 text-sm">Loading history…</p>}
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
                          <p className="text-gray-400 text-xs truncate mb-1">{item.baseUrl}</p>
                          <p className="text-white text-sm font-medium truncate">
                            {item.utmParams.utm_campaign || "(no campaign)"}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {item.utmParams.utm_source && (
                              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
                                {item.utmParams.utm_source}
                              </span>
                            )}
                            {item.utmParams.utm_medium && (
                              <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
                                {item.utmParams.utm_medium}
                              </span>
                            )}
                            {item.customParams?.find((cp) => cp.key === "subsource") && (
                              <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full">
                                {item.customParams.find((cp) => cp.key === "subsource")!.value}
                              </span>
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
