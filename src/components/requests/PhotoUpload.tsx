import React, { useState, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

interface PhotoUploadProps {
  requestId: string
  onUploadComplete?: (fileData: { id: string; file_name: string; file_path: string }) => void
  maxFiles?: number
  className?: string
}

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
  preview?: string
}

export default function PhotoUpload({ 
  requestId, 
  onUploadComplete, 
  maxFiles = 10,
  className = ''
}: PhotoUploadProps) {
  const { user } = useAuth()
  const [uploads, setUploads] = useState<UploadFile[]>([])
  const [dragActive, setDragActive] = useState(false)

  // Generate unique ID for each upload
  const generateId = () => Math.random().toString(36).substr(2, 9)

  // Handle file selection
  const handleFiles = useCallback((fileList: FileList) => {
    const files = Array.from(fileList)
    const validFiles = files.filter(file => {
      // Check file type
      if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
        alert(`${file.name} is not a supported file type. Please upload images or PDFs.`)
        return false
      }
      
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Please upload files smaller than 10MB.`)
        return false
      }
      
      return true
    })

    // Check total file limit
    if (uploads.length + validFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files.`)
      return
    }

    // Create upload entries
    const newUploads: UploadFile[] = validFiles.map(file => ({
      file,
      id: generateId(),
      progress: 0,
      status: 'pending',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }))

    setUploads(prev => [...prev, ...newUploads])
    
    // Start uploading
    newUploads.forEach(uploadFile => uploadFileToStorage(uploadFile))
  }, [uploads.length, maxFiles])

  // Upload file to Supabase Storage
  const uploadFileToStorage = async (uploadFile: UploadFile) => {
    if (!user) return

    const { file, id } = uploadFile
    
    try {
      // Update status to uploading
      setUploads(prev => prev.map(u => 
        u.id === id ? { ...u, status: 'uploading' as const } : u
      ))

      // Create file path: user_id/request_id/filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = `${user.id}/${requestId}/${fileName}`

      // Upload to Supabase Storage
      const { data: storageData, error: uploadError } = await supabase.storage
        .from('request-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Save file record to database
      const { data: fileRecord, error: dbError } = await supabase
        .from('request_files')
        .insert({
          request_id: requestId,
          user_id: user.id,
          file_name: file.name,
          file_path: storageData.path,
          file_size: file.size,
          mime_type: file.type,
          category: file.type.startsWith('image/') ? 'photo' : 'document'
        })
        .select()
        .single() as any

      if (dbError) throw dbError

      // Update upload status
      setUploads(prev => prev.map(u => 
        u.id === id ? { ...u, status: 'complete' as const, progress: 100 } : u
      ))

      // Notify parent component
      if (onUploadComplete && fileRecord) {
        onUploadComplete({
          id: (fileRecord as any).id,
          file_name: (fileRecord as any).file_name,
          file_path: (fileRecord as any).file_path
        })
      }

    } catch (error) {
      console.error('Upload error:', error)
      setUploads(prev => prev.map(u => 
        u.id === id ? { 
          ...u, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : u
      ))
    }
  }

  // Remove upload from list
  const removeUpload = (id: string) => {
    setUploads(prev => {
      const upload = prev.find(u => u.id === id)
      if (upload?.preview) {
        URL.revokeObjectURL(upload.preview)
      }
      return prev.filter(u => u.id !== id)
    })
  }

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleInputChange}
          className="hidden"
          id={`file-upload-${requestId}`}
        />
        
        <div className="space-y-2">
          <div className="text-4xl text-gray-400">📁</div>
          <div>
            <label
              htmlFor={`file-upload-${requestId}`}
              className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
            >
              Choose files
            </label>
            <span className="text-gray-600"> or drag and drop</span>
          </div>
          <p className="text-sm text-gray-500">
            Images and PDFs up to 10MB each (max {maxFiles} files)
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="font-medium text-gray-900">Upload Progress</h4>
          {uploads.map((upload) => (
            <div key={upload.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {/* Preview */}
              {upload.preview ? (
                <img
                  src={upload.preview}
                  alt={upload.file.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-500">PDF</span>
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {upload.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(upload.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
                
                {/* Status */}
                {upload.status === 'uploading' && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {upload.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                )}
                
                {upload.status === 'complete' && (
                  <p className="text-xs text-green-600 mt-1">✓ Upload complete</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {upload.status === 'uploading' && (
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                )}
                
                {upload.status === 'complete' && (
                  <div className="text-green-600">✓</div>
                )}
                
                {upload.status === 'error' && (
                  <div className="text-red-600">⚠</div>
                )}
                
                <button
                  onClick={() => removeUpload(upload.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
