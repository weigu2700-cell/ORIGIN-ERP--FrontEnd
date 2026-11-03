import { afterEach, describe, expect, it, vi } from 'vitest'
import { uuid } from '@/utils/uuid'

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('uuid', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('安全上下文使用 crypto.randomUUID', () => {
    expect(uuid()).toMatch(V4)
  })

  it('非安全上下文（没有 randomUUID，例如 http://局域网IP）退回 getRandomValues，仍是合法 v4', () => {
    const real = globalThis.crypto
    vi.stubGlobal('crypto', { getRandomValues: (a: Uint8Array<ArrayBuffer>) => real.getRandomValues(a) })
    const ids = new Set(Array.from({ length: 50 }, () => uuid()))
    expect(ids.size).toBe(50)
    for (const id of ids) expect(id).toMatch(V4)
  })
})
