// Weather service using Open-Meteo API (free, no API key, global coverage, 16-day forecast)
export interface WeatherData {
    temperature: number
    conditions: string
    humidity?: number
    windSpeed?: string
    lastUpdated: number
}

const WEATHER_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>()

async function getCoordinatesFromZip(zipCode: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`)

        if (!response.ok) {
            console.error("ZIP code lookup failed:", response.status)
            return null
        }

        const data = await response.json()

        if (data.places && data.places.length > 0) {
            const place = data.places[0]
            return {
                lat: parseFloat(place.latitude),
                lng: parseFloat(place.longitude)
            }
        }
        return null
    } catch (error) {
        console.error("Error geocoding ZIP:", error)
        return null
    }
}

// Fetch weather from Open-Meteo
export async function getWeather(zipCode: string): Promise<WeatherData | null> {
    const cached = weatherCache.get(zipCode)
    if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_DURATION) {
        return cached.data
    }

    try {
        const coords = await getCoordinatesFromZip(zipCode)
        if (!coords) {
            console.error("Could not geocode ZIP code:", zipCode)
            return null
        }

        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`

        const weatherResponse = await fetch(apiUrl)

        if (!weatherResponse.ok) {
            throw new Error(`Open-Meteo API failed: ${weatherResponse.status}`)
        }

        const data = await weatherResponse.json()
        const current = data.current

        const weatherCodeToDescription = (code: number): string => {
            if (code === 0) return "Clear"
            if (code <= 3) return "Partly Cloudy"
            if (code <= 48) return "Foggy"
            if (code <= 67) return "Rainy"
            if (code <= 77) return "Snowy"
            if (code <= 82) return "Showers"
            if (code <= 99) return "Thunderstorm"
            return "Unknown"
        }

        const weatherData: WeatherData = {
            temperature: Math.round(current.temperature_2m),
            conditions: weatherCodeToDescription(current.weather_code),
            humidity: Math.round(current.relative_humidity_2m),
            windSpeed: `${Math.round(current.wind_speed_10m)} mph`,
            lastUpdated: Date.now(),
        }

        weatherCache.set(zipCode, { data: weatherData, timestamp: Date.now() })

        return weatherData
    } catch (error) {
        console.error("Error fetching weather:", error)
        return null
    }
}

// Format weather for display
export function formatWeather(weather: WeatherData): string {
    return `${weather.temperature}°F, ${weather.conditions}`
}

export interface HourlyForecast {
    time: string
    temperature: number
    conditions: string
    windSpeed: string
    windGust?: string
    precipitation: number
    isDaytime: boolean
}

export interface DayForecast {
    date: string
    hours: any[]
    bestTimes: { start: string; end: string; score: number }[]
    overallScore: 'excellent' | 'good' | 'fair' | 'poor'
}

export function calculateWindowScore(hours: any[]): { score: number; details: any; scoreBreakdown?: any } {
    if (!hours || hours.length === 0) {
        return { score: 0, details: {} }
    }

    // Calculate aggregates
    const avgTemp = hours.reduce((sum, h) => sum + (h.temperature_2m || h.temperature || 0), 0) / hours.length
    const maxWind = Math.max(...hours.map(h => h.wind_speed_10m ? Math.round(h.wind_speed_10m) : (h.windSpeed ? parseInt(h.windSpeed) : 0)))
    const maxPop = Math.max(...hours.map(h => h.precipitation_probability || (h.probabilityOfPrecipitation?.value) || 0))
    const maxRainRate = Math.max(...hours.map(h => h.rain || h.precipitation || 0))
    const stormCodes = [95, 96, 99]
    const hasStorm = hours.some(h => stormCodes.includes(h.weather_code))
    const avgCloud = hours.reduce((sum, h) => sum + (h.cloud_cover ?? 50), 0) / hours.length
    const avgHumidity = hours.reduce((sum, h) => sum + (h.relative_humidity_2m ?? 50), 0) / hours.length

    // Check if window is within prime time (10 AM - 4 PM)
    const allHoursInPrimeTime = hours.every(h => {
        const hour = new Date(h.time).getHours()
        return hour >= 10 && hour < 16
    })

    // ── Scoring Components (Max 100) ──
    const breakdown = {
        temperature: 0,
        cloud: 0,
        wind: 0,
        precipitation: 0,
        humidity: 0,
        timeBonus: 0
    }

    // A. Temperature (Max 30 points)
    if (avgTemp >= 75) { breakdown.temperature = 30; }
    else if (avgTemp >= 70) { breakdown.temperature = 28; }
    else if (avgTemp >= 65) { breakdown.temperature = 25; }
    else if (avgTemp >= 60) { breakdown.temperature = 20; }
    else if (avgTemp >= 57) { breakdown.temperature = 12; }
    else if (avgTemp >= 55) { breakdown.temperature = 5; }

    // B. Cloud Cover (Max 20 points)
    if (avgCloud <= 20) { breakdown.cloud = 20; }
    else if (avgCloud <= 40) { breakdown.cloud = 17; }
    else if (avgCloud <= 60) { breakdown.cloud = 12; }
    else if (avgCloud <= 80) { breakdown.cloud = 6; }
    else { breakdown.cloud = 2; }

    // C. Wind Speed (Max 20 points)
    if (maxWind <= 5) { breakdown.wind = 20; }
    else if (maxWind <= 10) { breakdown.wind = 18; }
    else if (maxWind <= 15) { breakdown.wind = 12; }
    else if (maxWind <= 20) { breakdown.wind = 6; }
    else if (maxWind <= 24) { breakdown.wind = 2; }

    // D. Precipitation Probability (Max 15 points)
    if (maxPop === 0) { breakdown.precipitation = 15; }
    else if (maxPop <= 10) { breakdown.precipitation = 12; }
    else if (maxPop <= 20) { breakdown.precipitation = 8; }
    else if (maxPop <= 35) { breakdown.precipitation = 4; }
    else if (maxPop <= 49) { breakdown.precipitation = 1; }

    // E. Humidity (Max 5 points)
    if (avgHumidity >= 30 && avgHumidity <= 70) { breakdown.humidity = 5; }
    else { breakdown.humidity = 2; }

    // F. Time-of-Day Bonus (Max 10 points)
    if (allHoursInPrimeTime) { breakdown.timeBonus = 10; }

    // Calculate total score
    let score = breakdown.temperature + breakdown.cloud + breakdown.wind +
        breakdown.precipitation + breakdown.humidity + breakdown.timeBonus

    // ── Fail Conditions (Automatic Score: 0) ──
    let failFactor: string | null = null
    let failReason: string | null = null

    if (avgTemp < 55) { failFactor = 'temperature'; failReason = 'Too Cold (< 55°F)'; }
    else if (maxWind > 24) { failFactor = 'wind'; failReason = 'High Wind (> 24 mph)'; }
    else if (maxPop > 49) { failFactor = 'precipitation'; failReason = 'High Rain Chance (> 49%)'; }
    else if (maxRainRate > 0.5) { failFactor = 'precipitation'; failReason = 'Heavy Rain (> 0.02")'; }
    else if (hasStorm) { failFactor = 'precipitation'; failReason = 'Thunderstorm Detected'; }

    if (failFactor) {
        score = 0
    }

    return {
        score: Math.min(100, score),
        details: {
            avgTemp,
            maxWind,
            avgCloud,
            maxPop,
            avgHumidity,
            fail: failReason,
            failFactor
        },
        scoreBreakdown: breakdown
    }
}

