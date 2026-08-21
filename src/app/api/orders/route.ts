import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseShopeeFile } from "@/lib/shopee-parser";

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
        { trackingNumber: { contains: search } },
        { buyerUsername: { contains: search } },
        { productDetails: { contains: search } },
        { technicianName: { contains: search } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error("GET /api/orders Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data pesanan." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // 1. INPUT MANUAL (JSON Body)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const {
        shopeeOrderSn,
        trackingNumber,
        buyerUsername,
        productDetails,
        courier,
        paymentMethod = "NON_COD",
        technicianName,
        status = "NEW",
        notes,
      } = body;

      if (!shopeeOrderSn || !productDetails) {
        return NextResponse.json(
          { success: false, error: "No. Pesanan dan Rincian Barang wajib diisi." },
          { status: 400 }
        );
      }

      const existing = await prisma.order.findUnique({
        where: { shopeeOrderSn: shopeeOrderSn.trim() },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: `No. Pesanan ${shopeeOrderSn} sudah ada di antrean.` },
          { status: 409 }
        );
      }

      const newOrder = await prisma.order.create({
        data: {
          shopeeOrderSn: shopeeOrderSn.trim(),
          trackingNumber: trackingNumber ? trackingNumber.trim() : null,
          buyerUsername: buyerUsername ? buyerUsername.trim().replace(/^@/, "") : null,
          productDetails: productDetails.trim(),
          courier: courier ? courier.trim() : null,
          paymentMethod,
          technicianName: technicianName ? technicianName.trim() : null,
          status,
          notes: notes ? notes.trim() : null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Pesanan manual berhasil ditambahkan ke antrean.",
        data: newOrder,
      });
    }

    // 2. BULK IMPORT FILE (FormData Excel / CSV)
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File dokumen Shopee (.xlsx / .csv) tidak ditemukan." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsedOrders = parseShopeeFile(buffer);

    if (parsedOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada data pesanan valid yang ditemukan dalam file." },
        { status: 422 }
      );
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const order of parsedOrders) {
      const existing = await prisma.order.findUnique({
        where: { shopeeOrderSn: order.shopeeOrderSn },
      });

      if (existing) {
        await prisma.order.update({
          where: { shopeeOrderSn: order.shopeeOrderSn },
          data: {
            trackingNumber: order.trackingNumber || existing.trackingNumber,
            buyerUsername: order.buyerUsername || existing.buyerUsername,
            courier: order.courier || existing.courier,
            paymentMethod: order.paymentMethod || existing.paymentMethod,
            productDetails: order.productDetails,
          },
        });
        updatedCount++;
      } else {
        await prisma.order.create({
          data: {
            shopeeOrderSn: order.shopeeOrderSn,
            trackingNumber: order.trackingNumber,
            buyerUsername: order.buyerUsername,
            courier: order.courier,
            paymentMethod: order.paymentMethod || "NON_COD",
            productDetails: order.productDetails,
            status: "NEW",
          },
        });
        insertedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi selesai: ${insertedCount} order baru ditambahkan, ${updatedCount} diperbarui.`,
      inserted: insertedCount,
      updated: updatedCount,
    });
  } catch (error: any) {
    console.error("POST /api/orders Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses data pesanan." },
      { status: 500 }
    );
  }
}