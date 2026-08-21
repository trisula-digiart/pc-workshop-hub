import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error(`GET /api/orders/${params.id} Error:`, error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil detail order." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const allowedFields = ["status", "technicianName", "notes", "trackingNumber", "qcVideoPath", "paymentMethod"];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    console.error(`PATCH /api/orders/${params.id} Error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui status order." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Order berhasil dihapus." });
  } catch (error: any) {
    console.error(`DELETE /api/orders/${params.id} Error:`, error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus order." },
      { status: 500 }
    );
  }
}