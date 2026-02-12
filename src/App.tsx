import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"

function App() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">일본 여행 플래너</CardTitle>
          </div>
          <p className="text-muted-foreground text-sm">
            나만의 완벽한 일본 여행을 계획하세요
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button size="lg" className="w-full">
            🤖 AI에게 추천받기
          </Button>
          <Button variant="outline" size="lg" className="w-full">
            ✏️ 직접 커스텀으로 만들기
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
