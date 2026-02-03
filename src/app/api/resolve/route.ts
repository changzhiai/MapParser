import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const mode = searchParams.get('mode'); // 'browser' | undefined

  if (!url) {
    return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
  }

  // Strategy 1: Puppeteer (Browser execution) - Only if requested
  if (mode === 'browser') {
    try {
      // Launch a headless browser
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--mute-audio',
        ]
      });

      const page = await browser.newPage();

      // OPTIMIZATION: Block heavy visual resources to speed up loading
      // Vital: We MUST allow 'script' and 'xhr' for Google Maps to function
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['image', 'stylesheet', 'font', 'media', 'imageset'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Set a realistic User-Agent to avoid being blocked or getting a mobile view
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');

      try {
        // Navigate to the URL
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        // Wait a bit for Google Maps to do its client-side magic (redirects/URL rewrites)
        try {
          await page.waitForFunction(() => {
            return window.location.href.includes('@') || window.location.href.includes('/data=');
          }, { timeout: 5000 });
        } catch (e) {
          // Timeout is fine, take what we have
        }

        const resolvedUrl = page.url();
        await browser.close();

        return NextResponse.json({
          originalUrl: url,
          resolvedUrl: resolvedUrl
        });

      } catch (pageError) {
        await browser.close();
        console.error('Puppeteer navigation error:', pageError);

        // Fallback: If puppeteer fails, try standard fetch
        const fallbackRes = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        return NextResponse.json({
          originalUrl: url,
          resolvedUrl: fallbackRes.url
        });
      }

    } catch (error) {
      console.error('Resolution error (Puppeteer):', error);
      return NextResponse.json({ error: 'Failed to resolve URL' }, { status: 500 });
    }
  }

  // OPTIMIZATION: If the URL is already a Google Maps Directions URL, return it immediately.
  // This bypasses the need to fetch it (which often fails on AWS due to bot detection).
  if (url.includes('/maps/dir/') || url.includes('/dir/')) {
    return NextResponse.json({
      originalUrl: url,
      resolvedUrl: url
    });
  }

  // Strategy 2: Standard Fetch (default) - Fast, Lightweight
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
    console.error('Resolution error (Fetch):', error);
    return NextResponse.json({ error: 'Failed to resolve URL' }, { status: 500 });
  }
}
