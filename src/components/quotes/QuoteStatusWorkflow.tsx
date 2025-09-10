import type { Quote } from '../../hooks/useQuotes'

interface StatusTransition {
  from: Quote['status']
  to: Quote['status']
  label: string
  color: string
  icon: string
}

const STATUS_TRANSITIONS: StatusTransition[] = [
  { from: 'draft', to: 'sent', label: 'Send to Customer', color: 'blue', icon: '📤' },
  { from: 'sent', to: 'accepted', label: 'Mark Accepted', color: 'green', icon: '✅' },
  { from: 'sent', to: 'rejected', label: 'Mark Rejected', color: 'red', icon: '❌' },
  { from: 'sent', to: 'expired', label: 'Mark Expired', color: 'orange', icon: '⏰' },
  { from: 'accepted', to: 'sent', label: 'Revert to Sent', color: 'gray', icon: '↩️' },
  { from: 'rejected', to: 'sent', label: 'Revert to Sent', color: 'gray', icon: '↩️' },
  { from: 'expired', to: 'sent', label: 'Revert to Sent', color: 'gray', icon: '↩️' }
]

interface QuoteStatusWorkflowProps {
  currentStatus: Quote['status']
  onStatusChange: (newStatus: Quote['status']) => void
  isUpdating?: boolean
  className?: string
}

export default function QuoteStatusWorkflow({ 
  currentStatus, 
  onStatusChange, 
  isUpdating = false,
  className = '' 
}: QuoteStatusWorkflowProps) {
  
  const availableTransitions = STATUS_TRANSITIONS.filter(t => t.from === currentStatus)
  
  const getButtonClasses = (color: string) => {
    const baseClasses = "inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    
    switch (color) {
      case 'blue':
        return `${baseClasses} border-blue-600 text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`
      case 'green':
        return `${baseClasses} border-green-600 text-white bg-green-600 hover:bg-green-700 focus:ring-green-500`
      case 'red':
        return `${baseClasses} border-red-600 text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`
      case 'orange':
        return `${baseClasses} border-orange-600 text-white bg-orange-600 hover:bg-orange-700 focus:ring-orange-500`
      case 'gray':
      default:
        return `${baseClasses} border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500`
    }
  }
  
  if (availableTransitions.length === 0) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-3">Available Actions</h3>
      <div className="flex flex-wrap gap-2">
        {availableTransitions.map((transition) => (
          <button
            key={`${transition.from}-${transition.to}`}
            onClick={() => onStatusChange(transition.to)}
            disabled={isUpdating}
            className={getButtonClasses(transition.color)}
          >
            <span className="mr-2">{transition.icon}</span>
            {isUpdating ? 'Updating...' : transition.label}
          </button>
        ))}
      </div>
      
      {/* Status Explanation */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Current Status: <span className="font-medium capitalize">{currentStatus}</span>
          {currentStatus === 'draft' && ' - Quote is being prepared'}
          {currentStatus === 'sent' && ' - Waiting for customer response'}
          {currentStatus === 'accepted' && ' - Customer has approved the quote'}
          {currentStatus === 'rejected' && ' - Customer has declined the quote'}
          {currentStatus === 'expired' && ' - Quote validity period has ended'}
        </p>
      </div>
    </div>
  )
}
