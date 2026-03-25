import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { message, agentId } = await req.json();
    if (!message || !agentId) {
      return NextResponse.json({ error: 'message and agentId required' }, { status: 400 });
    }

    // Try local OpenClaw CLI first, fall back to gateway HTTP
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL;

    if (gatewayUrl) {
      // Remote mode — call gateway API directly
      const token = process.env.OPENCLAW_GATEWAY_TOKEN || '';
      const res = await fetch(`${gatewayUrl}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ agent: agentId, message, wait: true, timeout: 60000 }),
      });
      const data = await res.json();
      const text = data.response || data.message || data.text || JSON.stringify(data);
      return NextResponse.json({ text });
    } else {
      // Local mode — use openclaw CLI
      const escaped = message.replace(/'/g, "''").replace(/"/g, '\\"');
      const cmd = `openclaw send --agent ${agentId} --message "${escaped}" --wait --timeout 60000`;
      const { stdout, stderr } = await execAsync(cmd, {
        timeout: 65000,
        shell: 'powershell.exe',
        env: { ...process.env, PATH: process.env.PATH },
      });

      const output = stdout.trim();
      try {
        const json = JSON.parse(output);
        const text = json.response || json.message || json.text || output;
        return NextResponse.json({ text });
      } catch {
        return NextResponse.json({ text: output || stderr?.trim() || 'No response' });
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg, text: 'Error al comunicarme con el agente.' }, { status: 500 });
  }
}
