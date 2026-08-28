import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Sonda do web. O worker tem a sua propria, em outro processo e outra porta. */
export function GET() {
  return NextResponse.json({ ok: true, runtime: 'web', em: new Date().toISOString() });
}
