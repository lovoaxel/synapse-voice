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

    // Escape for PowerShell
    const escaped = message.replace(/'/g, "''").replace(/"/g, '\\"');
    const cmd = `openclaw send --agent ${agentId} --message "${escaped}" --wait --timeout 60000`;

    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 65000,
      shell: 'powershell.exe',
      env: { ...process.env, PATH: process.env.PATH },
    });

    // Try to parse as JSON first
    const output = stdout.trim();
    try {
      const json = JSON.parse(output);
      const text = json.response || json.message || json.text || output;
      return NextResponse.json({ text });
    } catch {
      // Plain text response
      return NextResponse.json({ text: output || stderr?.trim() || 'No response' });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg, text: 'Lo siento, hubo un error al comunicarme con el agente.' }, { status: 500 });
  }
}
