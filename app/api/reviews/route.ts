import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET reviews for a building (using address as key)
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  
  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 })
  }

  try {
    // Use bbl field to store Chicago addresses (prefixed with CHI-)
    const addressKey = `CHI-${address.toUpperCase().trim()}`
    
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('bbl', addressKey)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate average rating
    const avgRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    // Rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews?.forEach(r => {
      distribution[r.rating as keyof typeof distribution]++
    })

    return NextResponse.json({
      reviews: reviews || [],
      count: reviews?.length || 0,
      averageRating: Math.round(avgRating * 10) / 10,
      distribution
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST a new review
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const { address, rating, title, review, pros, cons, lived_here, years_lived, author_name, email, phone } = body

    if (!address || !rating || !review) {
      return NextResponse.json({ error: 'Address, rating, and review are required' }, { status: 400 })
    }

    if (!email || !phone) {
      return NextResponse.json({ error: 'Email and phone are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    if (review.length < 10) {
      return NextResponse.json({ error: 'Review must be at least 10 characters' }, { status: 400 })
    }

    // Use bbl field to store Chicago addresses (prefixed with CHI-)
    const addressKey = `CHI-${address.toUpperCase().trim()}`

    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        bbl: addressKey,
        rating: Math.round(rating),
        title: title?.trim() || null,
        review: review.trim(),
        pros: pros?.trim() || null,
        cons: cons?.trim() || null,
        lived_here: lived_here || false,
        years_lived: years_lived || null,
        author_name: author_name?.trim() || 'Anonymous',
        email: email.trim(),
        phone: phone.trim(),
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, review: data })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
