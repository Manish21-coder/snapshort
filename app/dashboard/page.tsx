"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useUser, SignInButton } from "@clerk/nextjs";
import { QRCodeCanvas } from "qrcode.react";

interface LinkDoc {
  _id: string;
  originalUrl: string;
  urls: string[];
  shortCode: string;
  folder: string;
  clicks: number;
  createdAt: string;
}

export default function Dashboard() {
  const { isSignedIn, isLoaded } = useUser();

  const [links, setLinks] = useState<LinkDoc[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // UTM shorten panel — activated when ?url= query param is present
  const [utmPanelUrl, setUtmPanelUrl]         = useState("");
  const [utmAlias, setUtmAlias]               = useState("");
  const [utmPrefix, setUtmPrefix]             = useState("");
  const [utmFolder, setUtmFolder]             = useState("");
  const [utmNewFolder, setUtmNewFolder]       = useState("");
  const [showUtmNewFolder, setShowUtmNewFolder] = useState(false);
  const [utmResult, setUtmResult]             = useState("");
  const [utmLoading, setUtmLoading]           = useState(false);
  const [utmError, setUtmError]               = useState("");
  const [utmCopied, setUtmCopied]             = useState(false);

  // Pagination state for the links list
  const [linksPage, setLinksPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Edit modal state
  const [editingLink, setEditingLink] = useState<LinkDoc | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editFolder, setEditFolder] = useState("");
  const [editUrls, setEditUrls] = useState<string[]>([]);
  const [newGroupUrl, setNewGroupUrl] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchLinks = async () => {
    setLoading(true);
    setLinksPage(1);
    const query = new URLSearchParams({ search, startDate, endDate, page: "1" });
    const res = await fetch(`/api/links?${query}`);
    const data = await res.json();
    setLinks(data.data || []);
    setHasMore(data.pagination?.hasMore ?? false);
    setLoading(false);
  };

  const loadMoreLinks = async () => {
    setLoadingMore(true);
    const nextPage = linksPage + 1;
    const query = new URLSearchParams({ search, startDate, endDate, page: String(nextPage) });
    const res = await fetch(`/api/links?${query}`);
    const data = await res.json();
    setLinks((prev) => [...prev, ...(data.data || [])]);
    setHasMore(data.pagination?.hasMore ?? false);
    setLinksPage(nextPage);
    setLoadingMore(false);
  };

  const fetchFolders = async () => {
    const res = await fetch("/api/folders");
    const data = await res.json();
    setFolders(data.data || []);
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchLinks();
      fetchFolders();
    }
  }, [isSignedIn]);

  // Read ?url= param written by UTM Generator and pre-fill the shorten panel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingUrl = params.get("url");
    if (incomingUrl) setUtmPanelUrl(incomingUrl);
  }, []);

  const doShorten = async () => {
    if (!utmPanelUrl) return;
    setUtmLoading(true);
    setUtmError("");
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl: utmPanelUrl,
          prefix: utmPrefix,
          alias: utmAlias,
          folder: showUtmNewFolder ? utmNewFolder.trim() : utmFolder,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setUtmError(data.error || "Failed to shorten"); setUtmLoading(false); return; }
      if (data?.data?.shortCode) {
        setUtmResult(`${window.location.origin}/${data.data.shortCode}`);
        fetchLinks();
        fetchFolders();
      }
    } catch { setUtmError("Request failed"); }
    setUtmLoading(false);
  };

  const copyUtmResult = () => {
    navigator.clipboard.writeText(utmResult);
    setUtmCopied(true);
    setTimeout(() => setUtmCopied(false), 2000);
  };

  const openEdit = (link: LinkDoc) => {
    setEditingLink(link);
    setEditUrl(link.originalUrl);
    setEditFolder(link.folder || "");
    setEditUrls(link.urls || []);
    setNewGroupUrl("");
    setEditError("");
  };

  const addGroupUrl = () => {
    const trimmed = newGroupUrl.trim();
    if (trimmed) {
      setEditUrls([...editUrls, trimmed]);
      setNewGroupUrl("");
    }
  };

  const saveEdit = async () => {
    if (!editingLink) return;
    setEditLoading(true);
    setEditError("");

    const res = await fetch(`/api/links/${editingLink.shortCode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originalUrl: editUrl,
        folder: editFolder,
        urls: editUrls,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setEditError(data.error || "Failed to save");
      setEditLoading(false);
      return;
    }

    setEditingLink(null);
    setEditLoading(false);
    fetchLinks();
    fetchFolders();
  };

  const grouped = useMemo(() => {
    const acc: Record<string, LinkDoc[]> = {};
    for (const link of links) {
      const key = link.folder || "Uncategorized";
      if (!acc[key]) acc[key] = [];
      acc[key].push(link);
    }
    return acc;
  }, [links]);

  const folderOrder = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });
  }, [grouped]);

  if (!isLoaded) return <p className="text-white text-center mt-20">Loading...</p>;

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white text-center px-6">
        <h1 className="text-3xl font-bold mb-4">Please login</h1>
        <p className="text-gray-400 mb-6">You need to login to access your dashboard.</p>
        <SignInButton>
          <button className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 rounded-lg font-medium hover:scale-105 transition">
            Login
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    <main className="min-h-screen text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-black to-blue-700 opacity-80"></div>
      <div className="absolute w-[600px] h-[600px] bg-purple-500 rounded-full blur-[200px] opacity-30 animate-pulse top-[-100px] left-[-100px]"></div>
      <div className="absolute w-[500px] h-[500px] bg-blue-500 rounded-full blur-[200px] opacity-30 animate-pulse bottom-[-100px] right-[-100px]"></div>

      <div className="relative z-10 max-w-5xl mx-auto pt-10 px-4 pb-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">Dashboard</h1>

        {/* UTM Shorten Panel — shown when arriving from UTM Generator */}
        {utmPanelUrl && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-lg bg-blue-500/10 border border-blue-400/30 rounded-2xl p-5 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-blue-300">Shorten your UTM link</h2>
                <p className="text-xs text-gray-400 mt-0.5">Customize then click Shorten →</p>
              </div>
              <button
                onClick={() => { setUtmPanelUrl(""); setUtmResult(""); setUtmError(""); }}
                className="text-gray-500 hover:text-gray-300 text-sm transition"
                title="Dismiss"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* UTM URL (pre-filled, editable) */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">UTM URL</label>
                <textarea
                  value={utmPanelUrl}
                  onChange={(e) => { setUtmPanelUrl(e.target.value); setUtmResult(""); }}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-xs font-mono outline-none resize-none placeholder:text-gray-500 focus:border-blue-400/50 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Custom alias <span className="text-gray-600">(optional)</span></label>
                  <input
                    value={utmAlias}
                    onChange={(e) => setUtmAlias(e.target.value)}
                    placeholder="e.g. spring-sale"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500 focus:border-blue-400/50 transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Prefix <span className="text-gray-600">(optional)</span></label>
                  <input
                    value={utmPrefix}
                    onChange={(e) => setUtmPrefix(e.target.value)}
                    placeholder="e.g. mkt"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500 focus:border-blue-400/50 transition"
                  />
                </div>
              </div>

              {/* Folder picker */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Folder <span className="text-gray-600">(optional)</span></label>
                <div className="flex gap-2">
                  <select
                    value={showUtmNewFolder ? "__new__" : utmFolder}
                    onChange={(e) => {
                      if (e.target.value === "__new__") { setShowUtmNewFolder(true); setUtmFolder(""); }
                      else { setShowUtmNewFolder(false); setUtmFolder(e.target.value); }
                    }}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none"
                  >
                    <option value="" className="bg-gray-900">No folder</option>
                    {folders.map((f) => (
                      <option key={f} value={f} className="bg-gray-900">📁 {f}</option>
                    ))}
                    <option value="__new__" className="bg-gray-900">+ New folder…</option>
                  </select>
                  {showUtmNewFolder && (
                    <input
                      value={utmNewFolder}
                      onChange={(e) => setUtmNewFolder(e.target.value)}
                      placeholder="Folder name"
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-gray-500"
                    />
                  )}
                </div>
              </div>

              {utmError && <p className="text-red-400 text-sm">{utmError}</p>}

              <button
                onClick={doShorten}
                disabled={utmLoading}
                className="min-h-[44px] bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold text-sm hover:scale-105 transition disabled:opacity-50"
              >
                {utmLoading ? "Shortening…" : "Shorten →"}
              </button>
            </div>

            {/* Result */}
            {utmResult && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-green-500/10 border border-green-400/20 rounded-xl p-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-1">Your short link</p>
                  <a
                    href={utmResult}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-300 font-mono text-sm break-all hover:underline"
                  >
                    {utmResult}
                  </a>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <button
                      onClick={copyUtmResult}
                      className="px-4 py-1.5 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-xs text-green-300 transition"
                    >
                      {utmCopied ? "Copied!" : "Copy"}
                    </button>
                    <a
                      href={`/dashboard/${utmResult.split("/").pop()}`}
                      className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-gray-300 transition"
                    >
                      View Analytics →
                    </a>
                  </div>
                </div>
                <div className="bg-white p-2 rounded-xl shrink-0">
                  <QRCodeCanvas value={utmResult} size={96} />
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Search + Filters */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by URL or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-3 rounded-lg text-black outline-none"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full md:w-auto min-h-[44px] p-3 rounded-lg text-black"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full md:w-auto min-h-[44px] p-3 rounded-lg text-black"
          />
          <button
            onClick={fetchLinks}
            className="min-h-[44px] bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-3 rounded-lg font-medium hover:scale-105 transition"
          >
            Apply
          </button>
        </div>

        {loading && <p className="text-gray-300">Loading links...</p>}
        {!loading && links.length === 0 && <p className="text-gray-400">No links found.</p>}

        {/* Links grouped by folder */}
        {!loading && folderOrder.map((folderName) => (
            <div key={folderName} className="mb-8">
              <h2 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
                📁 {folderName}
                <span className="text-sm text-gray-500">({grouped[folderName].length})</span>
              </h2>

              <div className="grid gap-4">
                {grouped[folderName].map((link) => (
                  <motion.div
                    key={link._id}
                    whileHover={{ scale: 1.01 }}
                    className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-gray-300 text-sm truncate">
                        {link.originalUrl}
                      </span>

                      {link.urls?.length > 0 && (
                        <span className="text-xs text-purple-400">
                          +{link.urls.length} group URL{link.urls.length > 1 ? "s" : ""} (round-robin)
                        </span>
                      )}

                      <a
                        href={`${window.location.origin}/${link.shortCode}`}
                        target="_blank"
                        className="text-blue-400 font-medium text-sm break-all"
                      >
                        {window.location.origin}/{link.shortCode}
                      </a>

                      <a
                        href={`/dashboard/${link.shortCode}`}
                        className="text-sm text-purple-400 mt-1"
                      >
                        View Analytics →
                      </a>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                      <p className="text-sm text-gray-400">Clicks: {link.clicks || 0}</p>
                      <button
                        onClick={() => openEdit(link)}
                        className="min-h-[44px] sm:min-h-0 text-sm bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-lg transition"
                      >
                        Edit
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
        ))}

        {/* Load more */}
        {!loading && hasMore && (
          <div className="flex justify-center mt-2 mb-4">
            <button
              onClick={loadMoreLinks}
              disabled={loadingMore}
              className="min-h-[44px] px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5">Edit Link</h2>

            <label className="text-sm text-gray-400 mb-1 block">Destination URL</label>
            <input
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white mb-4 outline-none"
            />

            <label className="text-sm text-gray-400 mb-1 block">Folder</label>
            <input
              value={editFolder}
              onChange={(e) => setEditFolder(e.target.value)}
              placeholder="e.g. Marketing, Social..."
              list="edit-folder-list"
              className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white mb-4 outline-none"
            />
            <datalist id="edit-folder-list">
              {folders.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>

            <label className="text-sm text-gray-400 mb-2 block">
              Group URLs{" "}
              <span className="text-gray-600 font-normal">(redirect picks randomly)</span>
            </label>

            {editUrls.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {editUrls.map((u, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="flex-1 text-sm text-gray-300 truncate bg-white/5 px-3 py-2 rounded-lg">
                      {u}
                    </span>
                    <button
                      onClick={() => setEditUrls(editUrls.filter((_, j) => j !== i))}
                      className="text-red-400 text-sm px-2 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-5">
              <input
                value={newGroupUrl}
                onChange={(e) => setNewGroupUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGroupUrl()}
                placeholder="Add URL to group..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg p-2.5 text-white text-sm outline-none"
              />
              <button
                onClick={addGroupUrl}
                className="min-h-[44px] bg-blue-500 hover:bg-blue-600 px-4 rounded-lg text-sm transition"
              >
                Add
              </button>
            </div>

            {editError && <p className="text-red-400 text-sm mb-3">{editError}</p>}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingLink(null)}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={editLoading}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 font-medium hover:scale-105 transition disabled:opacity-50"
              >
                {editLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
