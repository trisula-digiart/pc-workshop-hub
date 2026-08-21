import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    const safeFileName = path.basename(decodeURIComponent(filename));
    const filePath = path.join(process.cwd(), "public", "uploads", "retur-photos", safeFileName);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("File foto tidak ditemukan di server.", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(safeFileName).toLowerCase();
    
    let contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";
    if (ext === ".webp") contentType = "image/webp";
    if (ext === ".gif") contentType = "image/gif";
    if (ext === ".heic" || ext === ".heif") contentType = "image/heic";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Retur Photo Stream Error:", error);
    return new NextResponse("Gagal memuat foto retur.", { status: 500 });
  }
}
