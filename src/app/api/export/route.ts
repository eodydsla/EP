import { NextResponse } from "next/server";
import { CSV_TYPES, exportCsv, type CsvType } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") ?? "indicators") as CsvType;

  if (!CSV_TYPES.includes(type)) {
    return NextResponse.json({ error: `알 수 없는 type: ${type}` }, { status: 400 });
  }

  const track = searchParams.get("track") ?? undefined;
  const csv = await exportCsv(type, track);
  // 엑셀에서 한글이 깨지지 않도록 BOM 추가
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${track ? `${track}-` : ""}${type}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
