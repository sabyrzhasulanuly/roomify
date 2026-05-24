import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Upload } from './Upload'
import { PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS } from '../lib/constants'

// Mock react-router's useOutletContext
const mockUseOutletContext = vi.fn()
vi.mock('react-router', () => ({
  useOutletContext: () => mockUseOutletContext(),
}))

// Mock lucide-react icons to avoid SVG rendering issues
vi.mock('lucide-react', () => ({
  CheckCircle2: () => <span data-testid="check-circle-icon" />,
  ImageIcon: () => <span data-testid="image-icon" />,
  UploadIcon: () => <span data-testid="upload-icon" />,
}))

// Helper to create a mock File
const createMockFile = (name = 'floor-plan.png', type = 'image/png', size = 1024) => {
  const file = new File(['a'.repeat(size)], name, { type })
  return file
}

// Helper to render Upload with a given auth state
const renderUpload = (isSignedIn: boolean, onComplete?: (data: string) => void) => {
  mockUseOutletContext.mockReturnValue({ isSignedIn })
  return render(<Upload onComplete={onComplete} />)
}

describe('Upload', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockUseOutletContext.mockReturnValue({ isSignedIn: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  // ─── Initial render ────────────────────────────────────────────────────────

  describe('initial render (no file selected)', () => {
    it('renders the dropzone when no file is selected', () => {
      renderUpload(true)
      expect(document.querySelector('.dropzone')).toBeInTheDocument()
    })

    it('renders the upload icon', () => {
      renderUpload(true)
      expect(screen.getByTestId('upload-icon')).toBeInTheDocument()
    })

    it('renders the maximum file size hint', () => {
      renderUpload(true)
      expect(screen.getByText('Maximum file size 50 MB.')).toBeInTheDocument()
    })
  })

  // ─── Signed-in state ───────────────────────────────────────────────────────

  describe('when user is signed in', () => {
    it('shows the upload instruction text', () => {
      renderUpload(true)
      expect(screen.getByText('Click to upload or just drag and drop')).toBeInTheDocument()
    })

    it('does not show the sign-in prompt', () => {
      renderUpload(true)
      expect(screen.queryByText('Sign in or sign up with Puter to upload')).not.toBeInTheDocument()
    })

    it('file input is enabled', () => {
      renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(input.disabled).toBe(false)
    })
  })

  // ─── Signed-out state ──────────────────────────────────────────────────────

  describe('when user is not signed in', () => {
    it('shows the sign-in prompt instead of upload text', () => {
      renderUpload(false)
      expect(screen.getByText('Sign in or sign up with Puter to upload')).toBeInTheDocument()
    })

    it('does not show the upload instruction text', () => {
      renderUpload(false)
      expect(screen.queryByText('Click to upload or just drag and drop')).not.toBeInTheDocument()
    })

    it('file input is disabled', () => {
      renderUpload(false)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(input.disabled).toBe(true)
    })

    it('does not process a file when not signed in', async () => {
      const onComplete = vi.fn()
      renderUpload(false, onComplete)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile()

      // Simulate change even though input is disabled – processFile guards on isSignedIn
      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      expect(document.querySelector('.upload-status')).not.toBeInTheDocument()
      expect(onComplete).not.toHaveBeenCalled()
    })
  })

  // ─── File input change ─────────────────────────────────────────────────────

  describe('file input change handler', () => {
    it('shows upload-status after a file is selected', async () => {
      renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile()

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      expect(document.querySelector('.upload-status')).toBeInTheDocument()
    })

    it('displays the file name after selection', async () => {
      renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('my-floor.png')

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      expect(screen.getByText('my-floor.png')).toBeInTheDocument()
    })

    it('shows the image icon while progress < 100', async () => {
      renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile()

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      expect(screen.getByTestId('image-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('check-circle-icon')).not.toBeInTheDocument()
    })

    it('shows "Analyzing Floor Plan..." text while progress < 100', async () => {
      renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile()

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      expect(screen.getByText('Analyzing Floor Plan...')).toBeInTheDocument()
    })

    it('ignores change event when no file is provided', async () => {
      renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      await act(async () => {
        fireEvent.change(input, { target: { files: [] } })
      })

      expect(document.querySelector('.upload-status')).not.toBeInTheDocument()
    })
  })

  // ─── Progress simulation ───────────────────────────────────────────────────

  describe('progress simulation', () => {
    // Mock FileReader so onload fires synchronously with predictable data
    beforeEach(() => {
      const MockFileReader = vi.fn().mockImplementation(function (this: {
        onload: ((e: ProgressEvent<FileReader>) => void) | null
        readAsDataURL: (file: File) => void
      }) {
        this.onload = null
        this.readAsDataURL = function () {
          const event = {
            target: { result: 'data:image/png;base64,abc123' },
          } as unknown as ProgressEvent<FileReader>
          this.onload?.(event)
        }
      })
      vi.stubGlobal('FileReader', MockFileReader)
    })

    it('progress increments by PROGRESS_STEP on each interval tick', async () => {
      renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile()

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      // Advance one interval tick
      await act(async () => {
        vi.advanceTimersByTime(PROGRESS_INTERVAL_MS)
      })

      const bar = document.querySelector('.bar') as HTMLElement
      expect(bar.style.width).toBe(`${PROGRESS_STEP}%`)
    })

    it('progress reaches 100% after enough ticks', async () => {
      renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile()

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      // Advance enough time for progress to reach 100
      const ticksNeeded = Math.ceil(100 / PROGRESS_STEP)
      await act(async () => {
        vi.advanceTimersByTime(PROGRESS_INTERVAL_MS * ticksNeeded)
      })

      const bar = document.querySelector('.bar') as HTMLElement
      expect(bar.style.width).toBe('100%')
    })

    it('shows check icon when progress reaches 100', async () => {
      renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile()

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      const ticksNeeded = Math.ceil(100 / PROGRESS_STEP)
      await act(async () => {
        vi.advanceTimersByTime(PROGRESS_INTERVAL_MS * ticksNeeded)
      })

      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('image-icon')).not.toBeInTheDocument()
    })

    it('shows "Redirecting..." text when progress reaches 100', async () => {
      renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile()

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      const ticksNeeded = Math.ceil(100 / PROGRESS_STEP)
      await act(async () => {
        vi.advanceTimersByTime(PROGRESS_INTERVAL_MS * ticksNeeded)
      })

      expect(screen.getByText('Redirecting...')).toBeInTheDocument()
    })

    it('calls onComplete with base64 data after redirect delay', async () => {
      const onComplete = vi.fn()
      renderUpload(true, onComplete)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile()

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      const ticksNeeded = Math.ceil(100 / PROGRESS_STEP)
      await act(async () => {
        vi.advanceTimersByTime(PROGRESS_INTERVAL_MS * ticksNeeded)
      })

      // onComplete should NOT be called before the redirect delay
      expect(onComplete).not.toHaveBeenCalled()

      // Advance past the redirect delay
      await act(async () => {
        vi.advanceTimersByTime(REDIRECT_DELAY_MS)
      })

      expect(onComplete).toHaveBeenCalledOnce()
      expect(onComplete).toHaveBeenCalledWith('data:image/png;base64,abc123')
    })

    it('does not call onComplete if not provided', async () => {
      renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile()

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      const ticksNeeded = Math.ceil(100 / PROGRESS_STEP)
      await act(async () => {
        vi.advanceTimersByTime(PROGRESS_INTERVAL_MS * ticksNeeded + REDIRECT_DELAY_MS)
      })
      // No error should be thrown even without onComplete
    })
  })

  // ─── Drag and drop ─────────────────────────────────────────────────────────

  describe('drag and drop', () => {
    it('adds "dragging" class to dropzone on dragover when signed in', async () => {
      renderUpload(true)
      const dropzone = document.querySelector('.dropzone') as HTMLElement

      await act(async () => {
        fireEvent.dragOver(dropzone)
      })

      expect(dropzone).toHaveClass('dragging')
    })

    it('does not add "dragging" class on dragover when not signed in', async () => {
      renderUpload(false)
      const dropzone = document.querySelector('.dropzone') as HTMLElement

      await act(async () => {
        fireEvent.dragOver(dropzone)
      })

      expect(dropzone).not.toHaveClass('dragging')
    })

    it('removes "dragging" class on dragleave', async () => {
      renderUpload(true)
      const dropzone = document.querySelector('.dropzone') as HTMLElement

      await act(async () => {
        fireEvent.dragOver(dropzone)
      })
      expect(dropzone).toHaveClass('dragging')

      await act(async () => {
        fireEvent.dragLeave(dropzone)
      })
      expect(dropzone).not.toHaveClass('dragging')
    })

    it('processes image file on drop when signed in', async () => {
      renderUpload(true)
      const dropzone = document.querySelector('.dropzone') as HTMLElement
      const file = createMockFile('plan.jpg', 'image/jpeg')

      await act(async () => {
        fireEvent.drop(dropzone, {
          dataTransfer: { files: [file] },
        })
      })

      expect(document.querySelector('.upload-status')).toBeInTheDocument()
      expect(screen.getByText('plan.jpg')).toBeInTheDocument()
    })

    it('does not process a non-image file on drop', async () => {
      renderUpload(true)
      const dropzone = document.querySelector('.dropzone') as HTMLElement
      const pdfFile = new File(['content'], 'document.pdf', { type: 'application/pdf' })

      await act(async () => {
        fireEvent.drop(dropzone, {
          dataTransfer: { files: [pdfFile] },
        })
      })

      expect(document.querySelector('.upload-status')).not.toBeInTheDocument()
    })

    it('does not process a file on drop when not signed in', async () => {
      const onComplete = vi.fn()
      renderUpload(false, onComplete)
      const dropzone = document.querySelector('.dropzone') as HTMLElement
      const file = createMockFile()

      await act(async () => {
        fireEvent.drop(dropzone, {
          dataTransfer: { files: [file] },
        })
      })

      expect(document.querySelector('.upload-status')).not.toBeInTheDocument()
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('removes "dragging" class on drop regardless of auth state', async () => {
      renderUpload(true)
      const dropzone = document.querySelector('.dropzone') as HTMLElement

      await act(async () => {
        fireEvent.dragOver(dropzone)
      })
      expect(dropzone).toHaveClass('dragging')

      await act(async () => {
        fireEvent.drop(dropzone, {
          dataTransfer: { files: [] },
        })
      })
      expect(dropzone).not.toHaveClass('dragging')
    })

    it('handles drop with no files gracefully', async () => {
      renderUpload(true)
      const dropzone = document.querySelector('.dropzone') as HTMLElement

      await act(async () => {
        fireEvent.drop(dropzone, {
          dataTransfer: { files: [] },
        })
      })

      expect(document.querySelector('.upload-status')).not.toBeInTheDocument()
    })
  })

  // ─── Cleanup ───────────────────────────────────────────────────────────────

  describe('cleanup on unmount', () => {
    it('clears the interval when unmounted during upload', async () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

      // Mock FileReader as a constructor
      const MockFileReader = vi.fn().mockImplementation(function (this: {
        onload: ((e: ProgressEvent<FileReader>) => void) | null
        readAsDataURL: () => void
      }) {
        this.onload = null
        this.readAsDataURL = function () {
          const event = {
            target: { result: 'data:image/png;base64,xyz' },
          } as unknown as ProgressEvent<FileReader>
          this.onload?.(event)
        }
      })
      vi.stubGlobal('FileReader', MockFileReader)

      const { unmount } = renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile()

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      // Advance one tick so interval is running
      await act(async () => {
        vi.advanceTimersByTime(PROGRESS_INTERVAL_MS)
      })

      clearIntervalSpy.mockClear()
      unmount()

      // The cleanup effect should call clearInterval
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  // ─── File input accept attribute ───────────────────────────────────────────

  describe('file input configuration', () => {
    it('accepts only jpg, png, and jpeg files', () => {
      renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(input.accept).toBe('.jpg, .png, .jpeg')
    })
  })

  // ─── Progress bar style ────────────────────────────────────────────────────

  describe('progress bar', () => {
    beforeEach(() => {
      const MockFileReader = vi.fn().mockImplementation(function (this: {
        onload: ((e: ProgressEvent<FileReader>) => void) | null
        readAsDataURL: () => void
      }) {
        this.onload = null
        this.readAsDataURL = function () {
          const event = {
            target: { result: 'data:image/png;base64,test' },
          } as unknown as ProgressEvent<FileReader>
          this.onload?.(event)
        }
      })
      vi.stubGlobal('FileReader', MockFileReader)
    })

    it('starts at 0% width', async () => {
      renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile()

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      // Before first tick
      const bar = document.querySelector('.bar') as HTMLElement
      expect(bar.style.width).toBe('0%')
    })

    it('width reflects progress percentage', async () => {
      renderUpload(true)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile()

      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      await act(async () => {
        vi.advanceTimersByTime(PROGRESS_INTERVAL_MS * 4)
      })

      const bar = document.querySelector('.bar') as HTMLElement
      expect(bar.style.width).toBe(`${PROGRESS_STEP * 4}%`)
    })
  })
})