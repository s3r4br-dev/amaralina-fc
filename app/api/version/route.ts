import { NextResponse } from "next/server"
import { APP_VERSION } from "@/components/version-checker"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  return NextResponse.json(
    {
      version: APP_VERSION,
      buildTime: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  )
}
