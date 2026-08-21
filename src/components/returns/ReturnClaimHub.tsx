"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  PackageX,
  Plus,
  Search,
  RefreshCw,
  QrCode,
  Play,
  Copy,
  Check,
  X,
  Image as ImageIcon,
  AlertTriangle,
  FileText,
  User,
  Truck,
  Maximize2,
  Trash2,
  ExternalLink,
  ChevronDown,
  Wifi,
  Globe2,
  Edit2
} from "lucide-react";

export interface ReturnClaimItem {
  id: string;
  shopeeOrderSn: string;
  returnTrackingNumber?: string | null;
  buyerUsername?: string | null;
  productDetails?: string | null;
  returnReason: string;
  status: string;
  photoOuterPath?: string | null;
  photoResiPath?: string | null;
  photoInsidePath?: string | null;
  videoProofPath?: string | null;
  technicianName?: string | null;
  claimNotes?: string | null;
  createdAt: string;
  order?: {
    id: string;
    qcVideoPath?: string | null;
    status: string;
  } | null;
}

const CLAIM_STATUSES = [
  { id: "MENUNGGU_UNBOXING", label: "Menunggu Unboxing", color: "bg-amber-950/80 text-amber-300 border-amber-500/40" },
  { id: "UNBOXING_SELESAI", label: "Unboxing Selesai", color: "bg-cyan-950/80 text-cyan-300 border-cyan-500/40" },
  { id: "KLAIM_DIAJUKAN", label: "Banding Diajukan", color: "bg-indigo-950/80 text-indigo-300 border-indigo-500/40" },
  { id: "KLAIM_DISETUJUI", label: "Klaim Disetujui (Cair)", color: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" },
  { id: "KLAIM_DITOLAK", label: "Klaim Ditolak", color: "bg-rose-950/80 text-rose-300 border-rose-500/40" },
  { id: "SELESAI", label: "Selesai (Gudang)", color: "bg-slate-900 text-slate-300 border-slate-700" },
];

export const ReturnClaimHub: React.FC = () => {
  const [returns, setReturns] = useState<ReturnClaimItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterReason, setFilterReason] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [hostIP, setHostIP] = useState<string>("127.0.0.1");
  const [lanIp, setLanIp] = useState<string>("127.0.0.1");
  const [tailscaleIp, setTailscaleIp] = useState<string | null>(null);
  const [networkMode, setNetworkMode] = useState<"LAN" | "TAILSCALE">("LAN");
  const [isEditingIP, setIsEditingIP] = useState(false);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<ReturnClaimItem | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{ path: string; sn: string } | null>(null);
  const [selectedClaimDetail, setSelectedClaimDetail] = useState<ReturnClaimItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State Tambah Retur
  const [newSn, setNewSn] = useState("");
  const [newResi, setNewResi] = useState("");
  const [newBuyer, setNewBuyer] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newReason, setNewReason] = useState("GAGAL_KIRIM_RTS");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReturns();
    fetchNetworkInfo();
  }, []);

  const fetchNetworkInfo = async () => {
    try {
      const res = await fetch("/api/network");
      const json = await res.json();
      if (json.success) {
        setLanIp(json.lanIp);
        setTailscaleIp(json.tailscaleIp);
        if (json.lanIp && json.lanIp !== "localhost") {
          setHostIP(json.lanIp);
          setNetworkMode("LAN");
        } else if (json.tailscaleIp) {
          setHostIP(json.tailscaleIp);
          setNetworkMode("TAILSCALE");
        } else if (json.localIp) {
          setHostIP(json.localIp);
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        setHostIP(window.location.hostname);
      }
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

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/returns");
      const json = await res.json();
      if (json.success) {
        setReturns(json.data);
      }
    } catch (err) {
      console.error("Failed to load returns:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSn.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopeeOrderSn: newSn.trim(),
          returnTrackingNumber: newResi.trim() || undefined,
          buyerUsername: newBuyer.trim() || undefined,
          productDetails: newProduct.trim() || undefined,
          returnReason: newReason,
          claimNotes: newNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setNewSn("");
        setNewResi("");
        setNewBuyer("");
        setNewProduct("");
        setNewNotes("");
        setIsCreateModalOpen(false);
        fetchReturns();
      } else {
        alert(json.error || "Gagal mendaftarkan tiket retur.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (returnId: string, status: string) => {
    try {
      const formData = new FormData();
      formData.append("returnId", returnId);
      // Status update langsung via backend
      const res = await fetch("/api/upload-retur", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setReturns((prev) =>
          prev.map((r) => (r.id === returnId ? { ...r, status } : r))
        );
      }
    } catch (err) {
      console.error("Failed to update return status:", err);
    }
  };

  const copyBandingTemplate = (item: ReturnClaimItem) => {
    const template = `Halo Tim CS Shopee / Tim Klaim Ekspedisi,

Berikut pengajuan komplain / ganti rugi terkait paket retur yang kami terima:

• No. Pesanan Shopee : ${item.shopeeOrderSn}
• No. Resi Retur     : ${item.returnTrackingNumber || "Lihat pada label foto"}
• Username Pembeli   : @${item.buyerUsername || "-"}
• Kendala / Alasan   : ${item.returnReason === "GAGAL_KIRIM_RTS" ? "Paket Gagal Kirim (RTS) Rusak/Penyok" : "Komplain Pengembalian Pembeli"}
• Catatan Kerusakan  : ${item.claimNotes || "Kondisi fisik barang tiba dalam keadaan rusak saat unboxing."}

Bukti fisik lengkap (Foto kondisi kemasan luar, foto label resi retur, foto isi dalam kardus, dan video rekaman) telah kami dokumentasikan secara continuous tanpa cut saat penerimaan barang.

Mohon bantuan untuk proses validasi dan penggantian klaim. Terima kasih.`;

    navigator.clipboard.writeText(template);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getQRTargetURL = (returnId: string) => {
    const port = typeof window !== "undefined" ? window.location.port || "3007" : "3007";
    return `http://${hostIP}:${port}/upload-retur/${returnId}`;
  };

  const resolvePhotoUrl = (rawPath: string | null | undefined) => {
    if (!rawPath) return "";
    if (rawPath.startsWith("/api/retur-photo/")) return rawPath;
    const filename = rawPath.split("/").pop() || "";
    return `/api/retur-photo/${encodeURIComponent(filename)}`;
  };

  const filteredReturns = returns.filter((item) => {
    const q = search.toLowerCase();
    const matchQuery =
      item.shopeeOrderSn.toLowerCase().includes(q) ||
      (item.returnTrackingNumber && item.returnTrackingNumber.toLowerCase().includes(q)) ||
      (item.buyerUsername && item.buyerUsername.toLowerCase().includes(q)) ||
      (item.productDetails && item.productDetails.toLowerCase().includes(q)) ||
      (item.technicianName && item.technicianName.toLowerCase().includes(q));

    const matchReason =
      filterReason === "ALL" ? true : item.returnReason === filterReason;

    return matchQuery && matchReason;
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
              placeholder="Cari No. Pesanan Retur, Resi, Pembeli, Teknisi..."
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
          {/* Reason Filter */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterReason("ALL")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterReason === "ALL"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Semua Retur
            </button>
            <button
              onClick={() => setFilterReason("GAGAL_KIRIM_RTS")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterReason === "GAGAL_KIRIM_RTS"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Gagal Kirim (RTS)
            </button>
            <button
              onClick={() => setFilterReason("KOMPLAIN_PEMBELI")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                filterReason === "KOMPLAIN_PEMBELI"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Komplain Pembeli
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-3d-cyan px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrasi Retur</span>
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
              fetchReturns();
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

      {/* Grid Retur & Klaim Cards */}
      {filteredReturns.length === 0 ? (
        <div className="tech-panel-3d rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-center min-h-[380px]">
          <PackageX className="w-12 h-12 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Tidak Ada Paket Retur / Klaim
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Daftarkan paket retur baru atau gagal kirim (RTS) yang baru tiba di toko untuk diverifikasi unboxing oleh teknisi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredReturns.map((item) => {
            const hasOuter = Boolean(item.photoOuterPath);
            const hasResi = Boolean(item.photoResiPath);
            const hasInside = Boolean(item.photoInsidePath);
            const hasVideo = Boolean(item.videoProofPath);
            const isCompletedCapture = hasOuter && hasResi;

            return (
              <div
                key={item.id}
                className="tech-panel-3d rounded-2xl p-4 flex flex-col gap-3.5 border border-slate-800/90 relative hover:border-cyan-500/40 transition-all"
              >
                {/* Header: SN & Reason Tag */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="font-mono text-xs font-bold text-cyan-300 truncate">
                      {item.shopeeOrderSn}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      item.returnReason === "GAGAL_KIRIM_RTS"
                        ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
                        : "bg-rose-950/80 text-rose-300 border-rose-500/40"
                    }`}
                  >
                    {item.returnReason === "GAGAL_KIRIM_RTS" ? "Gagal Kirim (RTS)" : "Komplain Pembeli"}
                  </span>
                </div>

                {/* Buyer & Return Resi */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 flex flex-col">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3 text-cyan-400" /> Pembeli
                    </span>
                    <strong className="text-slate-200 truncate mt-0.5">
                      {item.buyerUsername ? `@${item.buyerUsername}` : "Anonim"}
                    </strong>
                  </div>

                  <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 flex flex-col">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-cyan-400" /> Resi Retur
                    </span>
                    <strong className="text-slate-200 font-mono text-[11px] truncate mt-0.5">
                      {item.returnTrackingNumber || "Lihat Foto Resi"}
                    </strong>
                  </div>
                </div>

                {/* 3 Photos + 1 Video Matrix Preview */}
                <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {/* Foto 1: Luar */}
                  <div className="flex flex-col items-center gap-1">
                    {hasOuter ? (
                      <div
                        onClick={() => setPreviewImage({ src: resolvePhotoUrl(item.photoOuterPath), title: "Foto Fisik Luar Paket" })}
                        className="w-full aspect-square rounded-lg bg-black border border-cyan-500/40 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                      >
                        <img src={resolvePhotoUrl(item.photoOuterPath)} alt="Luar" className="w-full h-full object-cover" />
                        <Maximize2 className="w-3 h-3 text-white absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-[9px] text-slate-600">
                        Kosong
                      </div>
                    )}
                    <span className="text-[9px] text-slate-400 text-center truncate">1. Luar</span>
                  </div>

                  {/* Foto 2: Resi */}
                  <div className="flex flex-col items-center gap-1">
                    {hasResi ? (
                      <div
                        onClick={() => setPreviewImage({ src: resolvePhotoUrl(item.photoResiPath), title: "Foto Label Resi Retur" })}
                        className="w-full aspect-square rounded-lg bg-black border border-cyan-500/40 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                      >
                        <img src={resolvePhotoUrl(item.photoResiPath)} alt="Resi" className="w-full h-full object-cover" />
                        <Maximize2 className="w-3 h-3 text-white absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-[9px] text-slate-600">
                        Kosong
                      </div>
                    )}
                    <span className="text-[9px] text-slate-400 text-center truncate">2. Resi</span>
                  </div>

                  {/* Foto 3: Isi */}
                  <div className="flex flex-col items-center gap-1">
                    {hasInside ? (
                      <div
                        onClick={() => setPreviewImage({ src: resolvePhotoUrl(item.photoInsidePath), title: "Foto Isi Dalam Paket" })}
                        className="w-full aspect-square rounded-lg bg-black border border-amber-500/40 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                      >
                        <img src={resolvePhotoUrl(item.photoInsidePath)} alt="Isi" className="w-full h-full object-cover" />
                        <Maximize2 className="w-3 h-3 text-white absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-[9px] text-slate-600">
                        Kosong
                      </div>
                    )}
                    <span className="text-[9px] text-slate-400 text-center truncate">3. Isi</span>
                  </div>

                  {/* Video 4: Rusak */}
                  <div className="flex flex-col items-center gap-1">
                    {hasVideo ? (
                      <div
                        onClick={() => setPreviewVideo({ path: item.videoProofPath!, sn: item.shopeeOrderSn })}
                        className="w-full aspect-square rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center cursor-pointer hover:bg-emerald-900/60 transition-colors"
                        title="Putar Video Kerusakan"
                      >
                        <Play className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-[9px] text-slate-600">
                        -
                      </div>
                    )}
                    <span className="text-[9px] text-slate-400 text-center truncate">4. Video</span>
                  </div>
                </div>

                {/* Notes & Status */}
                {item.claimNotes && (
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-300 italic line-clamp-2">
                    "{item.claimNotes}"
                  </div>
                )}

                {/* Actions & QR Trigger */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    onClick={() => setSelectedQR(item)}
                    className="btn-3d-cyan text-white text-xs font-bold py-2 px-2 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan HP</span>
                  </button>

                  <button
                    onClick={() => copyBandingTemplate(item)}
                    className="btn-3d-dark text-slate-200 text-xs font-bold py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 border border-slate-700"
                    title="Salin Draft Surat Banding Shopee"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Form Banding</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Retur Manual */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="tech-panel-3d rounded-2xl max-w-md w-full p-5 relative flex flex-col gap-4 border border-cyan-500/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <PackageX className="w-4 h-4 text-cyan-400" />
                Registrasi Paket Retur Baru
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-slate-300 font-semibold">
                  No. Pesanan Shopee <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 260818N4MPK6RR"
                  value={newSn}
                  onChange={(e) => setNewSn(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-300 font-semibold">No. Resi Retur (Jika ada)</label>
                  <input
                    type="text"
                    placeholder="Contoh: SPXID..."
                    value={newResi}
                    onChange={(e) => setNewResi(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-slate-300 font-semibold">Alasan Retur</label>
                  <select
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="GAGAL_KIRIM_RTS">Gagal Kirim (RTS)</option>
                    <option value="KOMPLAIN_PEMBELI">Komplain Pembeli</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-300 font-semibold">Catatan Awal Paket</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Kardus penyok parah di bagian samping..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-3d-dark px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-3d-cyan px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Daftarkan Tiket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal untuk Mobile Capture Retur */}
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

      {/* Full Photo Modal Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full flex flex-col gap-3 relative">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{previewImage.title}</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
              <img src={previewImage.src} alt={previewImage.title} className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Video Streaming Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tech-panel-3d rounded-3xl p-5 max-w-2xl w-full border border-emerald-500/40 relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Video Bukti Kerusakan Retur</h3>
                <p className="text-xs font-mono text-emerald-400">{previewVideo.sn}</p>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center relative">
              <video
                key={previewVideo.path}
                controls
                autoPlay
                playsInline
                preload="auto"
                className="w-full h-full object-contain"
              >
                <source src={previewVideo.path} type="video/mp4" />
                <source src={previewVideo.path} type="video/quicktime" />
                <source src={previewVideo.path} type="video/webm" />
                Browser Anda tidak mendukung streaming pemutar video ini.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};