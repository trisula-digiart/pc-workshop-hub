"use client";

import React, { useState } from "react";
import { 
  Cpu, 
  QrCode, 
  Play, 
  User, 
  Truck, 
  ChevronRight, 
  ChevronLeft,
  Trash2,
  Maximize2,
  Tag,
  AlertTriangle,
  CreditCard
} from "lucide-react";

export interface OrderData {
  id: string;
  shopeeOrderSn: string;
  trackingNumber?: string | null;
  buyerUsername?: string | null;
  productDetails: string;
  courier?: string | null;
  paymentMethod?: string | null;
  status: string;
  technicianName?: string | null;
  qcVideoPath?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface OrderCard3DProps {
  order: OrderData;
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
  onUpdateTechnician: (orderId: string, name: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onOpenQR: (order: OrderData) => void;
  onPlayVideo: (videoPath: string, orderSn: string) => void;
  onSelectOrder?: (order: OrderData) => void;
  isCompactMode?: boolean;
}

const STATUS_ORDER = ["NEW", "IN_PROGRESS", "QC_TESTING", "PACKING", "COMPLETED"];

// Helper untuk mengekstrak Nama Produk dan Varian secara universal
function parseProductAndVariant(rawText: string) {
  let title = rawText.replace(/^[•\s]+/, "");
  let variant: string | null = null;
  let qty: string | null = null;

  if (title.includes("▶ Varian:")) {
    const parts = title.split("▶ Varian:");
    title = parts[0].trim();
    variant = parts[1].trim();
  } else {
    // Regex deteksi format kurung siku [varian] (xQty)
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

export const OrderCard3D: React.FC<OrderCard3DProps> = ({
  order,
  onUpdateStatus,
  onUpdateTechnician,
  onDeleteOrder,
  onOpenQR,
  onPlayVideo,
  onSelectOrder,
  isCompactMode = false,
}) => {
  const [techName, setTechName] = useState(order.technicianName || "");
  const [isEditingTech, setIsEditingTech] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentIndex = STATUS_ORDER.indexOf(order.status);

  // Kalkulasi Overdue (> 24 Jam sejak ditambahkan)
  const createdTime = new Date(order.createdAt).getTime();
  const hoursDiff = (Date.now() - createdTime) / (1000 * 60 * 60);
  const isOverdue = hoursDiff >= 24 && order.status !== "COMPLETED" && order.status !== "ARCHIVED";
  const isCOD = order.paymentMethod === "COD";

  const handleNextStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < STATUS_ORDER.length - 1 && !isUpdating) {
      setIsUpdating(true);
      await onUpdateStatus(order.id, STATUS_ORDER[currentIndex + 1]);
      setIsUpdating(false);
    }
  };

  const handlePrevStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0 && !isUpdating) {
      setIsUpdating(true);
      await onUpdateStatus(order.id, STATUS_ORDER[currentIndex - 1]);
      setIsUpdating(false);
    }
  };

  const handleSaveTechnician = async () => {
    setIsEditingTech(false);
    if (techName !== (order.technicianName || "")) {
      await onUpdateTechnician(order.id, techName);
    }
  };

  const productBlocks = order.productDetails.split(/\n\n|• /).filter((b) => b.trim().length > 0);

  // Dynamic Card Border & Background styling
  let cardStyle = "tech-card-3d rounded-xl p-3 flex flex-col gap-2.5 relative cursor-pointer transition-all select-none w-full";
  if (isOverdue) {
    cardStyle += " border-2 border-rose-500/90 bg-rose-950/30 shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:border-rose-400";
  } else if (isCOD) {
    cardStyle += " border-2 border-amber-500/90 bg-amber-950/30 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:border-amber-400";
  } else {
    cardStyle += " hover:border-cyan-400/60";
  }

