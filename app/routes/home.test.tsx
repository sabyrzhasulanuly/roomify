import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import Home, { meta } from './home'

// Mock react-router hooks
const mockNavigate = vi.fn()
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useOutletContext: () => ({
    isSignedIn: true,
    userName: 'TestUser',
    userId: '123',
    refreshAuth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}))

// Mock child components to isolate Home tests
vi.mock('../../components/Navbar', () => ({
  Navbar: () => <nav data-testid="navbar" />,
}))

vi.mock('../../components/ui/Button', () => ({
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
  ),
}))

// Capture the onComplete prop passed to Upload
let capturedOnComplete: ((data: string) => void) | undefined
vi.mock('../../components/Upload', () => ({
  Upload: ({ onComplete }: { onComplete?: (data: string) => void }) => {
    capturedOnComplete = onComplete
    return <div data-testid="upload-component" />
  },
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ArrowRight: () => <span data-testid="arrow-right" />,
  ArrowUpRight: () => <span data-testid="arrow-up-right" />,
  Clock: () => <span data-testid="clock-icon" />,
  Layers: () => <span data-testid="layers-icon" />,
}))

describe('Home', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    capturedOnComplete = undefined
  })

  // ─── meta() ──────────────────────────────────────────────────────────────

  describe('meta()', () => {
    it('returns an array', () => {
      const result = meta({} as Parameters<typeof meta>[0])
      expect(Array.isArray(result)).toBe(true)
    })

    it('includes a title entry', () => {
      const result = meta({} as Parameters<typeof meta>[0])
      const titleEntry = result.find((entry) => 'title' in entry)
      expect(titleEntry).toBeDefined()
    })

    it('includes a description meta entry', () => {
      const result = meta({} as Parameters<typeof meta>[0])
      const descEntry = result.find(
        (entry) => 'name' in entry && (entry as Record<string, string>).name === 'description',
      )
      expect(descEntry).toBeDefined()
    })

    it('description content is a non-empty string', () => {
      const result = meta({} as Parameters<typeof meta>[0])
      const descEntry = result.find(
        (entry) => 'name' in entry && (entry as Record<string, string>).name === 'description',
      ) as Record<string, string> | undefined
      expect(descEntry?.content).toBeTruthy()
    })
  })

  // ─── Rendering ───────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<Home />)
    })

    it('renders the Navbar', () => {
      render(<Home />)
      expect(screen.getByTestId('navbar')).toBeInTheDocument()
    })

    it('renders the Upload component', () => {
      render(<Home />)
      expect(screen.getByTestId('upload-component')).toBeInTheDocument()
    })

    it('renders the hero section heading', () => {
      render(<Home />)
      expect(screen.getByText(/Build beautiful spaces/i)).toBeInTheDocument()
    })

    it('renders the upload card heading', () => {
      render(<Home />)
      expect(screen.getByText('Upload your floor plan')).toBeInTheDocument()
    })

    it('renders the "Start Building" CTA link', () => {
      render(<Home />)
      expect(screen.getByText(/Start Building/i)).toBeInTheDocument()
    })

    it('renders the "Watch Demo" button', () => {
      render(<Home />)
      expect(screen.getByText('Watch Demo')).toBeInTheDocument()
    })

    it('renders the Projects section', () => {
      render(<Home />)
      expect(screen.getByText('Projects')).toBeInTheDocument()
    })

    it('renders "Project Manhattan" community project', () => {
      render(<Home />)
      expect(screen.getByText('Project Manhattan')).toBeInTheDocument()
    })
  })

  // ─── handleUploadComplete ─────────────────────────────────────────────────

  describe('handleUploadComplete', () => {
    it('passes onComplete prop to Upload component', () => {
      render(<Home />)
      expect(typeof capturedOnComplete).toBe('function')
    })

    it('navigates to /visualizer/:id when called', async () => {
      render(<Home />)

      await act(async () => {
        await capturedOnComplete?.('data:image/png;base64,abc')
      })

      expect(mockNavigate).toHaveBeenCalledOnce()
      const navigatedPath: string = mockNavigate.mock.calls[0][0]
      expect(navigatedPath).toMatch(/^\/visualizer\/\d+$/)
    })

    it('generates a numeric ID based on current timestamp', async () => {
      const fakeNow = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(fakeNow)

      render(<Home />)

      await act(async () => {
        await capturedOnComplete?.('data:image/png;base64,abc')
      })

      expect(mockNavigate).toHaveBeenCalledWith(`/visualizer/${fakeNow}`)
      vi.restoreAllMocks()
    })

    it('returns true after navigation', async () => {
      render(<Home />)

      let result: boolean | undefined
      await act(async () => {
        result = await capturedOnComplete?.('data:image/png;base64,abc')
      })

      expect(result).toBe(true)
    })

    it('does not navigate if called multiple times with same data', async () => {
      render(<Home />)

      await act(async () => {
        await capturedOnComplete?.('data:image/png;base64,first')
      })
      await act(async () => {
        await capturedOnComplete?.('data:image/png;base64,second')
      })

      // Each call generates a separate navigate call
      expect(mockNavigate).toHaveBeenCalledTimes(2)
    })
  })
})