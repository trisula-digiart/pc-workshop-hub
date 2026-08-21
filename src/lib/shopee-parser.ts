import * as XLSX from "xlsx";

export interface ParsedShopeeOrder {
  shopeeOrderSn: string;
  trackingNumber?: string;
  buyerUsername?: string;
  productDetails: string;
  courier?: string;
  paymentMethod?: string;
  notes?: string;
}

function cleanKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function parseShopeeFile(buffer: Buffer): ParsedShopeeOrder[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
  });

  const ordersMap = new Map<string, ParsedShopeeOrder>();

  for (const row of rawRows) {
    const rowKeys = Object.keys(row);

    // Cari key No. Pesanan
    const snKey = rowKeys.find((k) => {
      const c = cleanKey(k);
      return c.includes("nopesanan") || c.includes("ordersn") || c.includes("orderid") || c.includes("nomorpesanan");
    });

    if (!snKey || !row[snKey]) continue;

    const shopeeOrderSn = String(row[snKey]).trim();
    if (!shopeeOrderSn) continue;

    // Cari key No. Resi
    const resiKey = rowKeys.find((k) => {
      const c = cleanKey(k);
      return c.includes("noresi") || c.includes("trackingnumber") || c.includes("resi") || c.includes("airwaybill") || c.includes("nomorresi");
    });
    const trackingNumber = resiKey && row[resiKey] ? String(row[resiKey]).trim() : undefined;

    // Cari key Pembeli / Penerima
    const buyerKey = rowKeys.find((k) => {
      const c = cleanKey(k);
      return c.includes("usernamepembeli") || c.includes("username") || c.includes("namapenerima") || c.includes("buyer");
    });
    const buyerUsername = buyerKey && row[buyerKey] ? String(row[buyerKey]).trim() : undefined;

    // Cari key Jasa Kirim / Kurir
    const courierKey = rowKeys.find((k) => {
      const c = cleanKey(k);
      return c.includes("opsipengiriman") || c.includes("jasakirim") || c.includes("courier") || c.includes("shippingoption") || c.includes("ekspedisi");
    });
    const courier = courierKey && row[courierKey] ? String(row[courierKey]).trim() : undefined;

    // Cari key Metode Pembayaran
    const payKey = rowKeys.find((k) => {
      const c = cleanKey(k);
      return c.includes("metodepembayaran") || c.includes("paymentmethod") || c.includes("metodebayar") || c.includes("pembayaran");
    });
    const rawPayment = payKey && row[payKey] ? String(row[payKey]).toUpperCase().trim() : "";
    const isCOD = rawPayment.includes("COD") || rawPayment.includes("BAYAR DI TEMPAT");
    const paymentMethod = isCOD ? "COD" : "NON_COD";

    // Cari Nama Produk
    const prodKey = rowKeys.find((k) => {
      const c = cleanKey(k);
      return c.includes("namaproduk") || c.includes("productname") || c.includes("namabarang") || c.includes("produk");
    });

    // Cari Variasi Produk
    const varKey = rowKeys.find((k) => {
      const c = cleanKey(k);
      return (
        c.includes("namavariasi") ||
        c.includes("namapilihanvariasi") ||
        c.includes("pilihanvariasi") ||
        c.includes("opsivariasi") ||
        c.includes("variationname") ||
        c.includes("variation") ||
        c.includes("variasi")
      );
    });

    // Cari Jumlah (Qty)
    const qtyKey = rowKeys.find((k) => {
      const c = cleanKey(k);
      return c.includes("jumlah") || c.includes("quantity") || c.includes("qty") || c.includes("totaljumlah");
    });

    const rawProductName = prodKey && row[prodKey] ? String(row[prodKey]).trim() : "Komponen PC / Hardware";
    const rawVariation = varKey && row[varKey] && String(row[varKey]).trim() !== "" ? String(row[varKey]).trim() : "";
    const rawQty = qtyKey && row[qtyKey] ? String(row[qtyKey]).trim() : "1";

    const itemLine = rawVariation
      ? `${rawProductName}\n▶ Varian: ${rawVariation} (x${rawQty})`
      : `${rawProductName} (x${rawQty})`;

    if (ordersMap.has(shopeeOrderSn)) {
      const existing = ordersMap.get(shopeeOrderSn)!;
      if (!existing.productDetails.includes(rawProductName)) {
        existing.productDetails += `\n\n• ${itemLine}`;
      }
      if (!existing.trackingNumber && trackingNumber) existing.trackingNumber = trackingNumber;
      if (!existing.buyerUsername && buyerUsername) existing.buyerUsername = buyerUsername;
      if (!existing.courier && courier) existing.courier = courier;
      if (isCOD) existing.paymentMethod = "COD";
    } else {
      ordersMap.set(shopeeOrderSn, {
        shopeeOrderSn,
        trackingNumber: trackingNumber || undefined,
        buyerUsername: buyerUsername || undefined,
        productDetails: `• ${itemLine}`,
        courier: courier || undefined,
        paymentMethod,
      });
    }
  }

  return Array.from(ordersMap.values());
}