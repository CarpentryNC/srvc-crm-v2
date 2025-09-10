import { useNavigate, useSearchParams } from 'react-router-dom'
import { type Quote } from '../../hooks/useQuotes'
import QuoteBuilder from './QuoteBuilder'

export default function QuoteNewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Get optional request ID and customer ID from query params
  const requestId = searchParams.get('requestId') || undefined
  const customerId = searchParams.get('customerId') || undefined

  const handleSave = (quote: Quote) => {
    navigate(`/quotes/${quote.id}`)
  }

  const handleCancel = () => {
    navigate('/quotes')
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <QuoteBuilder
          requestId={requestId}
          customerId={customerId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
