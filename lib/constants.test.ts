import { describe, it, expect } from 'vitest'
import {
  STORAGE_PATHS,
  SHARE_STATUS_RESET_DELAY_MS,
  PROGRESS_INCREMENT,
  REDIRECT_DELAY_MS,
  PROGRESS_INTERVAL_MS,
  PROGRESS_STEP,
  GRID_OVERLAY_SIZE,
  GRID_COLOR,
  UNAUTHORIZED_STATUSES,
  IMAGE_RENDER_DIMENSION,
  ROOMIFY_RENDER_PROMPT,
} from './constants'

describe('constants', () => {
  describe('STORAGE_PATHS', () => {
    it('has ROOT path', () => {
      expect(STORAGE_PATHS.ROOT).toBe('roomify')
    })

    it('has SOURCES path', () => {
      expect(STORAGE_PATHS.SOURCES).toBe('roomify/sources')
    })

    it('has RENDERS path', () => {
      expect(STORAGE_PATHS.RENDERS).toBe('roomify/renders')
    })

    it('SOURCES and RENDERS are nested under ROOT', () => {
      expect(STORAGE_PATHS.SOURCES.startsWith(STORAGE_PATHS.ROOT + '/')).toBe(true)
      expect(STORAGE_PATHS.RENDERS.startsWith(STORAGE_PATHS.ROOT + '/')).toBe(true)
    })
  })

  describe('timing constants', () => {
    it('SHARE_STATUS_RESET_DELAY_MS is 1500', () => {
      expect(SHARE_STATUS_RESET_DELAY_MS).toBe(1500)
    })

    it('PROGRESS_INCREMENT is 15', () => {
      expect(PROGRESS_INCREMENT).toBe(15)
    })

    it('REDIRECT_DELAY_MS is 600', () => {
      expect(REDIRECT_DELAY_MS).toBe(600)
    })

    it('PROGRESS_INTERVAL_MS is 100', () => {
      expect(PROGRESS_INTERVAL_MS).toBe(100)
    })

    it('PROGRESS_STEP is 5', () => {
      expect(PROGRESS_STEP).toBe(5)
    })

    it('PROGRESS_STEP divides evenly into 100', () => {
      expect(100 % PROGRESS_STEP).toBe(0)
    })
  })

  describe('UI constants', () => {
    it('GRID_OVERLAY_SIZE is "60px 60px"', () => {
      expect(GRID_OVERLAY_SIZE).toBe('60px 60px')
    })

    it('GRID_COLOR is a valid hex color', () => {
      expect(GRID_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })

    it('GRID_COLOR is "#3B82F6"', () => {
      expect(GRID_COLOR).toBe('#3B82F6')
    })
  })

  describe('HTTP status codes', () => {
    it('UNAUTHORIZED_STATUSES contains 401', () => {
      expect(UNAUTHORIZED_STATUSES).toContain(401)
    })

    it('UNAUTHORIZED_STATUSES contains 403', () => {
      expect(UNAUTHORIZED_STATUSES).toContain(403)
    })

    it('UNAUTHORIZED_STATUSES has exactly 2 entries', () => {
      expect(UNAUTHORIZED_STATUSES).toHaveLength(2)
    })
  })

  describe('image constants', () => {
    it('IMAGE_RENDER_DIMENSION is 1024', () => {
      expect(IMAGE_RENDER_DIMENSION).toBe(1024)
    })
  })

  describe('ROOMIFY_RENDER_PROMPT', () => {
    it('is a non-empty string', () => {
      expect(typeof ROOMIFY_RENDER_PROMPT).toBe('string')
      expect(ROOMIFY_RENDER_PROMPT.length).toBeGreaterThan(0)
    })

    it('has no leading or trailing whitespace (is trimmed)', () => {
      expect(ROOMIFY_RENDER_PROMPT).toBe(ROOMIFY_RENDER_PROMPT.trim())
    })

    it('contains the TASK directive', () => {
      expect(ROOMIFY_RENDER_PROMPT).toContain('TASK:')
    })

    it('contains key rendering instructions', () => {
      expect(ROOMIFY_RENDER_PROMPT).toContain('TOP‑DOWN')
      expect(ROOMIFY_RENDER_PROMPT).toContain('REMOVE ALL TEXT')
      expect(ROOMIFY_RENDER_PROMPT).toContain('GEOMETRY MUST MATCH')
    })

    it('mentions photorealistic output', () => {
      expect(ROOMIFY_RENDER_PROMPT.toLowerCase()).toContain('photorealistic')
    })
  })
})