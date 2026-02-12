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
    private static WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

    /**
     * Get logic coordinates from Zip Code
     */
    static async getCoordinates(zip: string, country: string = 'us'): Promise<{ lat: number; lng: number }> {
        // Zippopotam requires lowercase country codes
        const countryCode = country.toLowerCase();

        let searchZip = zip;

        // Normalize postal codes for Zippopotam (it supports outward codes for some countries)
        if (countryCode === 'gb') {
            // UK: Use outward code (first part before space) e.g., "SW1A 1AA" -> "SW1A"
            searchZip = zip.split(' ')[0].trim();
        } else if (countryCode === 'ca') {
            // Canada: Use FSA (first 3 chars) e.g., "K1A 0B1" -> "K1A"
            searchZip = zip.substring(0, 3);
        } else if (countryCode === 'nl') {
            // Netherlands: Use numeric part (first 4 chars) e.g., "1012 JS" -> "1012"
            searchZip = zip.substring(0, 4);
        }

        const response = await fetch(`https://api.zippopotam.us/${countryCode}/${searchZip}`);
        if (response.ok) {
            const data = await response.json() as any;
            const place = data.places[0];
            return {
                lat: parseFloat(place.latitude),
                lng: parseFloat(place.longitude),
            };
        } else {
            throw new Error(`Invalid Postal Code for ${country.toUpperCase()}`);
        }
    }

    /**
     * Determine the best Open-Meteo model based on country code.
     * GFS for Americas, ICON for Europe, ECMWF IFS for rest of world.
     */
    static getModelForCountry(countryCode?: string): string {
        const code = (countryCode || 'us').toLowerCase();

        // Americas → GFS (same model as NWS/AccuWeather)
        const americas = ['us', 'ca', 'mx', 'br', 'ar', 'cl', 'co', 'pe', 've', 'ec', 'bo', 'py', 'uy', 'gf', 'sr', 'gy', 'bz', 'gt', 'hn', 'sv', 'ni', 'cr', 'pa', 'cu', 'jm', 'ht', 'do', 'pr', 'tt', 'bb', 'bs', 'ag', 'dm', 'gd', 'kn', 'lc', 'vc'];
        if (americas.includes(code)) return 'gfs_seamless';

        // Europe → ICON (German DWD model, best for Europe)
        const europe = ['gb', 'de', 'fr', 'it', 'es', 'pt', 'nl', 'be', 'at', 'ch', 'pl', 'cz', 'sk', 'hu', 'ro', 'bg', 'hr', 'si', 'rs', 'ba', 'me', 'mk', 'al', 'gr', 'dk', 'no', 'se', 'fi', 'ee', 'lv', 'lt', 'ie', 'is', 'lu', 'mt', 'cy', 'ua', 'by', 'md'];
        if (europe.includes(code)) return 'icon_seamless';

        // Rest of world (Australia, Asia, Africa, etc.) → ECMWF IFS
        return 'ecmwf_ifs025';
    }

    /**
     * Fetch raw weather data
     */
    static async getWeatherForecast(lat: number, lng: number, elevation?: number, countryCode?: string): Promise<any> {
        const model = this.getModelForCountry(countryCode);
        let url = `${this.WEATHER_API_URL}?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weathercode,cloudcover,windspeed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=7&models=${model}`;

        if (elevation !== undefined) {
            url += `&elevation=${elevation}`;
        }
        const response = await fetch(url);
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to load weather data');
        }
    }

    /**
     * Calculate 1-hour inspection windows for beekeeping
     */
    static calculateForecast(weatherData: any, isTBH: boolean = false, isMetric: boolean = false): InspectionWindow[] {
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
            const dayKey = times[i].slice(0, 10);
            if (!dayIndices[dayKey]) dayIndices[dayKey] = [];
            dayIndices[dayKey].push(i);
        }

        const targetStartHours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

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

                if (startIndex !== undefined) {
                    const i = startIndex;

                    // Use raw hourly values directly — no averaging
                    const temp = temps[i];
                    const wind = winds[i];
                    const cloud = clouds[i];
                    const precipProb = precipProbs[i];
                    const precip = precips[i];
                    const code = codes[i];
                    const humidity = humidities[i];

                    const issues: string[] = [];

                    // Localization Helpers
                    const tempStr = (t: number) => isMetric ? `${Math.round((t - 32) * 5 / 9)}°C` : `${Math.round(t)}°F`;

                    if (temp < 55) issues.push(`Too Cold (< ${tempStr(55)})`);

                    if (wind > 24) {
                        const speedStr = isMetric ? `${Math.round(24 * 1.60934)}km/h` : `24mph`;
                        issues.push(`Too Windy (> ${speedStr})`);
                    }

                    if (precipProb > 49) issues.push("Rain Likely (> 49%)");
                    if (precip > 0.02) issues.push("Raining");
                    if ([95, 96, 99].includes(code)) issues.push("Stormy Weather");

                    // TBH-specific: High heat issue
                    if (isTBH && temp > 92) issues.push(`Temperature > ${tempStr(92)} (comb slump risk)`);

                    let totalScore = 0;
                    const breakdown: Record<string, number> = {};

                    // 1. Temperature (Max 40)
                    let tempScore = 0;
                    if (temp >= 75) tempScore = 40;
                    else if (temp >= 70) tempScore = 37;
                    else if (temp >= 65) tempScore = 33;
                    else if (temp >= 60) tempScore = 27;
                    else if (temp >= 57) tempScore = 18;
                    else if (temp >= 55) tempScore = 8;

                    // TBH-specific: High heat penalty
                    if (isTBH && temp > 80) {
                        const degreesAbove80 = temp - 80;
                        const penalty = Math.floor(degreesAbove80 / 5) * 10;
                        tempScore = Math.max(0, tempScore - penalty);
                    }

                    breakdown['Temperature'] = tempScore;
                    totalScore += tempScore;

                    // 2. Cloud Cover (Max 20)
                    let cloudScore = 0;
                    if (cloud <= 20) cloudScore = 20;
                    else if (cloud <= 40) cloudScore = 17;
                    else if (cloud <= 60) cloudScore = 12;
                    else if (cloud <= 80) cloudScore = 6;
                    else cloudScore = 6;
                    breakdown['Cloud Cover'] = cloudScore;
                    totalScore += cloudScore;

                    // 3. Wind (Max 20)
                    let windScore = 0;
                    if (wind <= 5) windScore = 20;
                    else if (wind <= 10) windScore = 18;
                    else if (wind <= 15) windScore = 12;
                    else if (wind <= 20) windScore = 6;
                    else if (wind <= 24) windScore = 2;
                    breakdown['Wind Speed'] = windScore;
                    totalScore += windScore;

                    // 4. Precipitation Probability (Max 15)
                    let precipScore = 0;
                    if (precipProb === 0) precipScore = 15;
                    else if (precipProb <= 10) precipScore = 12;
                    else if (precipProb <= 20) precipScore = 8;
                    else if (precipProb <= 35) precipScore = 4;
                    else if (precipProb <= 49) precipScore = 1;
                    breakdown['Precipitation'] = precipScore;
                    totalScore += precipScore;

                    // 5. Humidity (Max 5)
                    const humidityScore = (humidity >= 30 && humidity <= 70) ? 5 : 0;
                    breakdown['Humidity'] = humidityScore;
                    totalScore += humidityScore;

                    windows.push({
                        startTime: new Date(times[i]),
                        endTime: new Date(new Date(times[i]).getTime() + 1 * 60 * 60 * 1000), // +1 hour
                        score: totalScore,
                        tempF: temp,
                        windMph: wind,
                        cloudCover: cloud,
                        precipProb: precipProb,
                        humidity: humidity,
                        condition: this.getConditionCode(code),
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
