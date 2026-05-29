import { NextResponse } from "next/server";

import { authenticateLocalUser } from "@/lib/local-db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const sessionUser = await authenticateLocalUser(body.email ?? "", body.password ?? "");
    return NextResponse.json({ sessionUser });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel entrar." },
      { status: 400 },
    );
  }
}
