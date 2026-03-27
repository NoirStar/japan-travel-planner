import "@testing-library/jest-dom"

// IntersectionObserver polyfill for framer-motion whileInView in jsdom
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null
    readonly rootMargin: string = ""
    readonly thresholds: ReadonlyArray<number> = []
    constructor(private _cb: IntersectionObserverCallback, _opts?: IntersectionObserverInit) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] { return [] }
  } as unknown as typeof globalThis.IntersectionObserver
}
