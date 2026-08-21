"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResult({ success: true, message: data.message });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setResult({ success: false, message: data.error || "Gagal mengimpor file." });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Terjadi kesalahan jaringan." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="btn-3d-dark px-4 py-2 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Kanban</span>
        </Link>
        <span className="text-xs font-mono text-cyan-400">DATA_SYNC_MODULE // V1.0</span>
      </div>

      <div className="tech-panel-3d rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
            Import Pesanan Shopee Seller Centre
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Unggah file export pesanan (.xlsx atau .csv) dari Shopee. Sistem akan otomatis melakukan parsing dan update antrean workstation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
              file
                ? "border-cyan-500/80 bg-cyan-950/20"
                : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <UploadCloud className={`w-12 h-12 ${file ? "text-cyan-400" : "text-slate-600"}`} />
            <div className="text-center">
              {file ? (
                <div>
                  <p className="text-sm font-bold text-cyan-300">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB — Klik untuk ganti file
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-slate-300">
                    Klik atau Drag file Shopee ke area ini
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Format yang didukung: .XLSX, .XLS, .CSV</p>
                </div>
              )}
            </div>
          </div>

          {result && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 border ${
                result.success
                  ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                  : "bg-rose-950/40 border-rose-500/50 text-rose-300"
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-xs leading-relaxed">{result.message}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!file || isUploading}
              className="btn-3d-cyan px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Data...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Sinkronisasi ke Workstation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}