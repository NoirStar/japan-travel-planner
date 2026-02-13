import { useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWizardStore } from "@/stores/wizardStore"
import { useScheduleStore } from "@/stores/scheduleStore"
import { getNextStep, getAIResponseText } from "@/services/wizardEngine"
import { buildTripFromSelections } from "@/services/tripBuilder"
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
  const scrollRef = useRef<HTMLDivElement>(null)

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
      addAIMessage("안녕하세요! 🤖 AI 여행 플래너입니다. 함께 멋진 일본 여행을 만들어볼까요?")
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
        addAIMessage("알겠어요, 건너뛸게요! 👍")
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
    addAIMessage("안녕하세요! 🤖 AI 여행 플래너입니다. 함께 멋진 일본 여행을 만들어볼까요?")
  }, [reset, addAIMessage])

  // ── 현재 스텝 정보 ────────────────────────────────────
  const stepInfo = getNextStep(selections)

  return (
    <div className="flex h-screen flex-col pt-16" data-testid="wizard-page">
      {/* 헤더 */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          aria-label="돌아가기"
          data-testid="wizard-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold">🤖 AI 여행 플래너</h1>
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
          {stepInfo && currentStep === stepInfo.type && (
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
        </div>
      </div>
    </div>
  )
}
