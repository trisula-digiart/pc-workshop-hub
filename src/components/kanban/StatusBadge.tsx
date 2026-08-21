"use client";

import React from "react";
import { Layers, Wrench, Video, Package, CheckCircle2 } from "lucide-react";

export type OrderStatusKey = "NEW" | "IN_PROGRESS" | "QC_TESTING" | "PACKING" | "COMPLETED";

interface StatusBadgeProps {
  status: OrderStatusKey | string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; colorClass: string; dotClass: string }
> = {
  NEW: {
    label: "Antrean Baru",
    icon: Layers,
    colorClass: "bg-sky-950/60 border-sky-500/50 text-sky-300 shadow-[0_0_10px_rgba(14,165,233,0.15)]",
    dotClass: "bg-sky-400",
  },
  IN_PROGRESS: {
    label: "Rakit / Servis",
    icon: Wrench,
    colorClass: "bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]",
    dotClass: "bg-amber-400",
  },
  QC_TESTING: {
    label: "Pengetesan QC",
    icon: Video,
    colorClass: "bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]",
    dotClass: "bg-cyan-400 animate-pulse",
  },
  PACKING: {
    label: "Packing Kardus",
    icon: Package,
    colorClass: "bg-indigo-950/60 border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]",
    dotClass: "bg-indigo-400",
  },
  COMPLETED: {
    label: "Siap Kirim",
    icon: CheckCircle2,
    colorClass: "bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    dotClass: "bg-emerald-400",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  showIcon = true,
}) => {
  const current = STATUS_CONFIG[status] || {
    label: status,
    icon: Layers,
    colorClass: "bg-slate-900 border-slate-700 text-slate-300",
    dotClass: "bg-slate-400",
  };

  const IconComponent = current.icon;
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold rounded-full border transition-all ${
        current.colorClass
      } ${isSmall ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dotClass}`} />
      {showIcon && <IconComponent className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      <span className="tracking-wide uppercase">{current.label}</span>
    </span>
  );
};