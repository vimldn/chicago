'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Building2, Shield, AlertTriangle, Users, Zap, ChevronRight, FileText, Bug, Database, BarChart3, Flame, Gavel, History, MessageSquare } from 'lucide-react'

interface Suggestion { address: string; zipcode: string; communityArea: string }

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); setShowDropdown(false); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data.suggestions?.length) { setSuggestions(data.suggestions); setShowDropdown(true) }
        else { setSuggestions([]); setShowDropdown(false) }
      } catch {}
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (s: Suggestion) => { 
    setLoading(true)
    setShowDropdown(false)
    router.push(`/building/${encodeURIComponent(s.address)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || !suggestions.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(p => p < suggestions.length - 1 ? p + 1 : p) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(p => p > 0 ? p - 1 : 0) }
    else if (e.key === 'Enter' && selectedIndex >= 0) { e.preventDefault(); handleSelect(suggestions[selectedIndex]) }
    else if (e.key === 'Escape') setShowDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIndex >= 0 && suggestions[selectedIndex]) { handleSelect(suggestions[selectedIndex]); return }
    if (!query.trim()) return
    setLoading(true)
    router.push(`/building/${encodeURIComponent(query.toUpperCase())}`)
  }

  const features = [
    { icon: AlertTriangle, title: 'Building Violations', desc: 'Full violation history from Chicago Building Dept', color: 'text-red-400', bg: 'bg-red-500/10' },
    { icon: FileText, title: '311 Complaints', desc: 'Service requests and complaints for the address', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { icon: Gavel, title: 'Problem Landlords', desc: 'Check against City of Chicago problem landlord list', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: Users, title: 'Crime Data', desc: 'Nearby crime incidents within 500m radius', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { icon: Flame, title: 'Permits', desc: 'Building permits and construction work', color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: Shield, title: 'Risk Score', desc: 'Overall building health score based on all data', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: History, title: '24-Month Timeline', desc: 'Chronological history of all incidents', color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { icon: MessageSquare, title: 'Resident Reviews', desc: 'Real reviews from people who lived there', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ]

  const dataSources = [
    'Building Violations', '311 Service Requests', 'Building Permits', 'Crime Data',
    'Problem Landlord List', 'Affordable Housing', 'Business Licenses', 'Food Inspections'
  ]

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e17]/90 backdrop-blur-xl border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold">ChicagoRentCheck</span>
              <span className="hidden sm:inline text-sm text-[#64748b] ml-2">Building Intelligence</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <Database size={14} />
            <span className="hidden sm:inline">Chicago Data Portal</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=2000')` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17] via-[#0a0e17]/80 to-[#0a0e17]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm mb-8">
            <Zap size={14} />
            Chicago's most comprehensive building database
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1]">
            Know <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400">Everything</span>
            <span className="block mt-2">Before You Sign</span>
          </h1>

          <p className="text-xl text-[#94a3b8] mb-10 max-w-3xl mx-auto">
            <strong>Search any Chicago address.</strong> Get violations, 311 complaints, crime data, permits, problem landlord status, and resident reviews.
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto" ref={dropdownRef}>
            <form onSubmit={handleSubmit}>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#64748b]" size={22} />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1) }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                    placeholder="Enter any Chicago address..."
                    className="w-full pl-14 pr-32 py-5 bg-[#151c2c] border border-[#2a3441] rounded-2xl text-lg text-white placeholder-[#4a5568] focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-500/25">
                    {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Searching</> : <>Search<ChevronRight size={16} /></>}
                  </button>
                </div>
              </div>
            </form>

            {showDropdown && suggestions.length > 0 && (
              <div className="autocomplete-dropdown animate-slide-up">
                {suggestions.map((s, i) => (
                  <div key={s.address} className={`autocomplete-item ${i === selectedIndex ? 'selected' : ''}`} onClick={() => handleSelect(s)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#1e293b] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 size={18} className="text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{s.address}</div>
                        <div className="text-sm text-[#64748b]">
                          Chicago, IL {s.zipcode}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-[#4a5568] flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review Your Building Button */}
          <div className="mt-8">
            <p className="text-[#64748b] mb-3">Already live in a Chicago building?</p>
            <button 
              onClick={() => {
                const address = prompt('Enter your building address to review it:')
                if (address) {
                  router.push(`/building/${encodeURIComponent(address.toUpperCase())}?review=true`)
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e293b] hover:bg-[#2d3748] border border-[#3a4553] rounded-xl font-semibold transition-all"
            >
              <MessageSquare size={18} className="text-yellow-400" />
              Review Your Building
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-[#64748b]">
            <div className="flex items-center gap-2"><Building2 size={16} className="text-red-400" />All Chicago Buildings</div>
            <div className="flex items-center gap-2"><BarChart3 size={16} className="text-emerald-400" />Real-time Data</div>
            <div className="flex items-center gap-2"><Shield size={16} className="text-purple-400" />100% Free</div>
            <div className="flex items-center gap-2"><Database size={16} className="text-cyan-400" />Official Sources</div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-24 bg-[#0a0e17]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Everything You Need to Know</h2>
          <p className="text-center text-[#64748b] mb-16 max-w-2xl mx-auto">We pull from Chicago's official data sources to give you the complete picture on any building.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <div key={f.title} className="card p-6 hover:border-[#3a4553] transition-colors">
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className={f.color} size={24} />
                </div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-[#64748b]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="py-16 bg-[#080b12]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Powered by Official Chicago Data</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {dataSources.map(src => (
              <span key={src} className="px-4 py-2 bg-[#151c2c] rounded-full text-sm text-[#94a3b8] border border-[#1e293b]">{src}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-[#0a0e17] border-t border-[#1e293b]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">ChicagoRentCheck</span>
          </div>
          <p className="text-[#64748b] text-sm mb-4">Making Chicago rental decisions transparent</p>
          <p className="text-xs text-[#4a5568]">Data sourced from Chicago Data Portal. Not legal advice. Always verify independently.</p>
        </div>
      </footer>
    </main>
  )
}
