import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "AliasDesk",
    timestamp: new Date().toISOString(),
  });
}