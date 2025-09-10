import { useParams, useNavigate } from 'react-router-dom'
import { useQuotes, type Quote } from '../../hooks/useQuotes'
import { useState, useEffect } from 'react'
import QuotePreview from './QuotePreview'

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { quotes, getQuote, loading: quotesLoading } = useQuotes()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuote() {
      if (!id) {
        navigate('/quotes')
        return
      }

      // First try to find the quote in the existing quotes array
      const existingQuote = quotes.find(q => q.id === id)
      if (existingQuote && !quotesLoading) {
        setQuote(existingQuote)
        setLoading(false)
        return
      }

      // If not found and quotes are still loading, wait
      if (quotesLoading) {
        return
      }

      // If quotes are loaded but quote not found, fetch individually
      try {
        setLoading(true)
        const quoteData = await getQuote(id)
        if (quoteData) {
          setQuote(quoteData)
        } else {
          navigate('/quotes')
        }
      } catch (error) {
        console.error('Error fetching quote:', error)
        navigate('/quotes')
      } finally {
        setLoading(false)
      }
    }

    fetchQuote()
  }, [id, quotes, quotesLoading, getQuote, navigate])

  // Update quote when it changes in the quotes array (real-time updates)
  useEffect(() => {
    if (id && quotes.length > 0 && !quotesLoading) {
      const updatedQuote = quotes.find(q => q.id === id)
      if (updatedQuote && updatedQuote.updated_at !== quote?.updated_at) {
        console.log('Quote updated via real-time subscription:', {
          old: quote?.status,
          new: updatedQuote.status,
          timestamp: updatedQuote.updated_at
        })
        setQuote(updatedQuote)
      }
    }
  }, [quotes, id, quotesLoading, quote?.updated_at])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">Quote not found</h2>
          <button
            onClick={() => navigate('/quotes')}
            className="mt-4 text-blue-600 hover:text-blue-500"
          >
            Back to Quotes
          </button>
        </div>
      </div>
    )
  }

  return (
    <QuotePreview 
      quote={quote} 
      onEdit={() => navigate(`/quotes/${quote.id}/edit`)}
    />
  )
}
