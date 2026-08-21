"use client";

import React, { useState } from "react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { ReturnClaimHub } from "@/components/returns/ReturnClaimHub";
import { ArchiveHub } from "@/components/archive/ArchiveHub";
import { ImportModal } from "@/components/kanban/ImportModal";
import { LayoutGrid, PackageX, FileSpreadsheet, Layers, Archive } from "lucide-react";

export default function WorkstationPage() {
  const [activeTab, setActiveTab] = useState<"KANBAN" | "RETURNS" | "ARCHIVE">("KANBAN");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Main Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-3">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
          {/* Logo & Hub Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.35)]">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase text-white font-mono flex items-center gap-2">
                PC Workshop Hub
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                  v2.0
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">
                Workstation, QC Video &amp; Claim Management
              </p>
            </div>
          </div>

          {/* Tab Matrix Switcher & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab("KANBAN")}
                className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                  activeTab === "KANBAN"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban Antrean</span>
              </button>

              <button
                onClick={() => setActiveTab("RETURNS")}
                className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                  activeTab === "RETURNS"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <PackageX className="w-3.5 h-3.5" />
                <span>Retur &amp; Klaim Hub</span>
              </button>

              <button
                onClick={() => setActiveTab("ARCHIVE")}
                className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
                  activeTab === "ARCHIVE"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Arsip Order</span>
              </button>
            </div>

            {/* Import Shopee Button (Hanya tampil di tab Kanban) */}
            {activeTab === "KANBAN" && (
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="btn-3d-dark px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 border border-slate-700 hover:border-cyan-500/50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                <span>Import Shopee</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 p-4 lg:p-6 max-w-[1920px] w-full mx-auto">
        {activeTab === "KANBAN" && <KanbanBoard />}
        {activeTab === "RETURNS" && <ReturnClaimHub />}
        {activeTab === "ARCHIVE" && <ArchiveHub />}
      </main>

      {/* Modal Bulk Import Shopee */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          setIsImportModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}