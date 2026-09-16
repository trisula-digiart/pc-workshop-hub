"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileText,
  Download,
  Copy,
  Check,
  QrCode,
  Trash2,
  Search,
  Wifi,
  Globe,
  HardDrive,
  Cpu,
  FileCode,
  FileArchive,
  Film,
  Image as ImageIcon,
  File as FileIcon,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FolderOpen
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface SharedFileItem {
  id: string;
  filename: string;
  storedName: string;
  filePath: string;
  fileSize: number;
  mimeType: string | null;
  category: "SOFTWARE" | "DRIVER" | "DOCUMENT" | "OTHER" | string;
  description: string | null;
  downloadCount: number;
  uploader: string | null;
  createdAt: string;
}

interface NetworkInfo {
  lanIp: string;
  tailscaleIp: string | null;
  localIp: string;
}

export function FileTransferHub() {
  const [files, setFiles] = useState<SharedFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Network State
  const [network, setNetwork] = useState<NetworkInfo>({
    lanIp: "localhost",
    tailscaleIp: null,
    localIp: "localhost",
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("SOFTWARE");
  const [description, setDescription] = useState("");
  const [uploader, setUploader] = useState("Workstation LAN");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // QR Modal State
  const [activeQrFile, setActiveQrFile] = useState<SharedFileItem | null>(null);
  const [qrType, setQrType] = useState<"LAN" | "TAILSCALE">("LAN");

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchNetworkInfo();
    fetchFiles();
  }, []);

  const fetchNetworkInfo = async () => {
    try {
      const res = await fetch("/api/network");
      const data = await res.json();
      if (data.success) {
        setNetwork({
          lanIp: data.lanIp || "localhost",
          tailscaleIp: data.tailscaleIp || null,
          localIp: data.localIp || "localhost",
        });
      }
    } catch (err) {
      console.error("Gagal mengambil info jaringan:", err);
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error("Gagal memuat file:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Pilih file yang ingin diunggah terlebih dahulu.");
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("uploader", uploader);

      // Simulasi progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 200);

      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`File "${selectedFile.name}" berhasil diunggah!`);
        setSelectedFile(null);
        setDescription("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchFiles();
      } else {
        setErrorMsg(data.error || "Gagal mengunggah file.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat unggah file.");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDeleteFile = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("File berhasil dihapus.");
        fetchFiles();
      } else {
        setErrorMsg(data.error || "Gagal menghapus file.");
      }
    } catch (err) {
      setErrorMsg("Gagal terhubung ke server untuk menghapus.");
    } finally {
      setDeletingId(null);
    }
  };

  const getDownloadUrl = (fileId: string, type: "LAN" | "TAILSCALE" | "RELATIVE") => {
    const port = typeof window !== "undefined" ? window.location.port || "3007" : "3007";
    const downloadPath = `/api/files/download/${fileId}`;

    if (type === "RELATIVE") return downloadPath;
    if (type === "LAN") {
      const host = network.lanIp !== "localhost" ? network.lanIp : (typeof window !== "undefined" ? window.location.hostname : "localhost");
      return `http://${host}:${port}${downloadPath}`;
    }
    if (type === "TAILSCALE") {
      const host = network.tailscaleIp || network.lanIp;
      return `http://${host}:${port}${downloadPath}`;
    }
    return downloadPath;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (filename: string, category: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (["exe", "msi", "bat", "cmd", "apk"].includes(ext)) {
      return <Cpu className="w-6 h-6 text-cyan-400" />;
    }
    if (["zip", "rar", "7z", "tar", "gz", "iso"].includes(ext)) {
      return <FileArchive className="w-6 h-6 text-amber-400" />;
    }
    if (["mp4", "mkv", "avi", "mov", "webm"].includes(ext)) {
      return <Film className="w-6 h-6 text-rose-400" />;
    }
    if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
      return <ImageIcon className="w-6 h-6 text-emerald-400" />;
    }
    if (["js", "ts", "json", "html", "css", "py", "sh"].includes(ext)) {
      return <FileCode className="w-6 h-6 text-indigo-400" />;
    }
    if (category === "DRIVER") return <HardDrive className="w-6 h-6 text-violet-400" />;
    return <FileIcon className="w-6 h-6 text-slate-400" />;
  };

  // Filtered files
  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.uploader && f.uploader.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "ALL" || f.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalStorage = files.reduce((acc, f) => acc + f.fileSize, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner: Network & Tailscale Connection Hub */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 lg:p-5 backdrop-blur-md relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-slate-950 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  File Transfer Hub
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LAN &amp; Tailscale Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kirim &amp; bagikan file installer aplikasi, driver, dan dokumen antar PC workshop di jaringan lokal maupun via Tailscale VPN.
              </p>
            </div>
          </div>

          {/* Network Badges */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* LAN Badge */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs flex-1 sm:flex-initial">
              <div className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400 font-mono text-[11px]">LAN IP:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {network.lanIp}:3007
                </span>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    `http://${network.lanIp}:3007`,
                    "lan-badge"
                  )
                }
                title="Salin URL LAN"
                className="text-slate-400 hover:text-cyan-400 transition-colors p-1 rounded hover:bg-slate-800"
              >
                {copiedId === "lan-badge" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Tailscale Badge */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs flex-1 sm:flex-initial">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-400 font-mono text-[11px]">Tailscale:</span>
                <span className="font-mono font-bold text-indigo-300">
                  {network.tailscaleIp ? `${network.tailscaleIp}:3007` : "Tidak Terdeteksi"}
                </span>
              </div>
              {network.tailscaleIp && (
                <button
                  onClick={() =>
                    copyToClipboard(
                      `http://${network.tailscaleIp}:3007`,
                      "tailscale-badge"
                    )
                  }
                  title="Salin URL Tailscale"
                  className="text-slate-400 hover:text-indigo-400 transition-colors p-1 rounded hover:bg-slate-800"
                >
                  {copiedId === "tailscale-badge" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Upload Zone (Left) & File Repository (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form Section (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-cyan-400" />
                Unggah File Baru
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Max: Auto Storage</span>
            </div>

            {/* Notifications */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              {/* Drag and Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? "border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                    : selectedFile
                    ? "border-emerald-500/50 bg-emerald-950/20"
                    : "border-slate-800 hover:border-cyan-500/40 hover:bg-slate-950/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-1">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      {getFileIcon(selectedFile.name, category)}
                    </div>
                    <p className="text-xs font-semibold text-white truncate max-w-[240px] mx-auto">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-mono">
                      {formatBytes(selectedFile.size)}
                    </p>
                    <p className="text-[10px] text-slate-400">Klik untuk mengganti file</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
                      <UploadCloud className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        Tarik &amp; Taruh file di sini
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Atau klik untuk menjelajah file (.exe, .zip, .rar, .iso, .pdf)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Mengunggah file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Category Options */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 font-mono">
                  Kategori File
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "SOFTWARE", label: "Aplikasi / Installer", icon: Cpu },
                    { id: "DRIVER", label: "Driver & Firmware", icon: HardDrive },
                    { id: "DOCUMENT", label: "Dokumen / Skema", icon: FileText },
                    { id: "OTHER", label: "Lainnya", icon: FileIcon },
                  ].map((cat) => {
                    const IconComp = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all text-left ${
                          category === cat.id
                            ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Uploader Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 font-mono">
                  Nama Pengunggah / Workstation
                </label>
                <input
                  type="text"
                  value={uploader}
                  onChange={(e) => setUploader(e.target.value)}
                  placeholder="Contoh: PC Main Workshop"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Description / Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 font-mono">
                  Catatan / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan singkat file (misal: Software QC Photoshop 2024)..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  uploading || !selectedFile
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    : "btn-3d-cyan text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                }`}
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Proses Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Unggah &amp; Bagikan File</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* File Repository / Explorer Section (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            {/* Header & Stats */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  Daftar File Tersedia
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total File: <span className="text-cyan-300 font-bold font-mono">{files.length}</span> | Ukuran Total: <span className="text-cyan-300 font-bold font-mono">{formatBytes(totalStorage)}</span>
                </p>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchFiles}
                title="Refresh Daftar File"
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Filter Pills & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto w-full sm:w-auto">
                {[
                  { id: "ALL", label: "Semua" },
                  { id: "SOFTWARE", label: "Aplikasi" },
                  { id: "DRIVER", label: "Driver" },
                  { id: "DOCUMENT", label: "Dokumen" },
                  { id: "OTHER", label: "Lainnya" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setSelectedCategory(pill.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === pill.id
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari file..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* File List Grid */}
            {loading ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
                <p className="text-xs font-mono">Memuat daftar file shared...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-2">
                <FolderOpen className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold text-slate-400">
                  {searchQuery || selectedCategory !== "ALL"
                    ? "Tidak ada file yang sesuai dengan filter pencarian."
                    : "Belum ada file yang diunggah."}
                </p>
                <p className="text-xs text-slate-600">
                  Gunakan form di sebelah kiri untuk mengunggah dan membagikan file pertama.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-[620px] overflow-y-auto pr-1">
                {filteredFiles.map((file) => {
                  const lanUrl = getDownloadUrl(file.id, "LAN");
                  const tailscaleUrl = getDownloadUrl(file.id, "TAILSCALE");
                  const relativeUrl = getDownloadUrl(file.id, "RELATIVE");

                  return (
                    <div
                      key={file.id}
                      className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-2xl hover:border-cyan-500/40 transition-all duration-200 group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* Left File Information */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-cyan-500/40 text-slate-300 transition-colors shrink-0">
                          {getFileIcon(file.filename, file.category)}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-white truncate max-w-[280px] sm:max-w-[360px]" title={file.filename}>
                              {file.filename}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-mono">
                              {file.category}
                            </span>
                          </div>

                          {file.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {file.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono flex-wrap">
                            <span>{formatBytes(file.fileSize)}</span>
                            <span>•</span>
                            <span>Upload: {new Date(file.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</span>
                            <span>•</span>
                            <span>Oleh: <strong className="text-slate-400">{file.uploader || "Workstation"}</strong></span>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">{file.downloadCount}x Didownload</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                        {/* Direct Download Button */}
                        <a
                          href={relativeUrl}
                          download
                          title="Download Langsung"
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh</span>
                        </a>

                        {/* Copy LAN Link Button */}
                        <button
                          onClick={() => copyToClipboard(lanUrl, `lan-${file.id}`)}
                          title={`Salin Link LAN: ${lanUrl}`}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors flex items-center gap-1 text-xs"
                        >
                          {copiedId === `lan-${file.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden xl:inline text-[11px] font-mono">LAN</span>
                        </button>

                        {/* Copy Tailscale Link Button */}
                        {network.tailscaleIp && (
                          <button
                            onClick={() => copyToClipboard(tailscaleUrl, `ts-${file.id}`)}
                            title={`Salin Link Tailscale: ${tailscaleUrl}`}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 transition-colors flex items-center gap-1 text-xs"
                          >
                            {copiedId === `ts-${file.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Globe className="w-3.5 h-3.5 text-indigo-400" />
                            )}
                            <span className="hidden xl:inline text-[11px] font-mono">TS</span>
                          </button>
                        )}

                        {/* QR Code Modal Button */}
                        <button
                          onClick={() => {
                            setActiveQrFile(file);
                            setQrType("LAN");
                          }}
                          title="Generate QR Code Download"
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          disabled={deletingId === file.id}
                          title="Hapus File"
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                        >
                          {deletingId === file.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal QR Code Download */}
      {activeQrFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative space-y-4 text-center">
            {/* Close Button */}
            <button
              onClick={() => setActiveQrFile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono font-bold">
                QR CODE DOWNLOAD
              </span>
              <h3 className="text-sm font-bold text-white truncate max-w-[260px] mx-auto" title={activeQrFile.filename}>
                {activeQrFile.filename}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Scan dengan Kamera HP / Tablet untuk langsung mengunduh
              </p>
            </div>

            {/* QR Network Selector Switch */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setQrType("LAN")}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                  qrType === "LAN"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                LAN Link
              </button>
              {network.tailscaleIp && (
                <button
                  onClick={() => setQrType("TAILSCALE")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                    qrType === "TAILSCALE"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.15)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Tailscale
                </button>
              )}
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white rounded-2xl mx-auto w-fit shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <QRCodeSVG
                value={getDownloadUrl(activeQrFile.id, qrType)}
                size={190}
                level="M"
              />
            </div>

            {/* URL Display & Copy */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Target URL ({qrType})
              </p>
              <p className="text-[11px] font-mono text-cyan-300 break-all">
                {getDownloadUrl(activeQrFile.id, qrType)}
              </p>
              <button
                onClick={() =>
                  copyToClipboard(
                    getDownloadUrl(activeQrFile.id, qrType),
                    "modal-qr-copy"
                  )
                }
                className="w-full py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedId === "modal-qr-copy" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin URL Download</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
