import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { id: { contains: search } },
        { shopeeOrderSn: { contains: search } },
        { returnTrackingNumber: { contains: search } },
        { buyerUsername: { contains: search } },
        { productDetails: { contains: search } },
        { technicianName: { contains: search } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const returns = await prisma.returnClaim.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            qcVideoPath: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: returns });
  } catch (error: any) {
    console.error("GET /api/returns Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat data klaim retur." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shopeeOrderSn,
      returnTrackingNumber,
      buyerUsername,
      productDetails,
      returnReason = "GAGAL_KIRIM_RTS",
      technicianName,
      claimNotes,
    } = body;

    if (!shopeeOrderSn) {
      return NextResponse.json(
        { success: false, error: "No. Pesanan Shopee wajib diisi." },
        { status: 400 }
      );
    }

    // Sambungkan ke pesanan existing jika ditemukan
    const existingOrder = await prisma.order.findUnique({
      where: { shopeeOrderSn: shopeeOrderSn.trim() },
    });

    const newReturn = await prisma.returnClaim.create({
      data: {
        shopeeOrderSn: shopeeOrderSn.trim(),
        returnTrackingNumber: returnTrackingNumber ? returnTrackingNumber.trim() : null,
        buyerUsername: buyerUsername
          ? buyerUsername.trim().replace(/^@/, "")
          : existingOrder?.buyerUsername || null,
        productDetails: productDetails
          ? productDetails.trim()
          : existingOrder?.productDetails || "Unit PC / Sparepart",
        returnReason,
        technicianName: technicianName ? technicianName.trim() : null,
        claimNotes: claimNotes ? claimNotes.trim() : null,
        orderId: existingOrder ? existingOrder.id : null,
        status: "MENUNGGU_UNBOXING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data paket retur berhasil didaftarkan.",
      data: newReturn,
    });
  } catch (error: any) {
    console.error("POST /api/returns Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membuat tiket klaim retur." },
      { status: 500 }
    );
  }
}