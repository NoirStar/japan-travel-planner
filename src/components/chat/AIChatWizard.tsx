import { useEffect, useRef, useCallback, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Send, Loader2, Sparkles, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWizardStore } from "@/stores/wizardStore"
import { useScheduleStore } from "@/stores/scheduleStore"
import { getNextStep, getAIResponseText } from "@/services/wizardEngine"
import { buildTripFromSelections } from "@/services/tripBuilder"
import {
  fetchAIRecommendation,
  buildTripFromAIResponse,
} from "@/services/aiRecommendService"
import { ChatBubble } from "./ChatBubble"
import { TripSummary } from "./TripSummary"
import { CityStep } from "./steps/CityStep"
import { DurationStep } from "./steps/DurationStep"
import { StyleStep } from "./steps/StyleStep"
import { DayThemeStep } from "./steps/DayThemeStep"
import { MealStep } from "./steps/MealStep"
import { cities } from "@/data/cities"
import { TRAVEL_STYLES } from "@/types/wizard"
import type { TravelStyleId, DayThemeId } from "@/types/wizard"
import { DAY_THEMES } from "@/types/wizard"

export function AIChatWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [freeInput, setFreeInput] = useState("")
  const [isAILoading, setIsAILoading] = useState(false)
  const initialPromptHandled = useRef(false)

  const {
    selections,
    chatHistory,
    currentStep,
    addAIMessage,
    addUserMessage,
    setStep,
    selectCity,
    selectDuration,
    selectStyles,
    selectDayTheme,
    selectMeal,
    skipMeal,
    setCompleted,
    reset,
  } = useWizardStore()

  // ── 초기 메시지 ────────────────────────────────────────
  useEffect(() => {
    if (chatHistory.length === 0) {
      addAIMessage("안녕하세요! AI 여행 플래너입니다. 함께 멋진 일본 여행을 만들어볼까요?")
      addAIMessage("단계별로 선택하거나, 아래 입력창에 자유롭게 원하는 여행을 말씀해주세요!")
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 랜딩에서 프롬프트 전달 시 자동 호출 ────────────────
  useEffect(() => {
    const prompt = searchParams.get("prompt")
    if (prompt && !initialPromptHandled.current) {
      initialPromptHandled.current = true
      // 약간의 딜레이 후 AI 호출
      setTimeout(() => {
        handleFreeChat(prompt)
      }, 500)
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 자동 스크롤 ────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatHistory.length, currentStep])

  // ── 선택 핸들러들 ──────────────────────────────────────
  const handleCitySelect = useCallback(
    (id: string) => {
      const city = cities.find((c) => c.id === id)
      addUserMessage(city?.name ?? id)
      selectCity(id)
      setTimeout(() => {
        addAIMessage(getAIResponseText("city", city?.name ?? id))
        setTimeout(() => {
          const next = getNextStep({ ...selections, cityId: id })
          if (next) {
            addAIMessage(next.question)
            setStep(next.type)
          }
        }, 300)
      }, 200)
    },
    [selections, addUserMessage, selectCity, addAIMessage, setStep],
  )

  const handleDurationSelect = useCallback(
    (id: string) => {
      const days = parseInt(id, 10)
      const labels: Record<number, string> = { 2: "1박 2일", 3: "2박 3일", 4: "3박 4일" }
      addUserMessage(labels[days] ?? `${days}일`)
      selectDuration(days)
      setTimeout(() => {
        addAIMessage(getAIResponseText("duration", labels[days] ?? `${days}일`))
        setTimeout(() => {
          const next = getNextStep({ ...selections, duration: days })
          if (next) {
            addAIMessage(next.question)
            setStep(next.type)
          }
        }, 300)
      }, 200)
    },
    [selections, addUserMessage, selectDuration, addAIMessage, setStep],
  )

  const handleStyleSelect = useCallback(
    (ids: string[]) => {
      const labels = ids
        .map((id) => TRAVEL_STYLES.find((s) => s.id === id)?.label ?? id)
        .join(", ")
      addUserMessage(labels)
      selectStyles(ids as TravelStyleId[])
      setTimeout(() => {
        addAIMessage(getAIResponseText("style", labels))
        setTimeout(() => {
          const next = getNextStep({ ...selections, styles: ids as TravelStyleId[] })
          if (next) {
            addAIMessage(next.question)
            setStep(next.type)
          }
        }, 300)
      }, 200)
    },
    [selections, addUserMessage, selectStyles, addAIMessage, setStep],
  )

  const handleDayThemeSelect = useCallback(
    (themeId: string, dayNumber: number) => {
      const label = DAY_THEMES.find((t) => t.id === themeId)?.label ?? themeId
      addUserMessage(`Day ${dayNumber}: ${label}`)
      selectDayTheme(dayNumber, themeId as DayThemeId)
      setTimeout(() => {
        addAIMessage(getAIResponseText("dayTheme", label))
        setTimeout(() => {
          const next = getNextStep({
            ...selections,
            dayThemes: { ...selections.dayThemes, [dayNumber]: themeId as DayThemeId },
          })
          if (next) {
            addAIMessage(next.question)
            setStep(next.type)
          }
        }, 300)
      }, 200)
    },
    [selections, addUserMessage, selectDayTheme, addAIMessage, setStep],
  )

  const handleMealSelect = useCallback(
    (placeId: string, dayNumber: number, mealType: "lunch" | "dinner", label: string) => {
      addUserMessage(label)
      selectMeal(dayNumber, mealType, placeId)
      setTimeout(() => {
        addAIMessage(getAIResponseText("meal", label))
        setTimeout(() => {
          const next = getNextStep({
            ...selections,
            meals: { ...selections.meals, [`${dayNumber}-${mealType}`]: placeId },
          })
          if (next) {
            addAIMessage(next.question)
            setStep(next.type)
          }
        }, 300)
      }, 200)
    },
    [selections, addUserMessage, selectMeal, addAIMessage, setStep],
  )

  const handleMealSkip = useCallback(
    (dayNumber: number, mealType: "lunch" | "dinner") => {
      const mealLabel = mealType === "lunch" ? "점심" : "저녁"
      addUserMessage(`${mealLabel} 건너뛰기`)
      skipMeal(dayNumber, mealType)
      setTimeout(() => {
        addAIMessage("알겠어요, 건너뛸게요!")
        setTimeout(() => {
          const next = getNextStep({
            ...selections,
            meals: { ...selections.meals, [`${dayNumber}-${mealType}`]: "__skipped__" },
          })
          if (next) {
            addAIMessage(next.question)
            setStep(next.type)
          }
        }, 300)
      }, 200)
    },
    [selections, addUserMessage, skipMeal, addAIMessage, setStep],
  )

  // ── 요약 확인 → 플래너로 ──────────────────────────────
  const handleConfirm = useCallback(() => {
    const trip = buildTripFromSelections(selections)
    if (!trip) return

    const store = useScheduleStore.getState()
    store.setActiveTrip(null)
    // scheduleStore에 직접 trip을 넣기 위해 createTrip 대신 수동 추가
    useScheduleStore.setState((s) => ({
      trips: [...s.trips, trip],
      activeTripId: trip.id,
    }))

    setCompleted(true)
    navigate(`/planner?city=${selections.cityId}`)
  }, [selections, navigate, setCompleted])

  const handleReset = useCallback(() => {
    reset()
    addAIMessage("안녕하세요! AI 여행 플래너입니다. 함께 멋진 일본 여행을 만들어볼까요?")
    addAIMessage("단계별로 선택하거나, 아래 입력창에 자유롭게 원하는 여행을 말씀해주세요!")
  }, [reset, addAIMessage])

  // ── 자유 대화 AI 추천 ──────────────────────────────────
  const handleFreeChat = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || isAILoading) return

      addUserMessage(prompt.trim())
      setFreeInput("")
      setIsAILoading(true)

      // 기존 단계별 선택 UI를 숨기기 위해 step을 임시로 null 처럼 처리
      addAIMessage("잠시만요, 맞춤 일정을 만들고 있어요...")

      try {
        const response = await fetchAIRecommendation(prompt.trim())
        const trip = buildTripFromAIResponse(response)

        // 결과 메시지
        const daysSummary = response.days
          .map(
            (d) =>
              `Day ${d.dayNumber} — ${d.theme} (${d.items.length}곳)`,
          )
          .join("\n")
        addAIMessage(
          `${response.title} 일정을 만들었어요!\n\n${daysSummary}\n\n${response.summary}`,
        )
        addAIMessage("플래너로 이동할까요? 아래 버튼을 눌러주세요!")

        // scheduleStore에 trip 추가
        const store = useScheduleStore.getState()
        store.setActiveTrip(null)
        useScheduleStore.setState((s) => ({
          trips: [...s.trips, trip],
          activeTripId: trip.id,
        }))

        setCompleted(true)

        // 3초 후 자동 이동
        setTimeout(() => {
          navigate(`/planner?city=${response.cityId}`)
        }, 3000)
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "AI 추천에 실패했어요"
        addAIMessage(`죄송해요, 오류가 발생했어요.\n${msg}\n\n다시 시도하거나 단계별로 선택해주세요!`)
      } finally {
        setIsAILoading(false)
      }
    },
    [isAILoading, addUserMessage, addAIMessage, setCompleted, navigate],
  )

  const handleFreeChatSubmit = useCallback(() => {
    handleFreeChat(freeInput)
  }, [freeInput, handleFreeChat])

  const handleFreeChatKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
        e.preventDefault()
        handleFreeChatSubmit()
      }
    },
    [handleFreeChatSubmit],
  )

  // ── 현재 스텝 정보 ────────────────────────────────────
  const stepInfo = getNextStep(selections)

  return (
    <div className="flex h-screen flex-col pt-14 bg-sakura-pattern" data-testid="wizard-page">
      {/* 헤더 */}
      <div className="flex items-center gap-3 border-b border-border/50 glass px-4 py-2.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          aria-label="돌아가기"
          data-testid="wizard-back"
          className="h-8 w-8 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sakura-dark to-indigo text-sm text-white shadow-sm"><Bot className="h-4 w-4" /></div>
          <h1 className="text-sm font-bold">AI 여행 플래너</h1>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4"
        data-testid="chat-area"
      >
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          {/* 채팅 메시지 */}
          {chatHistory.map((msg) => (
            <ChatBubble key={msg.id} role={msg.role} text={msg.text} />
          ))}

          {/* 현재 스텝 UI */}
          {!isAILoading && stepInfo && currentStep === stepInfo.type && (
            <div className="mt-2">
              {stepInfo.type === "city" && (
                <CityStep options={stepInfo.options} onSelect={handleCitySelect} />
              )}
              {stepInfo.type === "duration" && (
                <DurationStep options={stepInfo.options} onSelect={handleDurationSelect} />
              )}
              {stepInfo.type === "style" && (
                <StyleStep options={stepInfo.options} onSelect={handleStyleSelect} />
              )}
              {stepInfo.type === "dayTheme" && stepInfo.dayNumber && (
                <DayThemeStep
                  options={stepInfo.options}
                  dayNumber={stepInfo.dayNumber}
                  onSelect={(id) => handleDayThemeSelect(id, stepInfo.dayNumber!)}
                />
              )}
              {stepInfo.type === "meal" && stepInfo.dayNumber && stepInfo.mealType && (
                <MealStep
                  options={stepInfo.options}
                  dayNumber={stepInfo.dayNumber}
                  mealType={stepInfo.mealType}
                  onSelect={(id) => {
                    const opt = stepInfo.options.find((o) => o.id === id)
                    handleMealSelect(id, stepInfo.dayNumber!, stepInfo.mealType!, opt?.label ?? id)
                  }}
                  onSkip={() => handleMealSkip(stepInfo.dayNumber!, stepInfo.mealType!)}
                />
              )}
              {stepInfo.type === "summary" && (
                <TripSummary
                  selections={selections}
                  onConfirm={handleConfirm}
                  onReset={handleReset}
                />
              )}
            </div>
          )}

          {/* AI 로딩 인디케이터 */}
          {isAILoading && (
            <div className="flex items-center gap-2 rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-sm" data-testid="ai-loading">
              <Loader2 className="h-4 w-4 animate-spin text-sakura-dark" />
              <span>AI가 맞춤 일정을 생성하고 있어요...</span>
            </div>
          )}
        </div>
      </div>

      {/* 하단 자유 입력 바 */}
      <div className="border-t border-border/50 glass px-4 py-3" data-testid="free-chat-bar">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-sakura-dark dark:text-sakura" />
          <Input
            placeholder="자유롭게 여행을 말씀해주세요..."
            value={freeInput}
            onChange={(e) => setFreeInput(e.target.value)}
            onKeyDown={handleFreeChatKeyDown}
            disabled={isAILoading}
            className="h-10 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
            aria-label="AI 자유 대화 입력"
            data-testid="free-chat-input"
          />
          <button
            onClick={handleFreeChatSubmit}
            disabled={isAILoading || !freeInput.trim()}
            className="btn-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg disabled:opacity-50"
            aria-label="전송"
            data-testid="free-chat-send"
          >
            {isAILoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <Send className="h-3.5 w-3.5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
