export interface InspectionWindow {
    startTime: Date;
    endTime: Date;
    score: number;
    tempF: number;
    windMph: number;
    cloudCover: number;
    precipProb: number;
    humidity: number;
    condition: string;
    issues: string[];
    scoreBreakdown: Record<string, number>;
    displayHour: number;
    displayDate: string;
}

export class WeatherService {
    private static ZIP_API_URL = 'https://api.zippopotam.us/us/';
    private static WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

    /**
     * Get logic coordinates from Zip Code
     */
    static async getCoordinates(zip: string): Promise<{ lat: number; lng: number }> {
        const response = await fetch(`${this.ZIP_API_URL}${zip}`);
        if (response.ok) {
            const data = await response.json() as any;
            const place = data.places[0];
            return {
                lat: parseFloat(place.latitude),
                lng: parseFloat(place.longitude),
            };
        } else {
            throw new Error('Invalid ZIP code');
        }
    }

    /**
     * Fetch raw weather data
     */
    static async getWeatherForecast(lat: number, lng: number): Promise<any> {
        const url = `${this.WEATHER_API_URL}?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weathercode,cloudcover,windspeed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=14`;
        const response = await fetch(url);
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to load weather data');
        }
    }

    /**
     * Calculate 2-hour inspection windows for beekeeping
     */
    static calculateForecast(weatherData: any, isTBH: boolean = false): InspectionWindow[] {
        const windows: InspectionWindow[] = [];
        const hourly = weatherData.hourly;

        const times = hourly.time as string[];
        const temps = hourly.temperature_2m as number[];
        const humidities = hourly.relative_humidity_2m as number[];
        const precipProbs = hourly.precipitation_probability as number[];
        const precips = hourly.precipitation as number[];
        const codes = hourly.weathercode as number[];
        const clouds = hourly.cloudcover as number[];
        const winds = hourly.windspeed_10m as number[];

        // Group indices by Date (yyyy-MM-dd)
        const dayIndices: Record<string, number[]> = {};
        for (let i = 0; i < times.length; i++) {
            // times[i] is "YYYY-MM-DDTHH:mm"
            const dayKey = times[i].slice(0, 10);

            if (!dayIndices[dayKey]) dayIndices[dayKey] = [];
            dayIndices[dayKey].push(i);
        }

        const targetStartHours = [6, 8, 10, 12, 14, 16];

        // Iterate over each day
        for (const dayKey in dayIndices) {
            const indices = dayIndices[dayKey];

            for (const startHour of targetStartHours) {
                // Find index for this specific hour
                let startIndex: number | undefined;
                for (const idx of indices) {
                    const hour = parseInt(times[idx].slice(11, 13));
                    if (hour === startHour) {
                        startIndex = idx;
                        break;
                    }
                }

                // We need 2 hours of data
                if (startIndex !== undefined && (startIndex + 1) < times.length) {
                    const i = startIndex;

                    const segmentTemps = [temps[i], temps[i + 1]];
                    const segmentWinds = [winds[i], winds[i + 1]];
                    const segmentClouds = [clouds[i], clouds[i + 1]];
                    const segmentPrecipProbs = [precipProbs[i], precipProbs[i + 1]];
                    const segmentPrecips = [precips[i], precips[i + 1]];
                    const segmentCodes = [codes[i], codes[i + 1]];
                    const segmentHumidities = [humidities[i], humidities[i + 1]];

                    // Averages
                    const avgTemp = segmentTemps.reduce((a, b) => a + b, 0) / 2;
                    const avgWind = segmentWinds.reduce((a, b) => a + b, 0) / 2;
                    const avgCloud = segmentClouds.reduce((a, b) => a + b, 0) / 2;
                    const avgPrecipProb = segmentPrecipProbs.reduce((a, b) => a + b, 0) / 2;
                    const avgHumidity = segmentHumidities.reduce((a, b) => a + b, 0) / 2;

                    // Kill Checks (Min/Max)
                    const maxPrecipProb = Math.max(...segmentPrecipProbs);
                    const maxPrecipRate = Math.max(...segmentPrecips);

                    const maxWind = Math.max(...segmentWinds);

                    const hasStorm = segmentCodes.some(c => [95, 96, 99].includes(c));

                    const issues: string[] = [];
                    // User requested change: use average temp for warning to match display
                    if (avgTemp < 55) issues.push("Too Cold (< 55°F)");
                    if (maxWind > 24) issues.push("Too Windy (> 24mph)");

                    if (maxPrecipProb > 49) issues.push("Rain Likely (> 49%)"); // FIXED: Was checking maxPrecipProb but variable was undefined in copied code
                    if (maxPrecipRate > 0.02) issues.push("Raining");
                    if (hasStorm) issues.push("Stormy Weather");

                    // TBH-specific: High heat issue
                    if (isTBH && avgTemp > 92) issues.push("Temperature > 92°F (comb slump risk)");

                    let totalScore = 0;
                    const breakdown: Record<string, number> = {};

                    // 1. Temperature (Max 40)
                    let tempScore = 0;
                    if (avgTemp >= 75) tempScore = 40;
                    else if (avgTemp >= 70) tempScore = 37;
                    else if (avgTemp >= 65) tempScore = 33;
                    else if (avgTemp >= 60) tempScore = 27;
                    else if (avgTemp >= 57) tempScore = 18;
                    else if (avgTemp >= 55) tempScore = 8;

                    // TBH-specific: High heat penalty (-10 pts per 5°F above 80°F)
                    if (isTBH && avgTemp > 80) {
                        const degreesAbove80 = avgTemp - 80;
                        const penalty = Math.floor(degreesAbove80 / 5) * 10;
                        tempScore = Math.max(0, tempScore - penalty);
                    }

                    breakdown['Temperature'] = tempScore;
                    totalScore += tempScore;

                    // 2. Cloud Cover (Max 20)
                    let cloudScore = 0;
                    if (avgCloud <= 20) cloudScore = 20;
                    else if (avgCloud <= 40) cloudScore = 17;
                    else if (avgCloud <= 60) cloudScore = 12;
                    else if (avgCloud <= 80) cloudScore = 6;
                    else cloudScore = 2;
                    breakdown['Cloud Cover'] = cloudScore;
                    totalScore += cloudScore;

                    // 3. Wind (Max 20)
                    let windScore = 0;
                    if (avgWind <= 5) windScore = 20;
                    else if (avgWind <= 10) windScore = 18;
                    else if (avgWind <= 15) windScore = 12;
                    else if (avgWind <= 20) windScore = 6;
                    else if (avgWind <= 24) windScore = 2;
                    breakdown['Wind Speed'] = windScore;
                    totalScore += windScore;

                    // 4. Precipitation Probability (Max 15)
                    let precipScore = 0;
                    if (avgPrecipProb === 0) precipScore = 15;
                    else if (avgPrecipProb <= 10) precipScore = 12;
                    else if (avgPrecipProb <= 20) precipScore = 8;
                    else if (avgPrecipProb <= 35) precipScore = 4;
                    else if (avgPrecipProb <= 49) precipScore = 1;
                    breakdown['Precipitation'] = precipScore;
                    totalScore += precipScore;

                    // 5. Humidity (Max 5)
                    const humidityScore = (avgHumidity >= 30 && avgHumidity <= 70) ? 5 : 0;
                    breakdown['Humidity'] = humidityScore;
                    totalScore += humidityScore;

                    windows.push({
                        startTime: new Date(times[i]),
                        endTime: new Date(new Date(times[i]).getTime() + 2 * 60 * 60 * 1000), // +2 hours
                        score: totalScore,
                        tempF: avgTemp,
                        windMph: avgWind,
                        cloudCover: avgCloud,
                        precipProb: avgPrecipProb,
                        humidity: avgHumidity,
                        condition: this.getConditionCode(segmentCodes[0]),
                        issues: issues,
                        scoreBreakdown: breakdown,
                        displayHour: startHour,
                        displayDate: dayKey,
                    });
                }
            }
        }
        return windows;
    }

    static getConditionCode(code: number): string {
        // WMO codes
        if (code === 0) return 'Clear';
        if (code <= 3) return 'Partly Cloudy';
        if (code <= 48) return 'Foggy';
        if (code <= 67) return 'Rainy';
        if (code <= 77) return 'Snowy';
        if (code <= 82) return 'Rain Showers';
        return 'Stormy';
    }
}
