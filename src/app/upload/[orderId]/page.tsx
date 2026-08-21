"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Video, Camera, CheckCircle2, AlertCircle, Loader2, User, Package, Cpu } from "lucide-react";

interface OrderDetail {
  id: string;
  shopeeOrderSn: string;
  productDetails: string;
  technicianName?: string | null;
  status: string;
}

export default function MobileQCUploadPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [technicianName, setTechnicianName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setOrder(data.data);
          if (data.data.technicianName) {
            setTechnicianName(data.data.technicianName);
          }
        } else {
          setStatusMsg({ type: "error", text: "Order tidak ditemukan di server lokal." });
        }
      } catch (err: any) {
        setStatusMsg({ type: "error", text: "Gagal menghubungkan ke server LAN." });
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setVideoFile(selected);
      setStatusMsg(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !orderId) return;

    setUploading(true);
    setProgress(0);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("video", videoFile);
    if (technicianName) {
      formData.append("technicianName", technicianName);
    }

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload-qc", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          if (res.success) {
            setStatusMsg({
              type: "success",
              text: "Video QC berhasil disimpan! Status order otomatis berpindah ke PACKING.",
            });
            setVideoFile(null);
          } else {
            setStatusMsg({ type: "error", text: res.error || "Gagal upload video." });
          }
        } else {
          setStatusMsg({ type: "error", text: "Terjadi kesalahan upload pada server." });
        }
        setUploading(false);
      };

      xhr.onerror = () => {
        setStatusMsg({ type: "error", text: "Koneksi LAN terputus saat proses upload." });
        setUploading(false);
      };

      xhr.send(formData);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Gagal memproses file video." });
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-cyan-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs font-mono">Menghubungkan ke Workstation Hub...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-300">
        <div className="tech-panel-3d rounded-2xl p-6 max-w-sm text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h2 className="text-base font-bold text-white">Order Tidak Ditemukan</h2>
          <p className="text-xs text-slate-400 mt-1">Pastikan QR Code yang di-scan valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 pb-12 flex flex-col items-center">
      <div className="w-full max-w-md flex flex-col gap-4">
        {/* Header HUD */}
        <div className="tech-panel-3d rounded-2xl p-4 flex items-center justify-between border-b-2 border-cyan-500/40">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" />
            <h1 className="text-sm font-bold tracking-wide uppercase">QC Video Direct Upload</h1>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            LAN ACTIVE
          </span>
        </div>

        {/* Order Details Preview */}
        <div className="tech-card-3d rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-bold">
            <Cpu className="w-4 h-4" />
            <span>{order.shopeeOrderSn}</span>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-line">
            {order.productDetails}
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="tech-panel-3d rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              Nama Teknisi
            </label>
            <input
              type="text"
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              placeholder="Masukkan nama teknisi..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Trigger Kamera / File Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              File Rekaman QC
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-cyan-500/40 bg-cyan-950/10 hover:bg-cyan-950/30 rounded-xl p-5 flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Camera className="w-8 h-8 text-cyan-400 animate-bounce" />
              <div className="text-center">
                <span className="text-xs font-bold text-cyan-200">
                  {videoFile ? videoFile.name : "Buka Kamera / Pilih Video"}
                </span>
                {videoFile && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
              </div>
            </button>
          </div>

          {/* Progress Indicator */}
          {uploading && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-mono text-cyan-300">
                <span>Mengirim ke Server...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-cyan-500 h-full transition-all duration-150 shadow-[0_0_10px_#06b6d4]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl flex items-start gap-2 border text-xs leading-tight ${
                statusMsg.type === "success"
                  ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                  : "bg-rose-950/40 border-rose-500/50 text-rose-300"
              }`}
            >
              {statusMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!videoFile || uploading}
            className="btn-3d-cyan py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengunggah Video...</span>
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                <span>Simpan QC & Kirim ke Packing</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}