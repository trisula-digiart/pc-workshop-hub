import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const returnId = formData.get("returnId") as string | null;
    const technicianName = formData.get("technicianName") as string | null;
    const claimNotes = formData.get("claimNotes") as string | null;

    const photoOuter = formData.get("photoOuter") as File | null;
    const photoResi = formData.get("photoResi") as File | null;
    const photoInside = formData.get("photoInside") as File | null;
    const videoProof = formData.get("videoProof") as File | null;

    if (!returnId) {
      return NextResponse.json(
        { success: false, error: "ID Tiket Retur wajib disertakan." },
        { status: 400 }
      );
    }

    const returnItem = await prisma.returnClaim.findUnique({
      where: { id: returnId },
    });

    if (!returnItem) {
      return NextResponse.json(
        { success: false, error: "Data tiket retur tidak ditemukan." },
        { status: 404 }
      );
    }

    // Pastikan folder penyimpanan tersedia
    const photosDir = path.join(process.cwd(), "public", "uploads", "retur-photos");
    const videosDir = path.join(process.cwd(), "public", "uploads", "qc-videos");
    await mkdir(photosDir, { recursive: true });
    await mkdir(videosDir, { recursive: true });

    const sanitizedSn = returnItem.shopeeOrderSn.replace(/[^a-zA-Z0-9_-]/g, "");
    const timestamp = Date.now();
    const updatePayload: Record<string, any> = {};

    // 1. Simpan Foto Paket Luar
    if (photoOuter && photoOuter.size > 0) {
      const ext = photoOuter.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `RETUR_LUAR_${sanitizedSn}_${timestamp}.${ext}`;
      const buffer = Buffer.from(await photoOuter.arrayBuffer());
      await writeFile(path.join(photosDir, fileName), buffer);
      updatePayload.photoOuterPath = `/api/retur-photo/${fileName}`;
    }

    // 2. Simpan Foto Label Resi Retur
    if (photoResi && photoResi.size > 0) {
      const ext = photoResi.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `RETUR_RESI_${sanitizedSn}_${timestamp}.${ext}`;
      const buffer = Buffer.from(await photoResi.arrayBuffer());
      await writeFile(path.join(photosDir, fileName), buffer);
      updatePayload.photoResiPath = `/api/retur-photo/${fileName}`;
    }

    // 3. Simpan Foto Isi Terbuka
    if (photoInside && photoInside.size > 0) {
      const ext = photoInside.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `RETUR_ISI_${sanitizedSn}_${timestamp}.${ext}`;
      const buffer = Buffer.from(await photoInside.arrayBuffer());
      await writeFile(path.join(photosDir, fileName), buffer);
      updatePayload.photoInsidePath = `/api/retur-photo/${fileName}`;
    }

    // 4. Simpan Video Kerusakan (Streaming Endpoint)
    if (videoProof && videoProof.size > 0) {
      const ext = videoProof.name.split(".").pop()?.toLowerCase() || "mp4";
      const fileName = `RETUR_VIDEO_${sanitizedSn}_${timestamp}.${ext}`;
      const buffer = Buffer.from(await videoProof.arrayBuffer());
      await writeFile(path.join(videosDir, fileName), buffer);
      updatePayload.videoProofPath = `/api/qc-video/${fileName}`;
    }

    if (technicianName) updatePayload.technicianName = technicianName.trim();
    if (claimNotes) updatePayload.claimNotes = claimNotes.trim();

    // Otomatis ubah status ke UNBOXING_SELESAI jika bukti foto sudah masuk
    if (
      updatePayload.photoOuterPath ||
      updatePayload.photoResiPath ||
      updatePayload.photoInsidePath ||
      updatePayload.videoProofPath
    ) {
      updatePayload.status = "UNBOXING_SELESAI";
    }

    const updatedReturn = await prisma.returnClaim.update({
      where: { id: returnId },
      data: updatePayload,
    });

    return NextResponse.json({
      success: true,
      message: "Bukti unboxing dan foto fisik retur berhasil disimpan.",
      data: updatedReturn,
    });
  } catch (error: any) {
    console.error("POST /api/upload-retur Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengunggah bukti paket retur." },
      { status: 500 }
    );
  }
}