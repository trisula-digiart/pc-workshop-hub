import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

// GET /api/files - List all shared files
export async function GET() {
  try {
    const files = await prisma.sharedFile.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error: any) {
    console.error("GET /api/files Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil daftar file." },
      { status: 500 }
    );
  }
}

// POST /api/files - Upload a new file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "SOFTWARE";
    const description = (formData.get("description") as string) || "";
    const uploader = (formData.get("uploader") as string) || "Workstation";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File wajib disertakan." },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "shared-files");
    await mkdir(uploadDir, { recursive: true });

    const originalName = file.name;
    const ext = path.extname(originalName) || "";
    const nameWithoutExt = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const storedName = `${nameWithoutExt}_${Date.now()}${ext}`;
    const fullPath = path.join(uploadDir, storedName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(fullPath, buffer);

    const relativePublicPath = `/uploads/shared-files/${storedName}`;

    const newSharedFile = await prisma.sharedFile.create({
      data: {
        filename: originalName,
        storedName,
        filePath: relativePublicPath,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        category,
        description,
        uploader,
      },
    });

    return NextResponse.json({
      success: true,
      message: "File berhasil diunggah dan siap dibagikan.",
      file: newSharedFile,
    });
  } catch (error: any) {
    console.error("POST /api/files Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengunggah file." },
      { status: 500 }
    );
  }
}
