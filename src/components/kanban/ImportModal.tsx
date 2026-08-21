"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg("Pilih file Excel / CSV Shopee terlebih dahulu.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/orders", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setSuccessMsg(json.message || "Data pesanan Shopee berhasil diimport.");
        setTimeout(() => {
          onImportSuccess();
        }, 1200);
      } else {
        setErrorMsg(json.error || "Gagal memproses file import.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan koneksi saat upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="tech-panel-3d rounded-2xl max-w-md w-full p-6 relative flex flex-col gap-4 border border-cyan-500/40">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Import Pesanan Shopee
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="h-36 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 bg-slate-950/50 cursor-pointer transition-colors p-4 text-center"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Upload className="w-7 h-7 text-cyan-400" />
          {file ? (
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-100 truncate max-w-[280px]">
                {file.name}
              </span>
              <span className="text-[10px] text-cyan-400">
                {(file.size / 1024).toFixed(1)} KB — Klik untuk ganti
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-300">
                Pilih atau Tarik File Excel / CSV Shopee
              </span>
              <span className="text-[10px] text-slate-500">
                Format laporan pesanan massal dari Shopee Seller Centre
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="btn-3d-dark px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="btn-3d-cyan px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 disabled:opacity-40"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload &amp; Sync</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};