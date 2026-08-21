import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const orderId = formData.get("orderId") as string | null;
    const file = formData.get("video") as File | null;
    const technicianName = formData.get("technicianName") as string | null;

    if (!orderId || !file) {
      return NextResponse.json(
        { success: false, error: "Order ID dan file video wajib disertakan." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pesanan workstation tidak ditemukan." },
        { status: 404 }
      );
    }

    // Pastikan direktori lokal public/uploads/qc-videos tersedia
    const uploadDir = path.join(process.cwd(), "public", "uploads", "qc-videos");
    await mkdir(uploadDir, { recursive: true });

    // Format nama file: QC_[ShopeeOrderSn]_[timestamp].[ext]
    const ext = file.name.split(".").pop() || "mp4";
    const sanitizedSn = order.shopeeOrderSn.replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `QC_${sanitizedSn}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const relativePublicPath = `/uploads/qc-videos/${fileName}`;

    // Update database: simpan path video dan auto-advance status ke PACKING
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        qcVideoPath: relativePublicPath,
        status: "PACKING",
        ...(technicianName ? { technicianName } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Video QC berhasil diunggah ke storage lokal.",
      videoPath: relativePublicPath,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("POST /api/upload-qc Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengunggah file video." },
      { status: 500 }
    );
  }
}