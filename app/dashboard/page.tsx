"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useUser, SignInButton } from "@clerk/nextjs";

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
    const query = new URLSearchParams({ search, startDate, endDate });
    const res = await fetch(`/api/links?${query}`);
    const data = await res.json();
    setLinks(data.data || []);
    setLoading(false);
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
        {!loading &&
          folderOrder.map((folderName) => (
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
