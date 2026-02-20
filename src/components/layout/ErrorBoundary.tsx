import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-xl font-bold">문제가 발생했습니다</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              예기치 않은 오류가 발생했습니다. 페이지를 새로고침하거나 홈으로 돌아가주세요.
            </p>
            {this.state.error && (
              <details className="mt-4 rounded-lg bg-muted/50 p-3 text-left text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium">오류 상세</summary>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={this.handleReload} className="gap-2 rounded-xl" variant="outline">
                <RefreshCw className="h-4 w-4" />
                새로고침
              </Button>
              <Button onClick={this.handleGoHome} className="btn-gradient gap-2 rounded-xl">
                <Home className="h-4 w-4" />
                홈으로
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
