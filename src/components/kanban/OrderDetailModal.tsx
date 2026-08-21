"use client";

import React from "react";
import { X, Cpu, Truck, User, Calendar, QrCode, Play, Tag } from "lucide-react";
import { OrderData } from "./OrderCard3D";

interface OrderDetailModalProps {
  order: OrderData | null;
  onClose: () => void;
  onOpenQR: (order: OrderData) => void;
  onPlayVideo: (videoPath: string, orderSn: string) => void;
}

function parseProductAndVariant(rawText: string) {
  let title = rawText.replace(/^[•\s]+/, "");
  let variant: string | null = null;
  let qty: string | null = null;

  if (title.includes("▶ Varian:")) {
    const parts = title.split("▶ Varian:");
    title = parts[0].trim();
    variant = parts[1].trim();
  } else {
    const bracketMatch = title.match(/\[(.*?)\](?:\s*\((.*?)\))?/);
    if (bracketMatch) {
      variant = bracketMatch[1].trim();
      qty = bracketMatch[2] ? `(${bracketMatch[2].trim()})` : null;
      title = title.replace(bracketMatch[0], "").trim();
      if (qty && !variant.includes("(x")) {
        variant = `${variant} ${qty}`;
      }
    }
  }

  return { title, variant };
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onOpenQR,
  onPlayVideo,
}) => {
  if (!order) return null;

  const productBlocks = order.productDetails.split(/\n\n|• /).filter((b) => b.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="tech-panel-3d rounded-2xl max-w-lg w-full p-6 relative flex flex-col gap-5 border border-cyan-500/40 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              Detail Order Workstation
            </span>
            <h2 className="text-lg font-mono font-bold text-white flex items-center gap-2 mt-0.5">
              <Cpu className="w-5 h-5 text-cyan-400" />
              {order.shopeeOrderSn}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-cyan-400" /> Pembeli:
            </span>
            <strong className="text-slate-200 truncate">
              {order.buyerUsername ? `@${order.buyerUsername}` : "Anonim"}
            </strong>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-cyan-400" /> Resi / Kurir:
            </span>
            <strong className="text-slate-200 font-mono truncate">
              {order.trackingNumber || "Belum ada resi"}
            </strong>
            <span className="text-[10px] text-slate-500 truncate">
              {order.courier || "Standar Shopee"}
            </span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="text-slate-400 text-[11px]">Teknisi PIC:</span>
            <strong className="text-cyan-300">
              {order.technicianName || "Belum di-assign"}
            </strong>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Tanggal Masuk:
            </span>
            <span className="text-slate-300 text-[11px]">
              {new Date(order.createdAt).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        </div>

        {/* Product Spec & Variant List */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-300">
            Rincian Barang &amp; Pilihan Varian:
          </label>
          <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 max-h-48 overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed space-y-2.5 select-text">
            {productBlocks.map((block, idx) => {
              const { title, variant } = parseProductAndVariant(block);
              return (
                <div key={idx} className="flex flex-col gap-1.5 border-b border-slate-900 last:border-0 pb-2 last:pb-0">
                  <span>• {title}</span>
                  {variant && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/50 rounded-md px-2.5 py-1 w-fit shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                      <Tag className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Varian: {variant}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              onOpenQR(order);
            }}
            className="btn-3d-cyan px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Upload QC</span>
          </button>
          {order.qcVideoPath && (
            <button
              onClick={() => {
                onClose();
                onPlayVideo(order.qcVideoPath!, order.shopeeOrderSn);
              }}
              className="btn-3d-emerald px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Putar Video QC</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};