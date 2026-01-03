import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 3) return NextResponse.json({ suggestions: [] })

  try {
    const searchTerm = encodeURIComponent(q.trim())
    
    // Use Socrata's simple full-text search - most reliable method
    const url = `https://data.cityofchicago.org/resource/22u3-xenr.json?$q=${searchTerm}&$select=address,zip_code,latitude,longitude&$limit=50`
    
    console.log('Fetching:', url) // Debug log
    
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('Chicago API error:', res.status, errorText)
      return NextResponse.json({ suggestions: [], error: errorText })
    }
    
    const data = await res.json()
    console.log('Got results:', data.length) // Debug log
    
    // Deduplicate by address
    const seen = new Set<string>()
    const suggestions = data
      .filter((d: any) => {
        if (!d.address || seen.has(d.address)) return false
        seen.add(d.address)
        return true
      })
      .slice(0, 8)
      .map((d: any) => ({
        address: d.address,
        zipcode: d.zip_code || '',
        latitude: d.latitude,
        longitude: d.longitude,
      }))

    return NextResponse.json({ suggestions })
  } catch (e) {
    console.error('Autocomplete error:', e)
    return NextResponse.json({ suggestions: [], error: String(e) })
  }
}
