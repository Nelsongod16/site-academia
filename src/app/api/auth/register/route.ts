import { NextResponse } from "next/server";

import { createLocalUser } from "@/lib/local-db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const sessionUser = await createLocalUser(body.email ?? "", body.password ?? "");
    return NextResponse.json({ sessionUser });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel criar a conta." },
      { status: 400 },
    );
  }
}
