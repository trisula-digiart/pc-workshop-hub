import { NextResponse } from "next/server";
import os from "os";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const interfaces = os.networkInterfaces();
    let lanIp = "localhost";
    let tailscaleIp: string | null = null;

    for (const name of Object.keys(interfaces)) {
      const lowerName = name.toLowerCase();

      for (const iface of interfaces[name] || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          // Deteksi Tailscale IP (Subnet CGNAT 100.64.0.0/10)
          if (
            lowerName.includes("tailscale") ||
            iface.address.startsWith("100.")
          ) {
            tailscaleIp = iface.address;
            continue;
          }

          // Lewati virtual adapter lain selain Tailscale
          if (
            lowerName.includes("virtual") ||
            lowerName.includes("vethernet") ||
            lowerName.includes("docker") ||
            lowerName.includes("vmware") ||
            lowerName.includes("loopback")
          ) {
            continue;
          }

          // Prioritaskan IP Private LAN lokal
          if (
            iface.address.startsWith("192.168.") ||
            iface.address.startsWith("10.") ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(iface.address)
          ) {
            if (lanIp === "localhost") {
              lanIp = iface.address;
            }
          }
        }
      }
    }

    const primaryIp = lanIp !== "localhost" ? lanIp : (tailscaleIp || "localhost");

    return NextResponse.json({
      success: true,
      lanIp,
      tailscaleIp,
      localIp: primaryIp, // Default IP prioritizes local Wi-Fi LAN IP
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, lanIp: "localhost", tailscaleIp: null, error: error.message },
      { status: 500 }
    );
  }
}