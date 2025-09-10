import { useParams, useNavigate } from 'react-router-dom'
import { useQuotes, type Quote } from '../../hooks/useQuotes'
import { useState, useEffect } from 'react'
import QuoteBuilder from './QuoteBuilder'

export default function QuoteEditPage() {
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

  const handleSave = (updatedQuote: Quote) => {
    navigate(`/quotes/${updatedQuote.id}`)
  }

  const handleCancel = () => {
    if (quote) {
      navigate(`/quotes/${quote.id}`)
    } else {
      navigate('/quotes')
    }
  }

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
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <QuoteBuilder
          initialQuote={quote}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
