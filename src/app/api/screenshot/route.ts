import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Use PowerShell to take a screenshot
    const screenshotPath = join(process.env.TEMP || 'C:\\Windows\\Temp', 'synapse-screen.png');
    const psScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)
$bitmap.Save('${screenshotPath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
Write-Output 'ok'
`;
    await execAsync(`powershell -Command "${psScript.replace(/\n/g, '; ')}"`, { timeout: 10000 });

    if (existsSync(screenshotPath)) {
      const buffer = readFileSync(screenshotPath);
      return new NextResponse(buffer, {
        headers: { 'Content-Type': 'image/png' },
      });
    }
    return NextResponse.json({ error: 'Screenshot failed' }, { status: 500 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