// Kept for backward compatibility if needed, but deprecated
export function calculateBeeInspectionScore(hour: any): number {
    return calculateWindowScore([hour]).score
}

export function findBestDailyWindow(periods: any[]): { score: number; start: string; end: string } | null {
    const windows: Array<{ score: number; start: string; end: string }> = []

    for (let i = 0; i <= periods.length - 4; i++) {
        const window = periods.slice(i, i + 4)

        // Filter for daylight hours (9 AM - 5 PM)
        const daytimeWindow = window.filter((p: any) => {
            const hour = new Date(p.time).getHours()
            return hour >= 9 && hour <= 17
        })

        if (daytimeWindow.length >= 3) {
            const scores = daytimeWindow.map((p: any) => calculateBeeInspectionScore(p))
            const avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)

            windows.push({
                score: avgScore,
                start: daytimeWindow[0].time,
                end: daytimeWindow[daytimeWindow.length - 1].time
            })
        }
    }

    if (windows.length === 0) return null
    return windows.reduce((best, current) => current.score > best.score ? current : best)
}

export async function getInspectionForecast(zipCode: string, days: number = 7): Promise<DayForecast[] | null> {
    try {
        const coords = await getCoordinatesFromZip(zipCode)
        if (!coords) return null

        const forecastResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,cloud_cover,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=15&timezone=auto`
        )

        if (!forecastResponse.ok) return null

        const forecastData = await forecastResponse.json()
        const hourly = forecastData.hourly

        const periods = hourly.time.map((time: string, i: number) => ({
            time,
            temperature_2m: hourly.temperature_2m[i],
            relative_humidity_2m: hourly.relative_humidity_2m[i],
            precipitation_probability: hourly.precipitation_probability[i] || 0,
            weather_code: hourly.weather_code[i],
            cloud_cover: hourly.cloud_cover[i],
            wind_speed_10m: hourly.wind_speed_10m[i],
        }))

        const dayMap = new Map<string, any[]>()

        periods.forEach((period: any) => {
            const date = new Date(period.time)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const dateKey = `${year}-${month}-${day}`

            if (!dayMap.has(dateKey)) {
                dayMap.set(dateKey, [])
            }
            dayMap.get(dateKey)!.push(period)
        })

        const dayForecasts: DayForecast[] = []

        dayMap.forEach((dayPeriods, date) => {
            const hours = dayPeriods

            const bestWindow = findBestDailyWindow(dayPeriods)
            const bestTimes = bestWindow ? [{
                start: bestWindow.start,
                end: bestWindow.end,
                score: bestWindow.score
            }] : []

            const maxScore = bestWindow?.score || 0

            let overallScore: 'excellent' | 'good' | 'fair' | 'poor'
            if (maxScore >= 85) {
                overallScore = 'excellent'
            } else if (maxScore >= 70) {
                overallScore = 'good'
            } else if (maxScore >= 55) {
                overallScore = 'fair'
            } else {
                overallScore = 'poor'
            }

            dayForecasts.push({
                date,
                hours,
                bestTimes,
                overallScore,
            })
        })

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        return dayForecasts
            .filter(df => new Date(df.date) >= today)
            .slice(0, days)
    } catch (error) {
        console.error("Error fetching inspection forecast:", error)
        return null
    }
}

// Helper function to map weather codes to descriptions
function weatherCodeToDescription(code: number): string {
    if (code === 0) return "Clear"
    if (code <= 3) return "Partly Cloudy"
    if (code <= 48) return "Foggy"
    if (code <= 67) return "Rainy"
    if (code <= 77) return "Snowy"
    if (code <= 82) return "Showers"
    if (code <= 99) return "Thunderstorm"
    return "Unknown"
}
