import { NextResponse } from "next/server";

import { updateLocalUserProfile } from "@/lib/local-db";
import type { SocialProfileInput } from "@/types/social";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { userId?: string; input?: SocialProfileInput };

    if (!body.userId || !body.input) {
      throw new Error("Dados de perfil incompletos.");
    }

    const sessionUser = await updateLocalUserProfile(body.userId, body.input);
    return NextResponse.json({ sessionUser });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel salvar o perfil." },
      { status: 400 },
    );
  }
}
