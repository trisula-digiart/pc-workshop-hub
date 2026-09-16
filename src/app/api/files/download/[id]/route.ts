import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createReadStream, existsSync, statSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
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
        { success: false, error: "File tidak ditemukan di database." },
        { status: 404 }
      );
    }

    const fullPath = path.join(process.cwd(), "public", fileRecord.filePath);

    if (!existsSync(fullPath)) {
      return NextResponse.json(
        { success: false, error: "File fisik tidak ditemukan pada penyimpanan server." },
        { status: 404 }
      );
    }

    // Increment download count background update
    await prisma.sharedFile.update({
      where: { id: fileId },
      data: { downloadCount: { increment: 1 } },
    });

    const stat = statSync(fullPath);
    const fileStream = createReadStream(fullPath);

    // Convert node readstream to Web ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
    });

    const encodedFilename = encodeURIComponent(fileRecord.filename);

    return new NextResponse(readableStream as any, {
      headers: {
        "Content-Type": fileRecord.mimeType || "application/octet-stream",
        "Content-Length": stat.size.toString(),
        "Content-Disposition": `attachment; filename="${fileRecord.filename.replace(/"/g, "")}"; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/files/download Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengunduh file." },
      { status: 500 }
    );
  }
}