  return (
    <div 
      onClick={() => onSelectOrder && onSelectOrder(order)}
      className={cardStyle}
    >
      {/* Header: Shopee SN, Badges & Actions */}
      <div className="flex items-center justify-between gap-1 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <Cpu className={`w-4 h-4 flex-shrink-0 ${isOverdue ? "text-rose-400" : isCOD ? "text-amber-400" : "text-cyan-400"}`} />
          <span className={`font-mono text-xs font-bold truncate ${isOverdue ? "text-rose-300" : isCOD ? "text-amber-300" : "text-cyan-300"}`}>
            {order.shopeeOrderSn}
          </span>
          {isOverdue && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/60 animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" /> Overdue &gt;1 Hari
            </span>
          )}
          {isCOD && !isOverdue && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/60 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-amber-400" /> COD (Cek Pembeli)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectOrder) onSelectOrder(order);
            }}
            className="text-slate-400 hover:text-cyan-300 p-1 rounded bg-slate-950/60 hover:bg-slate-900 transition-colors"
            title="Buka Detail Lengkap"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Hapus order ${order.shopeeOrderSn}?`)) {
                onDeleteOrder(order.id);
              }
            }}
            className="text-slate-400 hover:text-rose-400 p-1 rounded bg-slate-950/60 hover:bg-slate-900 transition-colors"
            title="Hapus Order"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Buyer & Tracking Info */}
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold truncate">
            <User className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="truncate">{order.buyerUsername ? `@${order.buyerUsername}` : "Shopee Buyer"}</span>
          </div>
          {isCompactMode && (
            <span className="text-[10px] font-mono text-cyan-400 hover:underline flex-shrink-0">
              Detail &raquo;
            </span>
          )}
        </div>

        {order.trackingNumber && (
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 truncate">
            <Truck className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="truncate">{order.trackingNumber} ({order.courier || "Ekspedisi"})</span>
          </div>
        )}
      </div>

      {/* Product & Variant Box (Tampil jika Mode Detail saja) */}
      {!isCompactMode && (
        <div className="bg-slate-950/90 rounded-lg p-2.5 border border-slate-800/90 text-xs font-mono leading-relaxed space-y-2">
          {productBlocks.map((block, idx) => {
            const { title, variant } = parseProductAndVariant(block);
            return (
              <div key={idx} className="flex flex-col gap-1.5 border-b border-slate-900 last:border-0 pb-1.5 last:pb-0">
                <span className="text-slate-200 line-clamp-2">{title}</span>
                {variant && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/50 rounded-md px-2 py-1 w-fit shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                    <Tag className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span>Varian: {variant}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Technician Assignment */}
      <div 
        className="flex items-center justify-between gap-1 text-xs pt-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-slate-400 text-[11px]">Teknisi PIC:</span>
        {isEditingTech ? (
          <input
            type="text"
            value={techName}
            onChange={(e) => setTechName(e.target.value)}
            onBlur={handleSaveTechnician}
            onKeyDown={(e) => e.key === "Enter" && handleSaveTechnician()}
            autoFocus
            placeholder="Ketik nama..."
            className="bg-slate-900 border border-cyan-500 rounded px-2 py-0.5 text-xs text-cyan-200 outline-none w-28"
          />
        ) : (
          <button
            onClick={() => setIsEditingTech(true)}
            className="text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 hover:border-cyan-400 rounded px-2.5 py-0.5 transition-colors"
          >
            {order.technicianName || "+ Set PIC"}
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onOpenQR(order)}
          className="btn-3d-cyan text-white text-xs font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Scan HP</span>
        </button>

        {order.qcVideoPath ? (
          <button
            onClick={() => onPlayVideo(order.qcVideoPath!, order.shopeeOrderSn)}
            className="btn-3d-emerald text-white text-xs font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Video QC</span>
          </button>
        ) : (
          <div className="flex items-center justify-center text-[10px] text-slate-500 bg-slate-950/40 border border-dashed border-slate-800 rounded-lg">
            Belum Ada Video
          </div>
        )}
      </div>

      {/* Status Phase Navigator */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 mt-0.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handlePrevStatus}
          disabled={currentIndex === 0 || isUpdating}
          className="p-1 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
          title="Fase Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Fase {currentIndex + 1} / {STATUS_ORDER.length}
        </span>

        <button
          onClick={handleNextStatus}
          disabled={currentIndex === STATUS_ORDER.length - 1 || isUpdating}
          className="p-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
          title="Fase Berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};