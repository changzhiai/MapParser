import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    // Follow redirects to get the full URL
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
    });

    return NextResponse.json({ 
      originalUrl: url,
      resolvedUrl: response.url 
    });
  } catch (error) {
    console.error('Resolution error:', error);
    return NextResponse.json({ error: 'Failed to resolve URL' }, { status: 500 });
  }
}
