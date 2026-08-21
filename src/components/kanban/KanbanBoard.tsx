"use client";

import React, { useState, useEffect } from "react";
import { OrderCard3D, OrderData } from "./OrderCard3D";
import { OrderDetailModal } from "./OrderDetailModal";
import { CreateOrderModal } from "./CreateOrderModal";
import { QRCodeSVG } from "qrcode.react";
import { 
  Search, 
  RefreshCw, 
  Layers, 
  Wrench, 
  Video, 
  Package, 
  CheckCircle2, 
  X, 
  Wifi, 
  Globe2, 
  Edit2, 
  Download,
  Plus,
  Archive,
  FileText,
  LayoutGrid
} from "lucide-react";

const COLUMNS = [
  { id: "NEW", title: "1. Antrean Baru", icon: Layers, color: "border-sky-500/40 text-sky-400" },
  { id: "IN_PROGRESS", title: "2. Rakit & Servis", icon: Wrench, color: "border-amber-500/40 text-amber-400" },
  { id: "QC_TESTING", title: "3. Pengetesan (QC)", icon: Video, color: "border-cyan-500/40 text-cyan-400" },
  { id: "PACKING", title: "4. Packing Kardus", icon: Package, color: "border-indigo-500/40 text-indigo-400" },
  { id: "COMPLETED", title: "5. Sudah Dikirim", icon: CheckCircle2, color: "border-emerald-500/40 text-emerald-400" },
];

