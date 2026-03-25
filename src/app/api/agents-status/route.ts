import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Returns status of all agents and crons
export async function GET() {
  try {
    // Get cron list
    const { stdout: cronOut } = await execAsync('openclaw cron list --json 2>$null', {
      timeout: 10000,
      shell: 'powershell.exe',
    }).catch(() => ({ stdout: '[]' }));

    // Get active sessions
    const { stdout: sessOut } = await execAsync('openclaw status --json 2>$null', {
      timeout: 10000,
      shell: 'powershell.exe',
    }).catch(() => ({ stdout: '{}' }));

    let crons = [];
    let sessions = {};
    try { crons = JSON.parse(cronOut); } catch {}
    try { sessions = JSON.parse(sessOut); } catch {}

    return NextResponse.json({
      agents: [
        { id: 'main', name: 'JARVIS', emoji: '🎩', model: 'Claude Sonnet 4', status: 'online' },
        { id: 'coder', name: 'CIPHER', emoji: '🔐', model: 'Claude Opus 4', status: 'online' },
        { id: 'atlas', name: 'Atlas', emoji: '🏛️', model: 'Claude Sonnet 4', status: 'standby' },
      ],
      crons,
      sessions,
      timestamp: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
