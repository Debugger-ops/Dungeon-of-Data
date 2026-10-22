// Runs the player's code against test cases. Pure and self-contained so it can run inline (tests) or inside a Web Worker.
// Everything is compared as JSON, so tests use plain data: numbers, strings, arrays, objects, null.
export function runTestsSync(code, fn, tests) {
  let f
  try {
    f = new Function('"use strict";\n' + code + '\n;return typeof ' + fn + " === 'function' ? " + fn + ' : null')()
  } catch (e) {
    return { compileError: String((e && e.message) || e), results: [] }
  }
  if (!f) return { compileError: 'Define a function named ' + fn + '.', results: [] }
  const results = []
  for (const t of tests) {
    try {
      const got = f(...JSON.parse(JSON.stringify(t.args)))
      const pass = JSON.stringify(got) === JSON.stringify(t.want)
      const g = got === undefined ? 'undefined' : JSON.stringify(got)
      results.push({ pass, got: g.length > 60 ? g.slice(0, 57) + '...' : g })
    } catch (e) {
      results.push({ pass: false, err: String((e && e.message) || e) })
    }
  }
  return { results }
}

const WORKER_SRC = `const run = ${runTestsSync.toString()};self.onmessage = (e) => { const d = e.data; self.postMessage(run(d.code, d.fn, d.tests)) }`

// Runs in a Web Worker so an infinite loop cannot freeze the page; the worker is killed after `ms`.
export function runCode(code, fn, tests, ms = 2500) {
  if (typeof Worker === 'undefined' || typeof Blob === 'undefined') return Promise.resolve(runTestsSync(code, fn, tests))
  return new Promise((resolve) => {
    let url
    let w
    try {
      url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }))
      w = new Worker(url)
    } catch {
      if (url) URL.revokeObjectURL(url)
      return resolve(runTestsSync(code, fn, tests))
    }
    const done = (r) => {
      clearTimeout(timer)
      w.terminate()
      URL.revokeObjectURL(url)
      resolve(r)
    }
    const timer = setTimeout(() => done({ timeout: true, results: [] }), ms)
    w.onmessage = (e) => done(e.data)
    w.onerror = (e) => done({ compileError: e.message || 'Script error', results: [] })
    w.postMessage({ code, fn, tests })
  })
}
