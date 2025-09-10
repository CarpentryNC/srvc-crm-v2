import { useState } from 'react'
import AssessmentForm from './AssessmentForm'
import type { Assessment } from '../../hooks/useRequests'

interface AssessmentModalProps {
  isOpen: boolean
  onClose: () => void
  requestId: string
  existingAssessment?: Assessment
  onSuccess?: (assessment: Assessment) => void
}

export default function AssessmentModal({
  isOpen,
  onClose,
  requestId,
  existingAssessment,
  onSuccess
}: AssessmentModalProps) {
  const [isClosing, setIsClosing] = useState(false)

  const handleComplete = (assessment: Assessment) => {
    if (onSuccess) {
      onSuccess(assessment)
    }
    handleClose()
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 150)
  }

  if (!isOpen && !isClosing) return null

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-y-auto transition-all duration-150 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className={`relative w-full max-w-2xl transform transition-all duration-150 ${
            isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <AssessmentForm
            requestId={requestId}
            existingAssessment={existingAssessment}
            onComplete={handleComplete}
            onCancel={handleClose}
            className="shadow-xl"
          />
        </div>
      </div>
    </div>
  )
}
