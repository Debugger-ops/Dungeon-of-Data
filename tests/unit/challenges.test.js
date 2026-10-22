import { describe, it, expect } from 'vitest'
import { CHALLENGES } from '../../src/lib/challenges.js'
import { runTestsSync } from '../../src/lib/runner.js'

describe('write-the-code challenges', () => {
  for (const c of CHALLENGES) {
    it(`${c.id}: reference solution passes every test`, () => {
      const r = runTestsSync(c.solution, c.fn, c.tests)
      expect(r.compileError).toBeUndefined()
      expect(r.results.filter((x) => !x.pass)).toEqual([])
    })
    it(`${c.id}: starter stub does not pass everything`, () => {
      const r = runTestsSync(c.starter, c.fn, c.tests)
      expect(r.results.every((x) => x.pass)).toBe(false)
    })
  }
  it('reports syntax errors and a missing function', () => {
    expect(runTestsSync('function (', 'f', []).compileError).toBeTruthy()
    expect(runTestsSync('const x = 1', 'f', []).compileError).toMatch(/Define a function/)
  })
  it('reports thrown errors per test without crashing', () => {
    const r = runTestsSync('function f(){ throw new Error("boom") }', 'f', [{ args: [], want: 1 }])
    expect(r.results[0]).toMatchObject({ pass: false, err: 'boom' })
  })
})
