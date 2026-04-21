import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
	// Try to get the IP from common headers used by proxies (like Nginx)
	const forwarded = req.headers.get('x-forwarded-for');
	const realIp = req.headers.get('x-real-ip');

	const ip = forwarded ? forwarded.split(',')[0] : (realIp || 'unknown');

	return new NextResponse(ip);
}
