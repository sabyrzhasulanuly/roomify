import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react'
import { useOutletContext } from 'react-router'
import { PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS } from '../lib/constants'

export const Upload = ({ onComplete }: { onComplete?: (data: string) => void }) => {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const { isSignedIn } = useOutletContext<AuthContext>()

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const processFile = (file: File) => {
    if (!isSignedIn) return
    setFile(file)
    setProgress(0)

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64Data = e.target?.result as string

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev + PROGRESS_STEP
          if (next >= 100) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            setTimeout(() => {
              onComplete?.(base64Data)
            }, REDIRECT_DELAY_MS)
            return 100
          }
          return next
        })
      }, PROGRESS_INTERVAL_MS)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isSignedIn) return
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!isSignedIn) return

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      processFile(droppedFile)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSignedIn) return
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  return (
    <div className="upload">
      {!file ? (
        <div
          className={clsx('dropzone', isDragging && 'dragging')}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="drop-input"
            accept=".jpg, .png, .jpeg"
            disabled={!isSignedIn}
            onChange={handleChange}
          />
          <div className="drop-content">
            <div className="drop-icon">
              <UploadIcon size={20} />
            </div>
            <p>
              {isSignedIn ? (
                'Click to upload or just drag and drop'
              ) : (
                'Sign in or sign up with Puter to upload'
              ) }
            </p>
            <p className="help">Maximum file size 50 MB.</p>
          </div>
        </div>
      ) : (
        <div className="upload-status">
          <div className="status-content">
            <div className="status-icon">
              {progress < 100 ? (
                <ImageIcon className="image" />
              ) : (
                <CheckCircle2 className="check" />
              )}
            </div>
            <h3>{file.name}</h3>
            <div className="progress">
              <div className="bar" style={{ width: `${progress}%` }} />
              <p className="status-text">
                {progress < 100 ? 'Analyzing Floor Plan...' : 'Redirecting...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}