"use client";

import React, { useState, useEffect } from "react";
import { OrderData } from "@/components/kanban/OrderCard3D";
import { OrderDetailModal } from "@/components/kanban/OrderDetailModal";
import { 
  Archive, 
  Search, 
  RefreshCw, 
  Play, 
  User, 
  Truck, 
  Maximize2, 
  RotateCcw,
  Download,
  X,
  Calendar,
  Tag
} from "lucide-react";

export const ArchiveHub: React.FC = () => {
  const [archivedOrders, setArchivedOrders] = useState<OrderData[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<OrderData | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ path: string; sn: string } | null>(null);

  useEffect(() => {
    fetchArchivedOrders();
  }, []);

  const fetchArchivedOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders");
      const json = await res.json();
      if (json.success) {
        // Filter order berstatus ARCHIVED atau COMPLETED
        const list = json.data.filter(
          (o: OrderData) => o.status === "ARCHIVED" || o.status === "COMPLETED"
        );
        setArchivedOrders(list);
      }
    } catch (err) {
      console.error("Failed to load archive:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (res.ok) {
        setArchivedOrders((prev) => prev.filter((o) => o.id !== orderId));
        alert("Order berhasil dipulihkan ke Kanban Antrean.");
      }
    } catch (err) {
      console.error("Failed to restore order:", err);
    }
  };

  const resolveVideoUrl = (rawPath: string) => {
    if (!rawPath) return "";
    const filename = rawPath.split("/").pop() || "";
    return `/api/qc-video/${encodeURIComponent(filename)}`;
  };

  const filteredOrders = archivedOrders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.shopeeOrderSn.toLowerCase().includes(q) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
      (o.buyerUsername && o.buyerUsername.toLowerCase().includes(q)) ||
      o.productDetails.toLowerCase().includes(q) ||
      (o.technicianName && o.technicianName.toLowerCase().includes(q))
    );
  });

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
              placeholder="Cari Arsip: No. Pesanan, Resi, Pembeli, Spek PC, Teknisi..."
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-400 font-mono">
            <Archive className="w-3.5 h-3.5 text-cyan-400" />
            <span>Total Tersimpan: <strong className="text-cyan-300">{filteredOrders.length} Order</strong></span>
          </div>

          <button
            onClick={fetchArchivedOrders}
            disabled={isLoading}
            className="btn-3d-dark px-3.5 py-2 rounded-xl text-xs text-slate-200 font-bold flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Grid List Arsip */}
      {filteredOrders.length === 0 ? (
        <div className="tech-panel-3d rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-center min-h-[380px]">
          <Archive className="w-12 h-12 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Tidak Ada Data Arsip Order
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Order yang diarsipkan dari Kanban *Sudah Dikirim* akan muncul di sini agar papan Kanban tetap bersih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="tech-panel-3d rounded-2xl p-4 flex flex-col gap-3 border border-slate-800/90 relative hover:border-cyan-500/40 transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Archive className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="font-mono text-xs font-bold text-slate-200 truncate">
                    {order.shopeeOrderSn}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-slate-900 text-emerald-400 border-emerald-500/40">
                  {order.status === "ARCHIVED" ? "Terarsip" : "Dikirim"}
                </span>
              </div>

              {/* Info Pembeli & Resi */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 flex flex-col">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3 text-cyan-400" /> Pembeli
                  </span>
                  <strong className="text-slate-200 font-semibold text-[11px] truncate mt-0.5">
                    {order.buyerUsername ? `@${order.buyerUsername}` : "Shopee Buyer"}
                  </strong>
                </div>

                <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 flex flex-col">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-cyan-400" /> Resi / Kurir
                  </span>
                  <strong className="text-slate-200 font-mono text-[11px] truncate mt-0.5">
                    {order.trackingNumber || "Tidak ada resi"}
                  </strong>
                </div>
              </div>

              {/* Rincian Ringkas */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 line-clamp-2">
                {order.productDetails}
              </div>

              {/* Footer: PIC & Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">
                  PIC: <strong className="text-cyan-300">{order.technicianName || "-"}</strong>
                </span>

                <div className="flex items-center gap-2">
                  {order.qcVideoPath && (
                    <button
                      onClick={() => setSelectedVideo({ path: resolveVideoUrl(order.qcVideoPath!), sn: order.shopeeOrderSn })}
                      className="btn-3d-emerald text-white text-xs font-bold py-1.5 px-2.5 rounded-xl flex items-center gap-1.5"
                      title="Putar Video Rekaman QC"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Video QC</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedDetailOrder(order)}
                    className="btn-3d-cyan text-white text-xs font-bold py-1.5 px-2.5 rounded-xl flex items-center gap-1.5"
                    title="Lihat Detail Lengkap"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Detail</span>
                  </button>

                  <button
                    onClick={() => handleRestoreOrder(order.id)}
                    className="btn-3d-dark text-slate-300 hover:text-white text-xs font-bold p-1.5 rounded-xl border border-slate-700"
                    title="Pulihkan ke Kanban"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <OrderDetailModal
        order={selectedDetailOrder}
        onClose={() => setSelectedDetailOrder(null)}
        onOpenQR={() => {}}
        onPlayVideo={(path, sn) => setSelectedVideo({ path: resolveVideoUrl(path), sn })}
      />

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tech-panel-3d rounded-3xl p-5 max-w-2xl w-full border border-emerald-500/40 relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Rekaman Pengetesan (QC) Arsip</h3>
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
