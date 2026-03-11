import { useEffect, useRef, type ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"

interface RequireAuthProps {
  children: ReactNode
  redirectTo: string
}

export function RequireAuth({ children, redirectTo }: RequireAuthProps) {
  const location = useLocation()
  const { user, isLoading, setShowLoginModal } = useAuthStore()
  const promptedRef = useRef(false)

  useEffect(() => {
    if (!isLoading && !user && !promptedRef.current) {
      promptedRef.current = true
      setShowLoginModal(true)
    }
  }, [isLoading, setShowLoginModal, user])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />
  }

  return <>{children}</>
}
