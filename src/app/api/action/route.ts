import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Actions the voice interface can execute locally
export async function POST(req: NextRequest) {
  try {
    const { action, params } = await req.json();

    switch (action) {
      case 'open-url': {
        const url = params?.url;
        if (!url) return NextResponse.json({ error: 'No URL' }, { status: 400 });
        await execAsync(`Start-Process "${url}"`, { shell: 'powershell.exe' });
        return NextResponse.json({ ok: true, message: `Abriendo ${url}` });
      }

      case 'open-app': {
        const app = params?.app;
        if (!app) return NextResponse.json({ error: 'No app' }, { status: 400 });
        await execAsync(`Start-Process "${app}"`, { shell: 'powershell.exe' });
        return NextResponse.json({ ok: true, message: `Abriendo ${app}` });
      }

      case 'volume': {
        const level = params?.level ?? 50;
        // Use nircmd or PowerShell to set volume
        const psCmd = `
$obj = New-Object -ComObject WScript.Shell
1..50 | ForEach-Object { $obj.SendKeys([char]174) }
1..${Math.round(level / 2)} | ForEach-Object { $obj.SendKeys([char]175) }
`;
        await execAsync(`powershell -Command "${psCmd.replace(/\n/g, '; ')}"`, { timeout: 5000 });
        return NextResponse.json({ ok: true, message: `Volumen al ${level}%` });
      }

      case 'spotify': {
        const query = params?.query || '';
        await execAsync(`Start-Process "spotify:search:${encodeURIComponent(query)}"`, { shell: 'powershell.exe' });
        return NextResponse.json({ ok: true, message: `Buscando "${query}" en Spotify` });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
