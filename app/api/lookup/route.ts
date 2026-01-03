import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address) return NextResponse.json({ error: 'Address required' }, { status: 400 })

  try {
    const searchTerm = encodeURIComponent(address.trim())
    const url = `https://data.cityofchicago.org/resource/22u3-xenr.json?$q=${searchTerm}&$select=address,zip_code,latitude,longitude&$limit=1`
    
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    })
    
    if (!res.ok) return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
    
    const data = await res.json()
    
    if (data.length === 0) {
      return NextResponse.json({
        address: address.toUpperCase(),
        found: true
      })
    }

    return NextResponse.json({
      address: data[0].address,
      found: true
    })
  } catch (e) {
    console.error('Lookup error:', e)
    return NextResponse.json({ error: 'Failed to lookup address' }, { status: 500 })
  }
}
