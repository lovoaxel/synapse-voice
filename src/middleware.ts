import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Skip auth for static files and the main page
  if (req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname.startsWith('/icon') || req.nextUrl.pathname === '/manifest.json' || req.nextUrl.pathname === '/sw.js') {
    return NextResponse.next();
  }

  // API routes require PIN
  if (req.nextUrl.pathname.startsWith('/api')) {
    const pin = process.env.SYNAPSE_PIN;
    if (!pin) return NextResponse.next(); // No PIN set = no auth (dev mode)

    const authHeader = req.headers.get('x-synapse-pin') || req.nextUrl.searchParams.get('pin');
    if (authHeader !== pin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
