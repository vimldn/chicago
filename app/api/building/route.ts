import { NextRequest, NextResponse } from 'next/server'
import { DATASETS, COMMUNITY_AREAS } from '@/lib/data-sources'

async function fetchData(id: string, query: string, timeout = 12000): Promise<any[]> {
  const controller = new AbortController()
  const tid = setTimeout(() => controller.abort(), timeout)
  try {
    const url = `https://data.cityofchicago.org/resource/${id}.json?${query}`
    const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } })
    clearTimeout(tid)
    if (!res.ok) return []
    return await res.json()
  } catch { clearTimeout(tid); return [] }
}

function categorize(desc: string): string {
  const d = (desc || '').toLowerCase()
  if (d.includes('heat') || d.includes('furnace') || d.includes('boiler')) return 'Heat'
  if (d.includes('roach') || d.includes('mice') || d.includes('rat') || d.includes('pest') || d.includes('rodent') || d.includes('bedbug')) return 'Pests'
  if (d.includes('plumb') || d.includes('leak') || d.includes('water') || d.includes('toilet') || d.includes('sink') || d.includes('drain')) return 'Plumbing'
  if (d.includes('electric') || d.includes('outlet') || d.includes('wiring')) return 'Electrical'
  if (d.includes('fire') || d.includes('smoke') || d.includes('detector') || d.includes('sprinkler')) return 'Fire Safety'
  if (d.includes('structural') || d.includes('foundation') || d.includes('wall') || d.includes('floor') || d.includes('ceiling') || d.includes('roof')) return 'Structural'
  if (d.includes('garbage') || d.includes('trash') || d.includes('sanitary')) return 'Sanitation'
  if (d.includes('elevator')) return 'Elevator'
  if (d.includes('porch') || d.includes('stair') || d.includes('handrail')) return 'Exterior'
  return 'Other'
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address) return NextResponse.json({ error: 'Address required' }, { status: 400 })

  try {
    const now = new Date()
    const searchTerm = encodeURIComponent(address.trim())
    
    const [violations, permits, sr311, problemLandlords, affordableHousing] = await Promise.all([
      fetchData('22u3-xenr', `$q=${searchTerm}&$limit=500&$order=violation_date DESC`),
      fetchData(DATASETS.buildingPermits, `$q=${searchTerm}&$limit=200&$order=issue_date DESC`).catch(() => []),
      fetchData(DATASETS.sr311, `$q=${searchTerm}&$limit=300&$order=created_date DESC`).catch(() => []),
      fetchData(DATASETS.problemLandlords, `$limit=1000`).catch(() => []),
      fetchData(DATASETS.affordableHousing, `$q=${searchTerm}&$limit=10`).catch(() => []),
    ])

    const firstViol = violations[0]
    const firstPermit = permits[0]
    const lat = firstViol?.latitude ? +firstViol.latitude : (firstPermit?.latitude ? +firstPermit.latitude : null)
    const lng = firstViol?.longitude ? +firstViol.longitude : (firstPermit?.longitude ? +firstPermit.longitude : null)
    
    const building = {
      address: firstViol?.address || (firstPermit?.street_number ? `${firstPermit.street_number} ${firstPermit.street_direction || ''} ${firstPermit.street_name}`.trim() : address.toUpperCase()),
      city: 'Chicago', state: 'IL',
      zipcode: firstViol?.zip_code || firstPermit?.zip_code || '',
      communityArea: firstViol?.community_area ? COMMUNITY_AREAS[firstViol.community_area] || '' : '',
      ward: firstViol?.ward || firstPermit?.ward || '',
      latitude: lat, longitude: lng,
    }

    const openViolations = violations.filter((v: any) => v.violation_status === 'OPEN' || !v.violation_status_date)
    const closedViolations = violations.filter((v: any) => v.violation_status === 'CLOSED' || v.violation_status === 'COMPLIED')
    
    const violByYear: Record<string, number> = {}
    const violByCategory: Record<string, number> = {}
    violations.forEach((v: any) => {
      const yr = (v.violation_date || '').substring(0, 4)
      if (yr) violByYear[yr] = (violByYear[yr] || 0) + 1
      const cat = categorize(v.violation_description || '')
      violByCategory[cat] = (violByCategory[cat] || 0) + 1
    })

    const recentViolations = violations.slice(0, 30).map((v: any) => ({
      id: v.id || Math.random().toString(),
      date: v.violation_date,
      code: v.violation_code,
      description: v.violation_description,
      status: v.violation_status || 'Open',
      inspector: v.inspector_id,
      category: categorize(v.violation_description || ''),
    }))

    const sr311ByType: Record<string, number> = {}
    sr311.forEach((s: any) => {
      const type = s.sr_type || s.service_request_type || 'Other'
      sr311ByType[type] = (sr311ByType[type] || 0) + 1
    })

    const recent311 = sr311.slice(0, 30).map((s: any) => ({
      id: s.sr_number || Math.random().toString(),
      date: s.created_date,
      type: s.sr_type || s.service_request_type,
      status: s.status,
    }))

    const recentPermits = permits.slice(0, 20).map((p: any) => ({
      id: p.id || p.permit_ || Math.random().toString(),
      permitNumber: p.permit_,
      type: p.permit_type,
      workDescription: p.work_description,
      issueDate: p.issue_date,
      estimatedCost: p.estimated_cost ? +p.estimated_cost : null,
      contractor: p.contractor_1_name,
    }))

    const isProblemLandlord = problemLandlords.some((pl: any) => address.toUpperCase().includes((pl.address || '').toUpperCase()))
    const isAffordableHousing = affordableHousing.length > 0

    let score = 100
    score -= Math.min(openViolations.length * 3, 30)
    score -= Math.min(violations.length * 0.5, 15)
    score -= Math.min(sr311.length * 0.5, 10)
    if (isProblemLandlord) score -= 25
    score = Math.max(0, Math.round(score))
    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 55 ? 'D' : 'F'
    const label = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Poor'

    const redFlags: any[] = []
    if (isProblemLandlord) redFlags.push({ severity: 'critical', title: 'Problem Landlord', description: 'This address appears on Chicago\'s Problem Landlord list.' })
    if (openViolations.length >= 10) redFlags.push({ severity: 'critical', title: `${openViolations.length} Open Violations`, description: 'High number of unresolved building violations.' })
    else if (openViolations.length >= 5) redFlags.push({ severity: 'warning', title: `${openViolations.length} Open Violations`, description: 'Multiple unresolved building violations.' })
    if (violByCategory['Heat'] >= 3) redFlags.push({ severity: 'warning', title: 'Heating Issues', description: `${violByCategory['Heat']} heat-related violations on record.` })
    if (violByCategory['Structural'] >= 2) redFlags.push({ severity: 'warning', title: 'Structural Issues', description: `${violByCategory['Structural']} structural violations on record.` })

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const monthlyTrend = []
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const violM = violations.filter((v: any) => { const vd = new Date(v.violation_date); return vd >= start && vd <= end }).length
      const compM = sr311.filter((c: any) => { const cd = new Date(c.created_date); return cd >= start && cd <= end }).length
      monthlyTrend.push({ month: months[d.getMonth()], year: d.getFullYear(), monthYear: `${months[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`, violations: violM, complaints: compM, total: violM + compM })
    }

    const timeline: any[] = []
    violations.slice(0, 30).forEach((v: any) => { if (v.violation_date) timeline.push({ date: v.violation_date, type: 'violation', source: 'Building Dept', description: v.violation_description?.substring(0, 100) || 'Building violation', severity: v.violation_status === 'OPEN' ? 'high' : 'medium' }) })
    sr311.slice(0, 20).forEach((s: any) => { if (s.created_date) timeline.push({ date: s.created_date, type: 'complaint', source: '311', description: s.sr_type || s.service_request_type || '311 complaint', severity: 'low' }) })
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      building, score: { overall: score, grade, label },
      violations: { total: violations.length, open: openViolations.length, closed: closedViolations.length, byYear: violByYear, byCategory: Object.entries(violByCategory).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count), recent: recentViolations },
      complaints: { total: sr311.length, byType: Object.entries(sr311ByType).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count), recent: recent311 },
      permits: { total: permits.length, recent: recentPermits },
      crime: { total: 0, violent: 0, score: 70, level: 'N/A', byType: [] },
      programs: { problemLandlord: isProblemLandlord, affordableHousing: isAffordableHousing },
      redFlags, timeline: timeline.slice(0, 50), monthlyTrend,
      dataSourcesCounted: 5, lastUpdated: new Date().toISOString(),
      dataDisclaimer: 'Data from Chicago Data Portal. Scores are estimates. Always verify independently.',
    })
  } catch (e) {
    console.error('API Error:', e)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
