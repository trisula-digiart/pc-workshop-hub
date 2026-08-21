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
    const filePath = path.join(process.cwd(), "public", "uploads", "qc-videos", safeFileName);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("File video tidak ditemukan di server.", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = request.headers.get("range");

    const ext = path.extname(safeFileName).toLowerCase();
    let contentType = "video/mp4";
    if (ext === ".mov") contentType = "video/quicktime";
    if (ext === ".webm") contentType = "video/webm";
    if (ext === ".mkv") contentType = "video/x-matroska";

    // Streaming Parsial HTTP 206 (Wajib untuk MP4 Chrome/Edge/Safari)
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(filePath, { start, end });

      const headers = new Headers({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": contentType,
      });

      // @ts-ignore
      return new NextResponse(fileStream as any, {
        status: 206,
        headers,
      });
    } else {
      const fileStream = fs.createReadStream(filePath);
      const headers = new Headers({
        "Content-Length": fileSize.toString(),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
      });

      // @ts-ignore
      return new NextResponse(fileStream as any, {
        status: 200,
        headers,
      });
    }
  } catch (error: any) {
    console.error("QC Video Stream Error:", error);
    return new NextResponse("Gagal memuat video stream.", { status: 500 });
  }
}