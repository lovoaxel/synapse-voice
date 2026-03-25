import { NextRequest, NextResponse } from "next/server";
import { sendToAgent } from "@/lib/openclaw";

export async function POST(request: NextRequest) {
  try {
    const { message, agentId } = await request.json();

    if (!message || !agentId) {
      return NextResponse.json(
        { error: "Missing message or agentId" },
        { status: 400 }
      );
    }

    const response = await sendToAgent(agentId, message);
    return NextResponse.json({ response });
  } catch (error) {
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: "Agent communication failed" },
      { status: 500 }
    );
  }
}
