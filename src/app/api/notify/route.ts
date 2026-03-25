import { NextRequest, NextResponse } from 'next/server';

// Agents can POST here to trigger a voice notification in the UI
// The frontend polls this endpoint for pending notifications
let pendingNotifications: Array<{
  id: string;
  agentId: string;
  message: string;
  priority: 'low' | 'normal' | 'urgent';
  timestamp: number;
}> = [];

// POST: Agent pushes a notification
export async function POST(req: NextRequest) {
  try {
    const { agentId, message, priority } = await req.json();
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

    const notification = {
      id: crypto.randomUUID(),
      agentId: agentId || 'main',
      message,
      priority: priority || 'normal',
      timestamp: Date.now(),
    };

    pendingNotifications.push(notification);

    // Keep only last 10
    if (pendingNotifications.length > 10) {
      pendingNotifications = pendingNotifications.slice(-10);
    }

    return NextResponse.json({ ok: true, id: notification.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET: Frontend polls for pending notifications
export async function GET() {
  const pending = [...pendingNotifications];
  pendingNotifications = []; // Clear after reading
  return NextResponse.json({ notifications: pending });
}
