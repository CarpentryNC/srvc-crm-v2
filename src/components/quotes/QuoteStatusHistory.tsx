import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface StatusHistoryEntry {
  status: string
  timestamp: string
  user?: string
}

interface QuoteStatusHistoryProps {
  quote: any
  className?: string
}

export default function QuoteStatusHistory({ quote, className = '' }: QuoteStatusHistoryProps) {
  const [expanded, setExpanded] = useState(false)
  const [history, setHistory] = useState<StatusHistoryEntry[]>([])

  useEffect(() => {
    // Generate status history from available data
    const historyEntries: StatusHistoryEntry[] = []
    
    // Current status
    historyEntries.push({
      status: quote.status,
      timestamp: quote.updated_at,
      user: 'Current Status'
    })

    // Created status (always draft initially)
    if (quote.created_at !== quote.updated_at) {
      historyEntries.push({
        status: 'draft',
        timestamp: quote.created_at,
        user: 'Quote Created'
      })
    }

    // Sort by timestamp (newest first)
    setHistory(historyEntries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ))
  }, [quote])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100'
      case 'sent': return 'text-blue-600 bg-blue-100'
      case 'accepted': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'expired': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft'
      case 'sent': return 'Sent'
      case 'accepted': return 'Accepted'
      case 'rejected': return 'Rejected'
      case 'expired': return 'Expired'
      default: return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  if (history.length <= 1) return null

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-sm font-medium text-gray-900">Status History</h3>
          <svg
            className={`h-4 w-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="px-4 py-3">
          <div className="space-y-3">
            {history.map((entry, index) => (
              <div key={`${entry.status}-${entry.timestamp}`} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(entry.status).split(' ')[1]}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(entry.status)}`}>
                      {getStatusLabel(entry.status)}
                    </span>
                    {index === 0 && (
                      <span className="text-xs text-gray-500">(Current)</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
