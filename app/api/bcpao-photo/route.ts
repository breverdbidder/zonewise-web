import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  // Only proxy BCPAO images for security
  if (!imageUrl.startsWith('https://www.bcpao.us/') && !imageUrl.startsWith('http://www.bcpao.us/')) {
    return new NextResponse('Only BCPAO URLs allowed', { status: 403 })
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        // Deliberately omit Referer to bypass hotlink protection
        'User-Agent': 'Mozilla/5.0 (compatible; ZoneWise/1.0)',
      },
    })

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    return new NextResponse('Proxy error', { status: 500 })
  }
}
