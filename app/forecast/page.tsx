"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ArrowLeft, X } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { getInspectionForecast, calculateWindowScore } from "@/lib/weather"

interface ScoreDetails {
    score: number
    temperature: number
    windSpeed: number
    windGust: number
    precipitation: number
    cloudCover: number
    humidity: number
    issues: string[]
    positives: string[]
    scoreBreakdown?: {
        temperature: number
        cloud: number
        wind: number
        precipitation: number
        humidity: number
        timeBonus: number
    }
}

function ForecastContent() {
    const searchParams = useSearchParams()
    const zipCode = searchParams.get('zip')
    const [loading, setLoading] = useState(false)
    const [forecast, setForecast] = useState<any>(null)
    const [periodScores, setPeriodScores] = useState<Map<string, number>>(new Map())
    const [periodDetails, setPeriodDetails] = useState<Map<string, ScoreDetails>>(new Map())
    const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)

    useEffect(() => {
        const fetchForecast = async () => {
            if (!zipCode) return

            setLoading(true)
            const forecastData = await getInspectionForecast(zipCode, 14)

            if (forecastData) {
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const filteredForecast = forecastData
                    .filter((day: any) => {
                        // Parse date string as local date, not UTC
                        const [year, month, dayNum] = day.date.split('-').map(Number)
                        const dayDate = new Date(year, month - 1, dayNum)
                        return dayDate >= today
                    })
                    .slice(0, 14)

                const scores = new Map<string, number>()
                const details = new Map<string, ScoreDetails>()
                const timePeriods = [
                    { label: 'Early AM', start: 8, end: 10 },
                    { label: 'Late AM', start: 11, end: 13 },
                    { label: 'Early PM', start: 14, end: 16 },
                    { label: 'Late PM', start: 17, end: 19 },
                ]

                filteredForecast.forEach((day: any) => {
                    timePeriods.forEach((period) => {
                        if (!day.hours || day.hours.length === 0) {
                            scores.set(`${day.date}-${period.label}`, 0)
                            details.set(`${day.date}-${period.label}`, analyzeConditions([]))
                            return
                        }

                        const periodHours = day.hours.filter((h: any) => {
                            const hour = new Date(h.time).getHours()
                            return hour >= period.start && hour < period.end
                        })

                        const periodAnalysis = analyzeConditions(periodHours)
                        scores.set(`${day.date}-${period.label}`, periodAnalysis.score)
                        details.set(`${day.date}-${period.label}`, periodAnalysis)
                    })
                })

                setPeriodScores(scores)
                setPeriodDetails(details)
                setForecast(filteredForecast)
            } else {
                setForecast(null)
            }
            setLoading(false)
        }

        fetchForecast()
    }, [zipCode])

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'bg-green-600 text-white'
        if (score >= 70) return 'bg-green-400 text-white'
        if (score >= 55) return 'bg-yellow-400 text-black'
        if (score >= 40) return 'bg-orange-400 text-white'
        return 'bg-red-600 text-white'
    }

    const analyzeConditions = (hours: any[]): ScoreDetails => {
        const { score, details: scoreDetails, scoreBreakdown } = calculateWindowScore(hours)

        // If no hours, return empty
        if (!hours || hours.length === 0) {
            return {
                score: 0,
                temperature: 0,
                windSpeed: 0,
                windGust: 0,
                precipitation: 0,
                cloudCover: 0,
                humidity: 0,
                issues: ['No data available'],
                positives: []
            }
        }

        // Use the aggregates calculated by the scoring function if available, or fallback to calc
        const avgTemp = scoreDetails.avgTemp ?? (hours.reduce((sum, h) => sum + h.temperature_2m, 0) / hours.length)
        const avgWind = scoreDetails.maxWind ?? (hours.reduce((sum, h) => sum + h.wind_speed_10m, 0) / hours.length)
        const maxGust = Math.max(...hours.map(h => h.wind_gusts_10m || h.wind_speed_10m * 1.3))
        const maxPrecip = scoreDetails.maxPop ?? Math.max(...hours.map(h => h.precipitation_probability || 0))
        const avgCloud = scoreDetails.avgCloud ?? (hours.reduce((sum, h) => sum + (h.cloud_cover ?? 50), 0) / hours.length)
        const avgHumidity = scoreDetails.avgHumidity ?? (hours.reduce((sum, h) => sum + (h.relative_humidity_2m ?? 50), 0) / hours.length)

        const issues: string[] = []
        const positives: string[] = []

        // Fail Conditions Feedback
        if (scoreDetails.fail) {
            issues.push(`Condition Failed: ${scoreDetails.fail}`)
        }

        // Temperature Feedback
        if (avgTemp >= 75) positives.push(`Ideal temperature (${Math.round(avgTemp)}°F)`)
        else if (avgTemp >= 60 && avgTemp < 75) positives.push(`Good temperature (${Math.round(avgTemp)}°F)`)
        else if (avgTemp >= 55 && avgTemp < 60) issues.push(`Cool temperature (${Math.round(avgTemp)}°F)`)
        else if (avgTemp < 55) issues.push(`Too cold (${Math.round(avgTemp)}°F)`)

        // Wind Feedback
        if (avgWind <= 5) positives.push(`Calm winds (${Math.round(avgWind)}mph)`)
        else if (avgWind <= 10) positives.push(`Light winds (${Math.round(avgWind)}mph)`)
        else if (avgWind > 24) issues.push(`High winds (${Math.round(avgWind)}mph)`)

        // Cloud Feedback
        if (avgCloud <= 20) positives.push(`Sunny (${Math.round(avgCloud)}% clouds)`)
        else if (avgCloud <= 80) positives.push(`Partly Cloudy (${Math.round(avgCloud)}% clouds)`)
        else positives.push(`Overcast (${Math.round(avgCloud)}% clouds)`)

        // Precipitation Feedback
        if (maxPrecip === 0) positives.push('No rain expected')
        else if (maxPrecip > 49) issues.push(`High rain chance (${Math.round(maxPrecip)}%)`)
        else if (maxPrecip > 0) issues.push(`${Math.round(maxPrecip)}% chance of rain`)

        return {
            score,
            temperature: Math.round(avgTemp),
            windSpeed: Math.round(avgWind),
            windGust: Math.round(maxGust),
            precipitation: Math.round(maxPrecip),
            cloudCover: Math.round(avgCloud),
            humidity: Math.round(avgHumidity),
            issues,
            positives,
            scoreBreakdown
        }
    }

    const timePeriods = [
        { label: 'Early AM', start: 8, end: 10 },
        { label: 'Late AM', start: 11, end: 13 },
        { label: 'Early PM', start: 14, end: 16 },
        { label: 'Late PM', start: 17, end: 19 },
    ]

    return (
        <div className="min-h-screen bg-background honeycomb-bg">
            <header className="border-b-2 border-primary/20 bg-gradient-to-br from-primary/5 via-accent/20 to-secondary/5 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50"></div>
                <div className="container mx-auto px-4 py-4 md:py-6 relative">
                    <div className="flex items-center justify-between gap-2 md:gap-3 mb-1">
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="flex items-center justify-center">
                                <Image
                                    src="/logo.jpg"
                                    alt="HiveForecast Logo"
                                    width={48}
                                    height={48}
                                    className="rounded-xl shadow-md w-10 h-10 md:w-12 md:h-12"
                                />
                            </div>
                            <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">HiveForecast</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 md:px-6 md:py-8">
                <div className="flex items-center gap-3 mb-6 md:mb-8 pb-3 md:pb-4 border-b-2 border-gradient-to-r from-primary/30 via-primary/10 to-transparent">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back</span>
                        </Button>
                    </Link>
                    <h2 className="text-xl md:text-2xl font-semibold">Forecast for Zip: {zipCode}</h2>
                </div>

                {loading && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Loading forecast data...</p>
                    </div>
                )}

                {!loading && !forecast && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No forecast data available. Please check the Zip Code.</p>
                    </div>
                )}

                {!loading && forecast && (
                    <div className="space-y-6">
                        <div className="text-center md:hidden text-muted-foreground text-xs italic mb-2">
                            Turn screen landscape for better viewing
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-green-600"></div>
                                <span>Excellent (85+)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-green-400"></div>
                                <span>Good (70-84)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-yellow-400"></div>
                                <span>Fair (55-69)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-orange-400"></div>
                                <span>Poor (40-54)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-red-600"></div>
                                <span>Not Recommended (&lt;40)</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-xs md:text-sm">
                                <thead>
                                    <tr>
                                        <th className="border p-1 md:p-2 bg-muted text-left font-semibold text-[10px] md:text-sm">Time Period</th>
                                        {forecast.map((day: any) => {
                                            const [year, month, dayNum] = day.date.split('-').map(Number)
                                            const headerDate = new Date(year, month - 1, dayNum)

                                            return (
                                                <th key={day.date} className="border p-1 bg-muted text-center font-semibold min-w-12 md:min-w-16">
                                                    <div className="text-[9px] md:text-xs text-muted-foreground mb-0.5">
                                                        {headerDate.toLocaleDateString('en-US', { weekday: 'short' })}
                                                    </div>
                                                    <div className="text-[10px] md:text-sm">
                                                        {headerDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                </th>
                                            )
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timePeriods.map((period) => (
                                        <tr key={period.label}>
                                            <td className="border p-1 md:p-2 font-medium text-[10px] md:text-sm">{period.label}</td>
                                            {forecast.map((day: any) => {
                                                const score = periodScores.get(`${day.date}-${period.label}`) || 0
                                                const periodKey = `${day.date}-${period.label}`
                                                return (
                                                    <td key={periodKey} className="border p-0">
                                                        <button
                                                            onClick={() => setSelectedPeriod(periodKey)}
                                                            className={`h-10 md:h-14 w-full flex items-center justify-center text-sm md:text-lg font-bold ${getScoreColor(score)} hover:opacity-80 transition-opacity cursor-pointer`}
                                                        >
                                                            {score > 0 ? score : '—'}
                                                        </button>
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {selectedPeriod && periodDetails.has(selectedPeriod) && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPeriod(null)}>
                                <div className="bg-background rounded-lg max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">Inspection Conditions</h3>
                                        <button onClick={() => setSelectedPeriod(null)} className="text-muted-foreground hover:text-foreground">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {(() => {
                                        const details = periodDetails.get(selectedPeriod)!
                                        const lastHyphenIndex = selectedPeriod.lastIndexOf('-')
                                        const dateStr = selectedPeriod.substring(0, lastHyphenIndex)
                                        const periodLabel = selectedPeriod.substring(lastHyphenIndex + 1)

                                        const [year, month, day] = dateStr.split('-').map(Number)
                                        const displayDate = new Date(year, month - 1, day)

                                        return (
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">{periodLabel}</div>
                                                </div>

                                                <div className={`text-center py-4 rounded-lg ${getScoreColor(details.score)}`}>
                                                    <div className="text-3xl font-bold">{details.score}</div>
                                                    <div className="text-sm mt-1">Overall Score</div>
                                                </div>

                                                {/* Score Breakdown Grid */}
                                                {details.scoreBreakdown && (
                                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                                        <div className="bg-muted p-2 rounded">
                                                            <div className="font-medium">Temperature</div>
                                                            <div className="text-muted-foreground text-[10px]">{details.temperature}°F</div>
                                                            <div className="text-lg font-bold">{details.scoreBreakdown.temperature}/30</div>
                                                        </div>
                                                        <div className="bg-muted p-2 rounded">
                                                            <div className="font-medium">Cloud</div>
                                                            <div className="text-muted-foreground text-[10px]">{details.cloudCover}%</div>
                                                            <div className="text-lg font-bold">{details.scoreBreakdown.cloud}/20</div>
                                                        </div>
                                                        <div className="bg-muted p-2 rounded">
                                                            <div className="font-medium">Wind</div>
                                                            <div className="text-muted-foreground text-[10px]">{details.windSpeed}mph</div>
                                                            <div className="text-lg font-bold">{details.scoreBreakdown.wind}/20</div>
                                                        </div>
                                                        <div className="bg-muted p-2 rounded">
                                                            <div className="font-medium">Precip</div>
                                                            <div className="text-muted-foreground text-[10px]">{details.precipitation}%</div>
                                                            <div className="text-lg font-bold">{details.scoreBreakdown.precipitation}/15</div>
                                                        </div>
                                                        <div className="bg-muted p-2 rounded">
                                                            <div className="font-medium">Humidity</div>
                                                            <div className="text-muted-foreground text-[10px]">{details.humidity}%</div>
                                                            <div className="text-lg font-bold">{details.scoreBreakdown.humidity}/5</div>
                                                        </div>
                                                        <div className="bg-muted p-2 rounded">
                                                            <div className="font-medium">Time Bonus</div>
                                                            <div className="text-muted-foreground text-[10px]">10AM-4PM</div>
                                                            <div className="text-lg font-bold">{details.scoreBreakdown.timeBonus}/10</div>
                                                        </div>
                                                    </div>
                                                )}

                                                {details.issues.length > 0 && (
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-semibold text-red-600">Issues:</div>
                                                        {details.issues.map((issue, i) => (
                                                            <div key={i} className="text-sm text-muted-foreground">• {issue}</div>
                                                        ))}
                                                    </div>
                                                )}

                                                {details.positives.length > 0 && (
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-semibold text-green-600">Good Conditions:</div>
                                                        {details.positives.map((positive, i) => (
                                                            <div key={i} className="text-sm text-muted-foreground">• {positive}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div >
    )
}

export default function ForecastPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ForecastContent />
        </Suspense>
    )
}
