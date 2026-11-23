import { NextResponse } from 'next/server';
import { SITE_CONFIG } from '@/config/site';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    domain: SITE_CONFIG.domain,
  });
}
