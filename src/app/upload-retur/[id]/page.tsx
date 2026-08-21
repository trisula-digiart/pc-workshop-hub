"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Video, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Package, 
  FileText, 
  Box, 
  User, 
  RefreshCw,
  Trash2
} from "lucide-react";

interface ReturnData {
  id: string;
  shopeeOrderSn: string;
  returnTrackingNumber?: string | null;
  buyerUsername?: string | null;
  productDetails?: string | null;
  returnReason: string;
  status: string;
  technicianName?: string | null;
  claimNotes?: string | null;
  photoOuterPath?: string | null;
  photoResiPath?: string | null;
  photoInsidePath?: string | null;
  videoProofPath?: string | null;
}

export default function UploadReturMobilePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [returnData, setReturnData] = useState<ReturnData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [technicianName, setTechnicianName] = useState("");
  const [claimNotes, setClaimNotes] = useState("");
  
  // Media Files
  const [photoOuter, setPhotoOuter] = useState<File | null>(null);
  const [photoResi, setPhotoResi] = useState<File | null>(null);
  const [photoInside, setPhotoInside] = useState<File | null>(null);
  const [videoProof, setVideoProof] = useState<File | null>(null);

  // Previews
  const [previewOuter, setPreviewOuter] = useState<string | null>(null);
  const [previewResi, setPreviewResi] = useState<string | null>(null);
  const [previewInside, setPreviewInside] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // File Input Refs
  const inputOuterRef = useRef<HTMLInputElement>(null);
  const inputResiRef = useRef<HTMLInputElement>(null);
  const inputInsideRef = useRef<HTMLInputElement>(null);
  const inputVideoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReturnDetail();
  }, [id]);

  const fetchReturnDetail = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/returns?search=${encodeURIComponent(id)}`);
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        const item = json.data.find((r: ReturnData) => r.id === id || r.shopeeOrderSn === id);
        if (item) {
          setReturnData(item);
          if (item.technicianName) setTechnicianName(item.technicianName);
          if (item.claimNotes) setClaimNotes(item.claimNotes);
          if (item.photoOuterPath) setPreviewOuter(item.photoOuterPath);
          if (item.photoResiPath) setPreviewResi(item.photoResiPath);
          if (item.photoInsidePath) setPreviewInside(item.photoInsidePath);
          if (item.videoProofPath) setPreviewVideo(item.videoProofPath);
        } else {
          setErrorMsg("Data tiket retur tidak ditemukan.");
        }
      } else {
        setErrorMsg("Tiket klaim retur tidak terdaftar di workstation.");
      }
    } catch {
      setErrorMsg("Gagal terhubung ke workstation server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (
    type: "outer" | "resi" | "inside" | "video",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    if (type === "outer") {
      setPhotoOuter(file);
      setPreviewOuter(previewUrl);
    } else if (type === "resi") {
      setPhotoResi(file);
      setPreviewResi(previewUrl);
    } else if (type === "inside") {
      setPhotoInside(file);
      setPreviewInside(previewUrl);
    } else if (type === "video") {
      setVideoProof(file);
      setPreviewVideo(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnData) return;

    if (!photoOuter && !previewOuter && !photoResi && !previewResi) {
      alert("Harap ambil minimal Foto Kondisi Luar Paket dan Foto Label Resi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("returnId", returnData.id);
      if (technicianName) formData.append("technicianName", technicianName);
      if (claimNotes) formData.append("claimNotes", claimNotes);

      if (photoOuter) formData.append("photoOuter", photoOuter);
      if (photoResi) formData.append("photoResi", photoResi);
      if (photoInside) formData.append("photoInside", photoInside);
      if (videoProof) formData.append("videoProof", videoProof);

      const res = await fetch("/api/upload-retur", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(json.error || "Gagal mengunggah bukti klaim retur.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan upload.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-xs font-mono text-slate-400">Menghubungkan ke Workstation Retur...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-5 text-center">
        <div className="tech-panel-3d rounded-3xl p-6 max-w-sm w-full border border-emerald-500/40 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Bukti Retur Tersimpan!
            </h2>
            <p className="text-xs font-mono text-emerald-400 mt-1">
              {returnData?.shopeeOrderSn}
            </p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Foto fisik dan video telah masuk ke server toko & siap diajukan ke Shopee.
          </p>
          <button
            onClick={() => {
              setIsSuccess(false);
              fetchReturnDetail();
            }}
            className="btn-3d-dark px-5 py-2.5 rounded-xl text-xs font-bold text-slate-200 mt-2"
          >
            Kembali / Edit Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 pb-12 flex flex-col items-center">
      <div className="max-w-md w-full flex flex-col gap-4">
        {/* Header HUD */}
        <div className="tech-panel-3d rounded-2xl p-4 border border-cyan-500/40">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              Workstation Mobile Capture
            </span>
            <span className="bg-amber-950/80 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
              {returnData?.returnReason === "GAGAL_KIRIM_RTS" ? "Gagal Kirim (RTS)" : "Komplain Pembeli"}
            </span>
          </div>

          <h1 className="text-base font-mono font-bold text-white">
            {returnData?.shopeeOrderSn}
          </h1>

          <div className="mt-2 text-xs text-slate-300 flex flex-col gap-1">
            {returnData?.returnTrackingNumber && (
              <div className="font-mono text-[11px] text-slate-400">
                Resi Retur: <strong className="text-cyan-300">{returnData.returnTrackingNumber}</strong>
              </div>
            )}
            {returnData?.buyerUsername && (
              <div className="text-[11px] text-slate-400">
                Pembeli: <strong className="text-slate-200">@{returnData.buyerUsername}</strong>
              </div>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Slot 1: Foto Kondisi Luar Paket */}
          <div className="tech-card-3d rounded-2xl p-3.5 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-cyan-400" />
                1. Foto Fisik Paket Tiba <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500">Kardus / Lakban Luar</span>
            </div>

            <input
              ref={inputOuterRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileChange("outer", e)}
            />

            {previewOuter ? (
              <div className="relative rounded-xl overflow-hidden aspect-video border border-cyan-500/40 bg-black">
                <img src={previewOuter} alt="Luar Paket" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => inputOuterRef.current?.click()}
                  className="absolute bottom-2 right-2 btn-3d-dark px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur"
                >
                  Ganti Foto
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputOuterRef.current?.click()}
                className="h-28 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-cyan-500/50 transition-colors bg-slate-950/40"
              >
                <Camera className="w-6 h-6 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-300">Jepret Foto Luar Paket</span>
              </button>
            )}
          </div>

          {/* Slot 2: Foto Label Resi Retur */}
          <div className="tech-card-3d rounded-2xl p-3.5 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                2. Foto Label Resi Retur <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500">Barcode Jelas</span>
            </div>

            <input
              ref={inputResiRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileChange("resi", e)}
            />

            {previewResi ? (
              <div className="relative rounded-xl overflow-hidden aspect-video border border-cyan-500/40 bg-black">
                <img src={previewResi} alt="Resi Retur" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => inputResiRef.current?.click()}
                  className="absolute bottom-2 right-2 btn-3d-dark px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur"
                >
                  Ganti Foto
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputResiRef.current?.click()}
                className="h-28 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-cyan-500/50 transition-colors bg-slate-950/40"
              >
                <Camera className="w-6 h-6 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-300">Jepret Label Resi</span>
              </button>
            )}
          </div>

          {/* Slot 3: Foto Isi Paket Terbuka */}
          <div className="tech-card-3d rounded-2xl p-3.5 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Box className="w-4 h-4 text-amber-400" />
                3. Foto Isi Paket Terbuka
              </label>
              <span className="text-[10px] text-slate-500">Kondisi Barang di Dalam</span>
            </div>

            <input
              ref={inputInsideRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileChange("inside", e)}
            />

            {previewInside ? (
              <div className="relative rounded-xl overflow-hidden aspect-video border border-amber-500/40 bg-black">
                <img src={previewInside} alt="Isi Paket" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => inputInsideRef.current?.click()}
                  className="absolute bottom-2 right-2 btn-3d-dark px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur"
                >
                  Ganti Foto
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputInsideRef.current?.click()}
                className="h-28 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-amber-500/50 transition-colors bg-slate-950/40"
              >
                <Camera className="w-6 h-6 text-amber-400" />
                <span className="text-xs font-semibold text-slate-300">Jepret Isi Barang Terbuka</span>
              </button>
            )}
          </div>

          {/* Slot 4: Video Bukti Kerusakan / Unboxing (Opsional) */}
          <div className="tech-card-3d rounded-2xl p-3.5 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-emerald-400" />
                4. Video Bukti Kerusakan / Patah
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold">Opsional (1-2 Mnt)</span>
            </div>

            <input
              ref={inputVideoRef}
              type="file"
              accept="video/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileChange("video", e)}
            />

            {previewVideo ? (
              <div className="relative rounded-xl overflow-hidden aspect-video border border-emerald-500/40 bg-black">
                <video src={previewVideo} controls className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => inputVideoRef.current?.click()}
                  className="absolute bottom-2 right-2 btn-3d-dark px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur"
                >
                  Ganti Video
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputVideoRef.current?.click()}
                className="h-24 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-emerald-500/50 transition-colors bg-slate-950/40"
              >
                <Video className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">Rekam Video Unit Rusak</span>
              </button>
            )}
          </div>

          {/* Teknisi & Catatan */}
          <div className="tech-card-3d rounded-2xl p-3.5 border border-slate-800 flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Teknisi Pemeriksa
              </label>
              <input
                type="text"
                placeholder="Nama Anda..."
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300 font-semibold">
                Catatan Kondisi Barang / Alasan Klaim:
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Casing penyok di pojok kiri, panel kaca tempered pecah saat pengiriman..."
                value={claimNotes}
                onChange={(e) => setClaimNotes(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-3d-cyan w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengunggah Bukti ke Server...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Kirim Bukti Retur ke Workstation</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}