export const KanbanBoard: React.FC = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQR, setSelectedQR] = useState<OrderData | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ path: string; sn: string } | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<OrderData | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [hostIP, setHostIP] = useState<string>("127.0.0.1");
  const [lanIp, setLanIp] = useState<string>("127.0.0.1");
  const [tailscaleIp, setTailscaleIp] = useState<string | null>(null);
  const [networkMode, setNetworkMode] = useState<"LAN" | "TAILSCALE">("LAN");
  const [isEditingIP, setIsEditingIP] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);

  useEffect(() => {
    fetchOrders();
    fetchNetworkInfo();
  }, []);

  const handleArchiveCompletedOrders = async () => {
    const completedOrders = orders.filter((o) => o.status === "COMPLETED");
    if (completedOrders.length === 0) {
      alert("Tidak ada order di kolom 'Sudah Dikirim' yang perlu diarsipkan.");
      return;
    }

    if (!confirm(`Arsipkan ${completedOrders.length} order yang sudah dikirim? Order akan dipindahkan ke Halaman Arsip.`)) {
      return;
    }

    try {
      for (const ord of completedOrders) {
        await fetch(`/api/orders/${ord.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ARCHIVED" }),
        });
      }
      fetchOrders();
    } catch (err) {
      console.error("Failed to archive orders:", err);
    }
  };

  const fetchNetworkInfo = async () => {
    try {
      const res = await fetch("/api/network");
      const json = await res.json();
      if (json.success) {
        setLanIp(json.lanIp);
        setTailscaleIp(json.tailscaleIp);
        if (json.lanIp !== "localhost") {
          setHostIP(json.lanIp);
          setNetworkMode("LAN");
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        setHostIP(window.location.hostname);
      }
    }
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders");
      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNetworkMode = (mode: "LAN" | "TAILSCALE") => {
    setNetworkMode(mode);
    if (mode === "TAILSCALE" && tailscaleIp) {
      setHostIP(tailscaleIp);
    } else if (mode === "LAN" && lanIp) {
      setHostIP(lanIp);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleUpdateTechnician = async (orderId: string, technicianName: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianName }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, technicianName } : o))
        );
      }
    } catch (err) {
      console.error("Failed to update technician:", err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        if (selectedDetailOrder?.id === orderId) setSelectedDetailOrder(null);
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.shopeeOrderSn.toLowerCase().includes(q) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
      (o.buyerUsername && o.buyerUsername.toLowerCase().includes(q)) ||
      o.productDetails.toLowerCase().includes(q) ||
      (o.technicianName && o.technicianName.toLowerCase().includes(q))
    );
  });

  const getQRTargetURL = (orderId: string) => {
    const port = typeof window !== "undefined" ? window.location.port || "3007" : "3007";
    return `http://${hostIP}:${port}/upload/${orderId}`;
  };

  const resolveVideoUrl = (rawPath: string) => {
    if (!rawPath) return "";
    const filename = rawPath.split("/").pop() || "";
    return `/api/qc-video/${encodeURIComponent(filename)}`;
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top HUD Toolbar */}
      <div className="tech-panel-3d rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari No. Pesanan, Resi, Spek PC, Teknisi..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none transition-all shadow-inner"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="btn-3d-dark px-3 py-2 rounded-xl text-xs text-slate-300 font-bold"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Switcher: Compact vs Detailed */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setIsCompactMode(true)}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                isCompactMode
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Tampilan Card Ringkas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Ringkas</span>
            </button>

            <button
              onClick={() => setIsCompactMode(false)}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                !isCompactMode
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Tampilan Detail Varian"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Detail</span>
            </button>
          </div>

          {/* Tombol Tambah Order Manual */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-3d-cyan px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Order Manual</span>
          </button>

          {/* Network Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => toggleNetworkMode("LAN")}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                networkMode === "LAN"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>LAN Utama</span>
            </button>

            {tailscaleIp && (
              <button
                onClick={() => toggleNetworkMode("TAILSCALE")}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  networkMode === "TAILSCALE"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Tailscale Cabang</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-cyan-900/60 text-xs font-mono text-cyan-400">
            <span className="text-slate-400">Host IP:</span>
            {isEditingIP ? (
              <input
                type="text"
                value={hostIP}
                onChange={(e) => setHostIP(e.target.value)}
                onBlur={() => setIsEditingIP(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingIP(false)}
                autoFocus
                className="bg-slate-900 border border-cyan-500 rounded px-1.5 py-0.5 text-cyan-300 text-xs w-32 outline-none"
              />
            ) : (
              <strong 
                onClick={() => setIsEditingIP(true)}
                className="cursor-pointer hover:text-cyan-200 underline decoration-dotted flex items-center gap-1"
                title="Klik untuk ubah IP manual"
              >
                {hostIP}
                <Edit2 className="w-2.5 h-2.5 opacity-60" />
              </strong>
            )}
          </div>

          <button
            onClick={() => {
              fetchOrders();
              fetchNetworkInfo();
            }}
            disabled={isLoading}
            className="btn-3d-dark px-3.5 py-2 rounded-xl text-xs text-slate-200 font-bold flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 5-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start min-h-[70vh]">
        {COLUMNS.map((col) => {
          const colOrders = filteredOrders.filter((o) => o.status === col.id);
          const Icon = col.icon;

          return (
            <div
              key={col.id}
              className="tech-panel-3d rounded-2xl p-3 flex flex-col gap-3 min-h-[520px] w-full"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 px-1">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${col.color}`} />
                  <h3 className="font-bold text-xs tracking-wider uppercase text-slate-200">
                    {col.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {col.id === "COMPLETED" && colOrders.length > 0 && (
                    <button
                      onClick={handleArchiveCompletedOrders}
                      className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-300 text-[10px] flex items-center gap-1"
                      title="Pindahkan semua order dikirim ke Halaman Arsip"
                    >
                      <Archive className="w-3 h-3 text-cyan-400" />
                      <span>Arsip</span>
                    </button>
                  )}
                  <span className="bg-slate-950 px-2 py-0.5 rounded-full text-xs font-mono font-bold text-slate-300 border border-slate-800">
                    {colOrders.length}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-260px)] pr-1">
                {colOrders.length === 0 ? (
                  <div className="h-32 border border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-xs text-slate-600 font-mono">
                    Kosong
                  </div>
                ) : (
                  colOrders.map((order) => (
                    <OrderCard3D
                      key={order.id}
                      order={order}
                      isCompactMode={col.id === "COMPLETED" ? true : isCompactMode}
                      onUpdateStatus={handleUpdateStatus}
                      onUpdateTechnician={handleUpdateTechnician}
                      onDeleteOrder={handleDeleteOrder}
                      onOpenQR={(ord) => setSelectedQR(ord)}
                      onPlayVideo={(path, sn) => setSelectedVideo({ path: resolveVideoUrl(path), sn })}
                      onSelectOrder={(ord) => setSelectedDetailOrder(ord)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah Order Manual */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOrderCreated={fetchOrders}
      />

      {/* Detail Modal */}
      <OrderDetailModal
        order={selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
        onOpenQR={(ord) => setSelectedQR(ord)}
        onPlayVideo={(path, sn) => setSelectedVideo({ path: resolveVideoUrl(path), sn })}
      />

      {/* QR Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tech-panel-3d rounded-3xl p-6 max-w-sm w-full border border-cyan-500/40 relative flex flex-col items-center gap-4">
            <button
              onClick={() => setSelectedQR(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-100">Scan via Kamera HP</h3>
              <p className="text-xs font-mono text-cyan-400 mt-0.5">{selectedQR.shopeeOrderSn}</p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-cyan-500/20">
              <QRCodeSVG
                value={getQRTargetURL(selectedQR.id)}
                size={220}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Network Switcher inside QR Modal */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full justify-center">
              <button
                onClick={() => toggleNetworkMode("LAN")}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs ${
                  networkMode === "LAN"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>LAN Wi-Fi</span>
              </button>

              {tailscaleIp && (
                <button
                  onClick={() => toggleNetworkMode("TAILSCALE")}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs ${
                    networkMode === "TAILSCALE"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Tailscale</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-center text-slate-400 leading-tight">
              {networkMode === "TAILSCALE"
                ? "Mode Cabang: Pastikan smartphone terhubung ke Tailscale."
                : "Mode Toko Utama: Pastikan smartphone terhubung ke WiFi toko yang sama."}
            </p>

            <div className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300 text-center break-all flex items-center justify-between gap-2">
              {isEditingIP ? (
                <input
                  type="text"
                  value={hostIP}
                  onChange={(e) => setHostIP(e.target.value)}
                  onBlur={() => setIsEditingIP(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditingIP(false)}
                  autoFocus
                  className="bg-slate-900 border border-cyan-500 rounded px-2 py-0.5 text-cyan-300 text-xs w-full text-center outline-none"
                />
              ) : (
                <>
                  <span className="flex-1 text-center truncate">{getQRTargetURL(selectedQR.id)}</span>
                  <button
                    onClick={() => setIsEditingIP(true)}
                    className="text-slate-400 hover:text-cyan-400 p-1 flex-shrink-0"
                    title="Ubah IP Manual"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tech-panel-3d rounded-3xl p-5 max-w-2xl w-full border border-emerald-500/40 relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Rekaman Pengetesan (QC)</h3>
                <p className="text-xs font-mono text-emerald-400">{selectedVideo.sn}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedVideo.path}
                  download
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-xs"
                  title="Download File Video"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center relative">
              <video
                key={selectedVideo.path}
                controls
                autoPlay
                playsInline
                preload="auto"
                className="w-full h-full object-contain"
              >
                <source src={selectedVideo.path} type="video/mp4" />
                <source src={selectedVideo.path} type="video/quicktime" />
                <source src={selectedVideo.path} type="video/webm" />
                Browser Anda tidak mendukung streaming pemutar video ini.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};