import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id;

    const fileRecord = await prisma.sharedFile.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      return NextResponse.json(
        { success: false, error: "File tidak ditemukan." },
        { status: 404 }
      );
    }

    // Hapus file fisik jika ada
    const fullPath = path.join(process.cwd(), "public", fileRecord.filePath);
    if (existsSync(fullPath)) {
      try {
        await unlink(fullPath);
      } catch (fsErr) {
        console.warn("Gagal menghapus file fisik:", fsErr);
      }
    }

    // Hapus record dari database
    await prisma.sharedFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json({
      success: true,
      message: "File berhasil dihapus dari server.",
    });
  } catch (error: any) {
    console.error("DELETE /api/files/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus file." },
      { status: 500 }
    );
  }
}
