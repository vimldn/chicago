'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, AlertTriangle, CheckCircle, XCircle, Search, ChevronRight, ChevronLeft, ExternalLink, Home, FileText, Users, History, Hammer, MapPin, Calendar, Clock, Shield, BarChart3, Star, ThumbsUp, MessageSquare } from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'

type Tab = 'overview' | 'violations' | 'complaints' | 'timeline' | 'permits' | 'crime' | 'reviews'

type Review = {
  id: string
  bbl: string
  rating: number
  title: string | null
  review: string
  pros: string | null
  cons: string | null
  lived_here: boolean
  years_lived: string | null
  author_name: string
  helpful_count: number
  created_at: string
}

export default function BuildingPage() {
  const params = useParams()
  const router = useRouter()
  const address = decodeURIComponent(params.address as string)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [search, setSearch] = useState('')
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsData, setReviewsData] = useState<{ count: number, averageRating: number, distribution: Record<number, number> }>({ count: 0, averageRating: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', review: '', pros: '', cons: '', lived_here: false, years_lived: '', author_name: '', email: '', phone: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [votedReviews, setVotedReviews] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/building?address=${encodeURIComponent(address)}`)
        const json = await res.json()
        if (json.error) setError(json.error)
        else setData(json)
      } catch { setError('Failed to load data') }
      finally { setLoading(false) }
    }
    if (address) load()
  }, [address])
  
  // Fetch reviews
  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch(`/api/reviews?address=${encodeURIComponent(address)}`)
        const json = await res.json()
        if (!json.error) {
          setReviews(json.reviews || [])
          setReviewsData({ count: json.count, averageRating: json.averageRating, distribution: json.distribution })
        }
      } catch (e) { console.error('Failed to load reviews', e) }
    }
    if (address) loadReviews()
  }, [address])
  
  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingReview(true)
    setReviewError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, ...reviewForm })
      })
      const json = await res.json()
      if (json.error) {
        setReviewError(json.error)
      } else {
        setReviews([json.review, ...reviews])
        setReviewsData(prev => ({ ...prev, count: prev.count + 1, averageRating: ((prev.averageRating * prev.count) + reviewForm.rating) / (prev.count + 1) }))
        setShowReviewForm(false)
        setReviewForm({ rating: 5, title: '', review: '', pros: '', cons: '', lived_here: false, years_lived: '', author_name: '', email: '', phone: '' })
      }
    } catch { setReviewError('Failed to submit review') }
    finally { setSubmittingReview(false) }
  }
  
  const voteHelpful = async (reviewId: string) => {
    if (votedReviews.has(reviewId)) return
    try {
      await fetch('/api/reviews/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId })
      })
      setVotedReviews(new Set([...Array.from(votedReviews), reviewId]))
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r))
    } catch (e) { console.error('Vote failed', e) }
  }

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); if (search.trim()) router.push(`/building/${encodeURIComponent(search.toUpperCase())}`) }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e17]">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-[#1e293b] rounded-full" />
          <div className="absolute inset-0 border-4 border-red-500 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-[#94a3b8] text-xl mb-2">Analyzing building...</p>
        <p className="text-[#64748b] text-sm">Fetching from Chicago Data Portal</p>
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e17]">
      <div className="text-center max-w-md px-4">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Building Not Found</h1>
        <p className="text-[#94a3b8] mb-6">{error || 'No data found for this address'}</p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold">
          <ChevronLeft size={18} />Back to Search
        </Link>
      </div>
    </div>
  )

  const { building: b, score: s } = data
  const scoreColor = s.overall >= 80 ? '#10b981' : s.overall >= 60 ? '#f59e0b' : '#ef4444'
  const circumference = 2 * Math.PI * 42
  const strokeDashoffset = circumference - (s.overall / 100) * circumference
  const COLORS = ['#f97316', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#64748b']

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'reviews', label: `Reviews${reviewsData.count > 0 ? ` (${reviewsData.count})` : ''}`, icon: MessageSquare },
    { id: 'violations', label: 'Violations', icon: AlertTriangle },
    { id: 'complaints', label: '311', icon: FileText },
    { id: 'permits', label: 'Permits', icon: Hammer },
    { id: 'crime', label: 'Crime', icon: Shield },
    { id: 'timeline', label: 'Timeline', icon: History },
  ]

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Header */}
      <header className="bg-[#0a0e17]/95 backdrop-blur-xl border-b border-[#1e293b] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold hidden sm:block">ChicagoRentCheck</span>
            </Link>
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568]" size={18} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search another address..." className="w-full pl-10 pr-4 py-2.5 bg-[#151c2c] border border-[#2a3441] rounded-xl text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-red-500/50" />
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Building Header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="text-red-400" size={28} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-1">{b.address}</h1>
                  <p className="text-[#64748b]">
                    {b.communityArea && <span>{b.communityArea} • </span>}
                    Chicago, IL {b.zipcode}
                    {b.ward && <span> • Ward {b.ward}</span>}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {data.programs?.problemLandlord && <span className="badge badge-red">⚠️ Problem Landlord</span>}
                {data.programs?.affordableHousing && <span className="badge badge-green">Affordable Housing</span>}
                <span className={`badge ${s.overall >= 80 ? 'badge-green' : s.overall >= 60 ? 'badge-yellow' : 'badge-red'}`}>{s.label}</span>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold" style={{ color: scoreColor }}>{s.overall}</span>
                  <span className="text-xs text-[#64748b]">/ 100</span>
                </div>
              </div>
              <p className="text-sm font-medium mt-2" style={{ color: scoreColor }}>{s.grade} Grade</p>
            </div>
          </div>
        </div>

        {/* Red Flags */}
        {data.redFlags?.length > 0 && (
          <div className="card card-warning p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="text-red-400" size={20} />
              </div>
              <div>
                <h2 className="font-bold text-red-400 mb-2">{data.redFlags.length} Red Flag{data.redFlags.length > 1 ? 's' : ''} Detected</h2>
                <ul className="space-y-2">
                  {data.redFlags.map((f: any, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${f.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <div className={f.severity === 'critical' ? 'text-red-300' : 'text-[#94a3b8]'}><strong>{f.title}</strong> — {f.description}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)} className={`tab flex items-center gap-2 ${tab === t.id ? 'tab-active' : ''}`}>
              <t.icon size={16} />{t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="card p-4 stat-red"><div className="text-[#64748b] text-xs mb-1">Open Violations</div><div className="text-2xl font-bold text-red-400">{data.violations.open}</div><div className="text-xs text-[#64748b]">{data.violations.total} total</div></div>
              <div className="card p-4 stat-orange"><div className="text-[#64748b] text-xs mb-1">311 Complaints</div><div className="text-2xl font-bold text-orange-400">{data.complaints.total}</div><div className="text-xs text-[#64748b]">last 3 years</div></div>
              <div className="card p-4 stat-blue"><div className="text-[#64748b] text-xs mb-1">Permits</div><div className="text-2xl font-bold text-blue-400">{data.permits.total}</div><div className="text-xs text-[#64748b]">on record</div></div>
              <div className="card p-4 stat-purple"><div className="text-[#64748b] text-xs mb-1">Crime Nearby</div><div className="text-2xl font-bold text-purple-400">{data.crime.total}</div><div className="text-xs text-[#64748b]">past year</div></div>
              <div className="card p-4" style={{ borderColor: scoreColor + '40' }}><div className="text-[#64748b] text-xs mb-1">Safety Score</div><div className="text-2xl font-bold" style={{ color: scoreColor }}>{data.crime.score}</div><div className="text-xs text-[#64748b]">{data.crime.level}</div></div>
            </div>

            {/* Resident Reviews Widget - Prominent */}
            <div className="card p-6 border-2 border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setTab('reviews')}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <Star className="text-yellow-400 fill-yellow-400" size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">What Do Residents Say?</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold">{reviewsData.averageRating > 0 ? reviewsData.averageRating.toFixed(1) : '—'}</span>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} size={18} className={star <= Math.round(reviewsData.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-[#4a5568]'} />
                        ))}
                      </div>
                      <span className="text-[#64748b]">({reviewsData.count} review{reviewsData.count !== 1 ? 's' : ''})</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); setTab('reviews'); setShowReviewForm(true); }} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg flex items-center gap-2">
                    <MessageSquare size={16} />
                    Write a Review
                  </button>
                  <ChevronRight className="text-[#4a5568]" size={20} />
                </div>
              </div>
            </div>

            {/* Trend Chart */}
            <div className="card p-6">
              <h3 className="font-bold mb-6 text-lg">24-Month Trend</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyTrend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="vG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                      <linearGradient id="cG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
                    </defs>
                    <XAxis dataKey="monthYear" stroke="#4a5568" fontSize={10} tickLine={false} interval={3} />
                    <YAxis stroke="#4a5568" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#151c2c', border: '1px solid #2a3441', borderRadius: '10px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={2} fill="url(#vG)" name="Violations" />
                    <Area type="monotone" dataKey="complaints" stroke="#f97316" strokeWidth={2} fill="url(#cG)" name="311 Complaints" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Violations by Category */}
            {data.violations.byCategory?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-bold mb-6 text-lg">Violations by Category</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.violations.byCategory.slice(0, 8)} layout="vertical" margin={{ left: 80 }}>
                      <XAxis type="number" stroke="#4a5568" fontSize={10} />
                      <YAxis type="category" dataKey="category" stroke="#4a5568" fontSize={11} width={75} />
                      <Tooltip contentStyle={{ backgroundColor: '#151c2c', border: '1px solid #2a3441', borderRadius: '10px' }} />
                      <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIOLATIONS TAB */}
        {tab === 'violations' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="card p-6 text-center"><div className="text-4xl font-bold text-red-400 mb-1">{data.violations.open}</div><div className="text-[#64748b]">Open Violations</div></div>
              <div className="card p-6 text-center"><div className="text-4xl font-bold text-green-400 mb-1">{data.violations.closed}</div><div className="text-[#64748b]">Closed/Complied</div></div>
              <div className="card p-6 text-center"><div className="text-4xl font-bold mb-1">{data.violations.total}</div><div className="text-[#64748b]">Total on Record</div></div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold mb-4">Recent Violations</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {data.violations.recent?.length > 0 ? data.violations.recent.map((v: any) => (
                  <div key={v.id} className="p-4 bg-[#151c2c] rounded-xl border border-[#1e293b]">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`badge ${v.status === 'OPEN' ? 'badge-red' : 'badge-green'}`}>{v.status}</span>
                      <span className="text-xs text-[#64748b]">{v.date ? new Date(v.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <p className="text-sm text-[#e2e8f0] mb-2">{v.description || 'No description'}</p>
                    <div className="flex gap-2 text-xs text-[#64748b]">
                      {v.code && <span>Code: {v.code}</span>}
                      {v.category && <span className="badge bg-[#1e293b]">{v.category}</span>}
                    </div>
                  </div>
                )) : <p className="text-[#64748b] text-center py-8">No violations on record</p>}
              </div>
            </div>
          </div>
        )}

        {/* 311 COMPLAINTS TAB */}
        {tab === 'complaints' && (
          <div className="space-y-6 animate-fade-in">
            <div className="card p-6">
              <h3 className="font-bold mb-4">311 Service Requests by Type</h3>
              {data.complaints.byType?.length > 0 ? (
                <div className="space-y-2">
                  {data.complaints.byType.slice(0, 15).map((c: any) => (
                    <div key={c.type} className="flex items-center justify-between p-3 bg-[#151c2c] rounded-lg">
                      <span className="text-sm">{c.type}</span>
                      <span className="badge bg-orange-500/20 text-orange-400">{c.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-[#64748b] text-center py-8">No 311 complaints on record</p>}
            </div>

            <div className="card p-6">
              <h3 className="font-bold mb-4">Recent 311 Requests</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {data.complaints.recent?.map((c: any) => (
                  <div key={c.id} className="p-3 bg-[#151c2c] rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{c.type}</p>
                      <p className="text-xs text-[#64748b]">{c.date ? new Date(c.date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <span className={`badge ${c.status === 'Completed' ? 'badge-green' : 'badge-yellow'}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PERMITS TAB */}
        {tab === 'permits' && (
          <div className="space-y-6 animate-fade-in">
            <div className="card p-6">
              <h3 className="font-bold mb-4">Building Permits ({data.permits.total})</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {data.permits.recent?.length > 0 ? data.permits.recent.map((p: any) => (
                  <div key={p.id} className="p-4 bg-[#151c2c] rounded-xl border border-[#1e293b]">
                    <div className="flex items-start justify-between mb-2">
                      <span className="badge badge-blue">{p.type || 'Permit'}</span>
                      <span className="text-xs text-[#64748b]">{p.issueDate ? new Date(p.issueDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <p className="text-sm text-[#e2e8f0] mb-2">{p.workDescription || 'No description'}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-[#64748b]">
                      {p.permitNumber && <span>#{p.permitNumber}</span>}
                      {p.estimatedCost && <span className="text-green-400">${p.estimatedCost.toLocaleString()}</span>}
                      {p.contractor && <span>Contractor: {p.contractor}</span>}
                    </div>
                  </div>
                )) : <p className="text-[#64748b] text-center py-8">No permits on record</p>}
              </div>
            </div>
          </div>
        )}

        {/* CRIME TAB */}
        {tab === 'crime' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="card p-6 text-center"><div className="text-4xl font-bold mb-1">{data.crime.total}</div><div className="text-[#64748b]">Total Incidents</div><div className="text-xs text-[#4a5568]">500m radius, past year</div></div>
              <div className="card p-6 text-center"><div className="text-4xl font-bold text-red-400 mb-1">{data.crime.violent}</div><div className="text-[#64748b]">Violent Crimes</div></div>
              <div className="card p-6 text-center"><div className="text-4xl font-bold mb-1" style={{ color: data.crime.score >= 70 ? '#10b981' : data.crime.score >= 50 ? '#f59e0b' : '#ef4444' }}>{data.crime.score}</div><div className="text-[#64748b]">Safety Score</div></div>
              <div className="card p-6 text-center"><div className="text-2xl font-bold mb-1" style={{ color: data.crime.level === 'LOW' ? '#10b981' : data.crime.level === 'MODERATE' ? '#f59e0b' : '#ef4444' }}>{data.crime.level}</div><div className="text-[#64748b]">Crime Level</div></div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold mb-4">Crime by Type</h3>
              {data.crime.byType?.length > 0 ? (
                <div className="space-y-2">
                  {data.crime.byType.map((c: any) => (
                    <div key={c.type} className="flex items-center justify-between p-3 bg-[#151c2c] rounded-lg">
                      <span className="text-sm">{c.type}</span>
                      <span className="badge bg-purple-500/20 text-purple-400">{c.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-[#64748b] text-center py-8">No crime data nearby</p>}
            </div>
          </div>
        )}

        {/* TIMELINE TAB */}
        {tab === 'timeline' && (
          <div className="card p-6 animate-fade-in">
            <h3 className="font-bold mb-6">Building History Timeline</h3>
            <div className="relative pl-8 space-y-6 max-h-[700px] overflow-y-auto">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#1e293b]" />
              {data.timeline?.length > 0 ? data.timeline.map((e: any, i: number) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-5 w-4 h-4 rounded-full border-2 ${e.severity === 'high' ? 'bg-red-500 border-red-400' : e.severity === 'medium' ? 'bg-yellow-500 border-yellow-400' : 'bg-blue-500 border-blue-400'}`} />
                  <div className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`badge ${e.type === 'violation' ? 'badge-red' : 'badge-orange'}`}>{e.source}</span>
                      <span className="text-xs text-[#64748b]">{new Date(e.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-[#e2e8f0]">{e.description}</p>
                  </div>
                </div>
              )) : <p className="text-[#64748b] text-center py-8">No events in timeline</p>}
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {tab === 'reviews' && (
          <div className="space-y-6 animate-fade-in">
            {/* Reviews Summary */}
            <div className="card p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white">{reviewsData.averageRating.toFixed(1)}</div>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} size={20} className={star <= Math.round(reviewsData.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-[#4a5568]'} />
                      ))}
                    </div>
                    <div className="text-sm text-[#64748b] mt-1">{reviewsData.count} review{reviewsData.count !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="space-y-1">
                    {[5,4,3,2,1].map(rating => (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-xs w-3">{rating}</span>
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <div className="w-24 h-2 bg-[#1e293b] rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${reviewsData.count > 0 ? (reviewsData.distribution[rating] / reviewsData.count) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs text-[#64748b] w-6">{reviewsData.distribution[rating]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => setShowReviewForm(!showReviewForm)} className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold flex items-center gap-2">
                  <MessageSquare size={18} />
                  Write a Review
                </button>
              </div>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="card p-6 border-2 border-red-500/30 animate-fade-in">
                <h3 className="font-bold text-lg mb-6">Share Your Experience</h3>
                <form onSubmit={submitReview} className="space-y-6">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2">Your Rating *</label>
                    <div className="flex items-center gap-2">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} type="button" onClick={() => setReviewForm({...reviewForm, rating: star})} className="p-1 hover:scale-110 transition-transform">
                          <Star size={32} className={star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-[#4a5568] hover:text-yellow-400'} />
                        </button>
                      ))}
                      <span className="ml-2 text-[#64748b]">{reviewForm.rating === 1 ? 'Terrible' : reviewForm.rating === 2 ? 'Poor' : reviewForm.rating === 3 ? 'Average' : reviewForm.rating === 4 ? 'Good' : 'Excellent'}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2">Review Title</label>
                    <input type="text" value={reviewForm.title} onChange={e => setReviewForm({...reviewForm, title: e.target.value})} placeholder="Summarize your experience" className="w-full p-3 bg-[#151c2c] border border-[#1e293b] rounded-xl text-white placeholder-[#4a5568] focus:outline-none focus:border-red-500/50" maxLength={100} />
                  </div>

                  {/* Review Text */}
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2">Your Review *</label>
                    <textarea value={reviewForm.review} onChange={e => setReviewForm({...reviewForm, review: e.target.value})} placeholder="Tell others about your experience living here..." rows={4} className="w-full p-3 bg-[#151c2c] border border-[#1e293b] rounded-xl text-white placeholder-[#4a5568] focus:outline-none focus:border-red-500/50 resize-none" minLength={10} required />
                  </div>

                  {/* Pros & Cons */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#94a3b8] mb-2">👍 Pros</label>
                      <textarea value={reviewForm.pros} onChange={e => setReviewForm({...reviewForm, pros: e.target.value})} placeholder="What did you like?" rows={2} className="w-full p-3 bg-[#151c2c] border border-[#1e293b] rounded-xl text-white placeholder-[#4a5568] focus:outline-none focus:border-red-500/50 resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-[#94a3b8] mb-2">👎 Cons</label>
                      <textarea value={reviewForm.cons} onChange={e => setReviewForm({...reviewForm, cons: e.target.value})} placeholder="What could be better?" rows={2} className="w-full p-3 bg-[#151c2c] border border-[#1e293b] rounded-xl text-white placeholder-[#4a5568] focus:outline-none focus:border-red-500/50 resize-none" />
                    </div>
                  </div>

                  {/* Lived Here */}
                  <div className="flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={reviewForm.lived_here} onChange={e => setReviewForm({...reviewForm, lived_here: e.target.checked})} className="w-5 h-5 rounded border-[#1e293b] bg-[#151c2c] text-red-500 focus:ring-red-500" />
                      <span className="text-[#94a3b8]">I live/lived here</span>
                    </label>
                    {reviewForm.lived_here && (
                      <select value={reviewForm.years_lived} onChange={e => setReviewForm({...reviewForm, years_lived: e.target.value})} className="p-2 bg-[#151c2c] border border-[#1e293b] rounded-lg text-white focus:outline-none focus:border-red-500/50">
                        <option value="">How long?</option>
                        <option value="< 1 year">Less than 1 year</option>
                        <option value="1-2 years">1-2 years</option>
                        <option value="2-5 years">2-5 years</option>
                        <option value="5+ years">5+ years</option>
                      </select>
                    )}
                  </div>

                  {/* Author Name */}
                  <div>
                    <label className="block text-sm text-[#94a3b8] mb-2">Your Name (optional)</label>
                    <input type="text" value={reviewForm.author_name} onChange={e => setReviewForm({...reviewForm, author_name: e.target.value})} placeholder="Anonymous" className="w-full sm:w-64 p-3 bg-[#151c2c] border border-[#1e293b] rounded-xl text-white placeholder-[#4a5568] focus:outline-none focus:border-red-500/50" maxLength={50} />
                  </div>

                  {/* Contact Details */}
                  <div className="p-4 bg-[#151c2c] rounded-xl border border-[#1e293b]">
                    <p className="text-sm text-[#94a3b8] mb-4">📧 Your contact details are required for verification but will <strong>never be displayed publicly</strong>.</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#94a3b8] mb-2">Email Address *</label>
                        <input type="email" value={reviewForm.email} onChange={e => setReviewForm({...reviewForm, email: e.target.value})} placeholder="your@email.com" className="w-full p-3 bg-[#0a0e17] border border-[#1e293b] rounded-xl text-white placeholder-[#4a5568] focus:outline-none focus:border-red-500/50" required />
                      </div>
                      <div>
                        <label className="block text-sm text-[#94a3b8] mb-2">Phone Number *</label>
                        <input type="tel" value={reviewForm.phone} onChange={e => setReviewForm({...reviewForm, phone: e.target.value})} placeholder="(555) 123-4567" className="w-full p-3 bg-[#0a0e17] border border-[#1e293b] rounded-xl text-white placeholder-[#4a5568] focus:outline-none focus:border-red-500/50" required />
                      </div>
                    </div>
                  </div>

                  {/* Error & Submit */}
                  {reviewError && <p className="text-red-400 text-sm">{reviewError}</p>}
                  <div className="flex items-center gap-4">
                    <button type="submit" disabled={submittingReview} className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 rounded-xl font-semibold flex items-center gap-2">
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button type="button" onClick={() => setShowReviewForm(false)} className="px-6 py-3 bg-[#1e293b] hover:bg-[#2d3748] rounded-xl">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="card p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-[#4a5568] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
                  <p className="text-[#64748b] mb-6">Be the first to share your experience living in this building!</p>
                  <button onClick={() => setShowReviewForm(true)} className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold">Write a Review</button>
                </div>
              ) : reviews.map(review => (
                <div key={review.id} className="card p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center">
                          {[1,2,3,4,5].map(star => (
                            <Star key={star} size={16} className={star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-[#4a5568]'} />
                          ))}
                        </div>
                        {review.lived_here && (
                          <span className="badge badge-green flex items-center gap-1">
                            <CheckCircle size={12} /> Verified Resident
                          </span>
                        )}
                      </div>
                      {review.title && <h4 className="font-semibold text-lg">{review.title}</h4>}
                    </div>
                    <div className="text-right text-sm text-[#64748b]">
                      <div>{review.author_name}</div>
                      <div>{new Date(review.created_at).toLocaleDateString()}</div>
                      {review.years_lived && <div className="text-xs">Lived here: {review.years_lived}</div>}
                    </div>
                  </div>
                  
                  <p className="text-[#e2e8f0] mb-4 whitespace-pre-wrap">{review.review}</p>
                  
                  {(review.pros || review.cons) && (
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      {review.pros && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <div className="text-xs text-green-400 font-semibold mb-1">👍 PROS</div>
                          <p className="text-sm text-[#e2e8f0]">{review.pros}</p>
                        </div>
                      )}
                      {review.cons && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <div className="text-xs text-red-400 font-semibold mb-1">👎 CONS</div>
                          <p className="text-sm text-[#e2e8f0]">{review.cons}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 pt-3 border-t border-[#1e293b]">
                    <button onClick={() => voteHelpful(review.id)} disabled={votedReviews.has(review.id)} className={`flex items-center gap-2 text-sm ${votedReviews.has(review.id) ? 'text-red-400' : 'text-[#64748b] hover:text-white'}`}>
                      <ThumbsUp size={16} className={votedReviews.has(review.id) ? 'fill-red-400' : ''} />
                      Helpful ({review.helpful_count})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* External Links */}
        <div className="card p-6 mt-6">
          <h3 className="font-bold mb-4">Official Records</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Chicago Building Violations', url: `https://data.cityofchicago.org/Buildings/Building-Violations/22u3-xenr` },
              { label: 'Chicago 311 Portal', url: `https://311.chicago.gov/` },
              { label: 'Cook County Assessor', url: `https://www.cookcountyassessor.com/` },
            ].map(link => (<a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-[#1a2235] rounded-xl hover:bg-[#232938] text-sm"><span>{link.label}</span><ExternalLink size={14} className="text-[#4a5568]" /></a>))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-[#151c2c] rounded-xl border border-[#1e293b] text-center">
          <p className="text-xs text-[#64748b]">{data.dataDisclaimer}</p>
        </div>
      </main>
    </div>
  )
}
