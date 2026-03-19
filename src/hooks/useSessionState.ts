import { useState, useEffect } from "react"

/**
 * `useState` 와 동일한 인터페이스이나, 값을 sessionStorage 에 동기화하여
 * 컴포넌트 언마운트 → 재마운트 시 이전 값을 복원한다.
 */
export function useSessionState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key)
      return stored !== null ? (JSON.parse(stored) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch { /* quota exceeded — ignore */ }
  }, [key, value])

  return [value, setValue] as const
}
