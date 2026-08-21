"use client";

import React, { useState } from "react";
import { X, Plus, Cpu, User, Truck, Tag, Wrench, Loader2, AlertCircle } from "lucide-react";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const [shopeeOrderSn, setShopeeOrderSn] = useState("");
  const [buyerUsername, setBuyerUsername] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("");
  const [productName, setProductName] = useState("");
  const [variantName, setVariantName] = useState("");
  const [qty, setQty] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("NON_COD");
  const [technicianName, setTechnicianName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!shopeeOrderSn.trim()) {
      setErrorMsg("Nomor Pesanan Shopee wajib diisi.");
      return;
    }
    if (!productName.trim()) {
      setErrorMsg("Nama produk / spesifikasi rakitan PC wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    // Format rincian produk sesuai standar sistem
    const cleanQty = qty.trim() ? qty.trim() : "1";
    const formattedDetails = variantName.trim()
      ? `• ${productName.trim()}\n▶ Varian: ${variantName.trim()} (x${cleanQty})`
      : `• ${productName.trim()} (x${cleanQty})`;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopeeOrderSn: shopeeOrderSn.trim(),
          buyerUsername: buyerUsername.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
          courier: courier.trim() || undefined,
          paymentMethod,
          productDetails: formattedDetails,
          technicianName: technicianName.trim() || undefined,
          status: "NEW",
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        // Reset state
        setShopeeOrderSn("");
        setBuyerUsername("");
        setTrackingNumber("");
        setCourier("");
        setPaymentMethod("NON_COD");
        setProductName("");
        setVariantName("");
        setQty("1");
        setTechnicianName("");
        onOrderCreated();
        onClose();
      } else {
        setErrorMsg(json.error || "Gagal menambahkan pesanan.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="tech-panel-3d rounded-2xl max-w-lg w-full p-5 sm:p-6 relative flex flex-col gap-4 border border-cyan-500/40 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/40">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Tambah Pesanan Manual
              </h2>
              <p className="text-[11px] text-slate-400">
                Input langsung 1 pesanan baru tanpa export file Shopee
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
          {/* Baris 1: No. Pesanan & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                No. Pesanan Shopee <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 260818N4MPK6RR"
                value={shopeeOrderSn}
                onChange={(e) => setShopeeOrderSn(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                Username Pembeli
              </label>
              <input
                type="text"
                placeholder="Contoh: mrkstoreku"
                value={buyerUsername}
                onChange={(e) => setBuyerUsername(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Baris 2: No. Resi & Kurir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                No. Resi (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: SPXID04423091000"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300 font-semibold">Jasa Kirim / Opsi Pengiriman</label>
              <input
                type="text"
                placeholder="Contoh: Hemat Kargo - SPX / J&T"
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Baris 3: Nama Produk */}
          <div className="flex flex-col gap-1">
            <label className="text-slate-300 font-semibold">
              Nama Produk / Spek Rakitan PC <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="Contoh: PAKET KOMPUTER FULLSET Core i5 Ram 16GB SSD 256GB Monitor 19 Inch"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Baris 4: Varian & Qty */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                Nama Variasi (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Core i5/Ram 16GB/LCD 19"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300 font-semibold">Jumlah (Qty)</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none text-center font-mono"
              />
            </div>
          </div>

          {/* Baris 5: Metode Pembayaran & Teknisi PIC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                Metode Pembayaran <span className="text-rose-400">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
              >
                <option value="NON_COD">Non-COD (Transfer / SpayLater / Bank)</option>
                <option value="COD">COD (Bayar di Tempat - Cek Pembeli)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                Teknisi PIC (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Rian / Doni"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-3d-dark px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-3d-cyan px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Tambah ke Antrean</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};