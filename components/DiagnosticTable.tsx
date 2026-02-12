'use client';

import { useState, useEffect, useRef } from 'react';
import { InspectionWindow } from '@/services/WeatherService';

interface DiagnosticTableProps {
    /** The app's computed inspection window for the selected time slot */
    appWindow: InspectionWindow | null;
    /** Latitude for API calls */
    lat: number;
    /** Longitude for API calls */
    lng: number;
    /** The target date string (YYYY-MM-DD) */
    targetDate: string;
    /** The target start hour (e.g. 14 for 2PM) */
    targetHour: number;
    /** If true, auto-open and fetch immediately (no toggle button) */
    autoOpen?: boolean;
}

interface HourlyData {
    temp?: number;
    wind?: number;
    cloud?: number;
    precipProb?: number;
    humidity?: number;
    condition?: string;
}

interface SourceData {
    name: string;
    hour1: HourlyData;
    hour2: HourlyData;
    error?: string;
}

export function DiagnosticTable({ appWindow, lat, lng, targetDate, targetHour, autoOpen = false }: DiagnosticTableProps) {
    const [isOpen, setIsOpen] = useState(autoOpen);
    const [loading, setLoading] = useState(false);
    const [sources, setSources] = useState<SourceData[]>([]);
    const [fetched, setFetched] = useState(false);
    const fetchedRef = useRef(false);

    const hourLabel = formatHourLabel(targetHour);
    const windowLabel = `${hourLabel}–${formatHourLabel(targetHour + 1)}`;

    // Auto-fetch on mount when autoOpen is true
    useEffect(() => {
        if (autoOpen && !fetchedRef.current) {
            fetchedRef.current = true;
            doFetch();
        }
    }, [autoOpen]);

    const doFetch = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                fetchOpenMeteoRaw(lat, lng, targetDate, targetHour),
                fetchMETNorway(lat, lng, targetDate, targetHour),
                fetchNWS(lat, lng, targetDate, targetHour),
            ]);

            const sourceResults: SourceData[] = [];
            const names = ['Open-Meteo (Raw)', 'MET Norway (Yr)', 'NWS'];
            results.forEach((r, i) => {
                if (r.status === 'fulfilled') {
                    sourceResults.push({ name: names[i], ...r.value });
                } else {
                    sourceResults.push({
                        name: names[i],
                        hour1: {},
                        hour2: {},
                        error: r.reason?.message || 'Failed to fetch',
                    });
                }
            });

            setSources(sourceResults);
            setFetched(true);
        } catch (e: any) {
            console.error('Diagnostic fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async () => {
        if (!isOpen && !fetched) {
            setIsOpen(true);
            await doFetch();
        } else {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className={autoOpen ? '' : 'mt-8'}>
            {!autoOpen && (
                <div className="flex justify-center">
                    <button
                        onClick={handleToggle}
                        className="text-xs bg-gray-100 border border-gray-300 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        <span>🔍</span>
                        <span>{isOpen ? 'Hide' : 'Show'} Weather Data Diagnostic</span>
                        <span className="text-[10px] text-gray-400">(temporary)</span>
                    </button>
                </div>
            )}

            {isOpen && (
                <div className="mt-4 bg-white rounded-lg border border-gray-200 shadow-sm p-4 overflow-x-auto">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">
                        Weather Data Comparison — {targetDate} {windowLabel}
                    </h3>
                    <p className="text-[10px] text-gray-400 mb-3">
                        Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
                    </p>

                    {loading ? (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            <div className="animate-pulse text-2xl mb-2">⏳</div>
                            Fetching data from multiple sources...
                        </div>
                    ) : (
                        <>
                            {/* Main Comparison Table */}
                            <table className="w-full text-xs border-collapse border border-gray-200 mb-4">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border border-gray-200 px-3 py-2 text-left font-bold text-gray-700">Data Point</th>
                                        <th className="border border-gray-200 px-3 py-2 text-center font-bold text-amber-700 bg-amber-50">
                                            Hive Forecast App
                                            <div className="text-[9px] font-normal text-gray-400">({hourLabel})</div>
                                        </th>
                                        {sources.map(s => (
                                            <th key={s.name} className="border border-gray-200 px-3 py-2 text-center font-bold text-gray-700">
                                                {s.name}
                                                <div className="text-[9px] font-normal text-gray-400">{hourLabel}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {renderRow('Temperature (°F)', appWindow?.tempF, sources, 'temp')}
                                    {renderRow('Wind Speed (mph)', appWindow?.windMph, sources, 'wind')}
                                    {renderRow('Cloud Cover (%)', appWindow?.cloudCover, sources, 'cloud')}
                                    {renderRow('Precip Prob (%)', appWindow?.precipProb, sources, 'precipProb')}
                                    {renderRow('Humidity (%)', appWindow?.humidity, sources, 'humidity')}
                                    {renderConditionRow(appWindow?.condition, sources)}
                                </tbody>
                            </table>

                            {/* Score Breakdown (App only) */}
                            {appWindow && (
                                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                                    <h4 className="text-xs font-bold text-amber-800 mb-2">
                                        App Score Breakdown — Total: {appWindow.score}/100
                                    </h4>
                                    <div className="grid grid-cols-5 gap-2 text-[10px]">
                                        {Object.entries(appWindow.scoreBreakdown).map(([key, val]) => (
                                            <div key={key} className="bg-white rounded p-2 text-center border border-amber-100">
                                                <div className="font-bold text-gray-700">{val}</div>
                                                <div className="text-gray-400">{key}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {appWindow.issues.length > 0 && (
                                        <div className="mt-2 text-[10px] text-red-600">
                                            <span className="font-bold">Issues: </span>
                                            {appWindow.issues.join(', ')}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Source errors */}
                            {sources.filter(s => s.error).map(s => (
                                <div key={s.name} className="mt-2 text-[10px] text-red-500">
                                    ⚠️ {s.name}: {s.error}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Helpers ──

function formatHourLabel(hour: number): string {
    if (hour === 0 || hour === 24) return '12AM';
    if (hour === 12) return '12PM';
    if (hour < 12) return `${hour}AM`;
    return `${hour - 12}PM`;
}

function renderRow(label: string, appValue: number | undefined, sources: SourceData[], field: keyof HourlyData) {
    return (
        <tr>
            <td className="border border-gray-200 px-3 py-1.5 font-medium text-gray-700">{label}</td>
            <td className="border border-gray-200 px-3 py-1.5 text-center font-bold bg-amber-50 text-amber-900">
                {appValue !== undefined ? Math.round(appValue * 10) / 10 : '—'}
            </td>
            {sources.map(s => (
                <td key={s.name} className="border border-gray-200 px-3 py-1.5 text-center text-gray-800">
                    {s.error ? (
                        <span className="text-red-400 text-[10px]">err</span>
                    ) : (
                        <>
                            {formatVal(s.hour1[field])}
                        </>
                    )}
                </td>
            ))}
        </tr>
    );
}

function renderConditionRow(appCondition: string | undefined, sources: SourceData[]) {
    return (
        <tr>
            <td className="border border-gray-200 px-3 py-1.5 font-medium text-gray-700">Condition</td>
            <td className="border border-gray-200 px-3 py-1.5 text-center font-bold bg-amber-50 text-amber-900">
                {appCondition || '—'}
            </td>
            {sources.map(s => (
                <td key={s.name} className="border border-gray-200 px-3 py-1.5 text-center text-gray-800 text-[10px]">
                    {s.error ? (
                        <span className="text-red-400">err</span>
                    ) : (
                        <>
                            {s.hour1.condition || '—'}
                        </>
                    )}
                </td>
            ))}
        </tr>
    );
}

function formatVal(v: string | number | undefined): string {
    if (v === undefined || v === null) return '—';
    if (typeof v === 'number') return String(Math.round(v * 10) / 10);
    return v;
}

// ── Data Fetchers ──

async function fetchOpenMeteoRaw(lat: number, lng: number, date: string, startHour: number): Promise<{ hour1: HourlyData; hour2: HourlyData }> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weathercode,cloudcover,windspeed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&start_date=${date}&end_date=${date}&models=gfs_seamless`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
    const data = await res.json();
    return extractOpenMeteoHours(data, startHour);
}

async function fetchMETNorway(lat: number, lng: number, date: string, startHour: number): Promise<{ hour1: HourlyData; hour2: HourlyData }> {
    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'HiveForecast/1.0 (diagnostic)' },
    });
    if (!res.ok) throw new Error(`MET Norway returned ${res.status}`);
    const data = await res.json();

    const timeseries = data.properties?.timeseries || [];

    const extractHour = (hour: number): HourlyData => {
        // MET Norway returns UTC times. Convert local date+hour to UTC for matching.
        // Create a Date in local time, then get its UTC ISO string.
        const localDate = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`);
        const utcISO = localDate.toISOString().replace('.000Z', 'Z').replace(/\.\d{3}Z$/, 'Z');
        // Also try matching with full milliseconds format
        const entry = timeseries.find((t: any) => {
            const entryTime = t.time.replace('.000Z', 'Z');
            return entryTime === utcISO || t.time === localDate.toISOString();
        });
        if (!entry) return {};

        const instant = entry.data?.instant?.details || {};
        const next1h = entry.data?.next_1_hours || {};
        const symbolCode = next1h?.summary?.symbol_code || '';

        // Convert Celsius to Fahrenheit
        const tempC = instant.air_temperature;
        const tempF = tempC !== undefined ? (tempC * 9) / 5 + 32 : undefined;

        // Convert m/s to mph
        const windMs = instant.wind_speed;
        const windMph = windMs !== undefined ? windMs * 2.237 : undefined;

        // Map symbol_code to readable condition
        const getCondition = (code: string): string => {
            if (!code) return '—';
            if (code.includes('clear')) return 'Clear';
            if (code.includes('fair')) return 'Partly Cloudy';
            if (code.includes('partlycloudy')) return 'Partly Cloudy';
            if (code.includes('cloudy')) return 'Cloudy';
            if (code.includes('rain')) return 'Rainy';
            if (code.includes('snow')) return 'Snowy';
            if (code.includes('fog')) return 'Foggy';
            if (code.includes('thunder')) return 'Stormy';
            return code;
        };

        return {
            temp: tempF !== undefined ? Math.round(tempF * 10) / 10 : undefined,
            wind: windMph !== undefined ? Math.round(windMph * 10) / 10 : undefined,
            cloud: instant.cloud_area_fraction,
            precipProb: next1h?.details?.probability_of_precipitation ?? undefined,
            humidity: instant.relative_humidity,
            condition: getCondition(symbolCode),
        };
    };

    return {
        hour1: extractHour(startHour),
        hour2: extractHour(startHour + 1),
    };
}

function extractOpenMeteoHours(data: any, startHour: number): { hour1: HourlyData; hour2: HourlyData } {
    const hourly = data.hourly;
    const times = hourly.time as string[];

    const getCondition = (code: number): string => {
        if (code === 0) return 'Clear';
        if (code <= 3) return 'Partly Cloudy';
        if (code <= 48) return 'Foggy';
        if (code <= 67) return 'Rainy';
        if (code <= 77) return 'Snowy';
        if (code <= 82) return 'Rain Showers';
        return 'Stormy';
    };

    const extractHour = (hour: number): HourlyData => {
        const idx = times.findIndex(t => parseInt(t.slice(11, 13)) === hour);
        if (idx === -1) return {};
        return {
            temp: hourly.temperature_2m[idx],
            wind: hourly.windspeed_10m[idx],
            cloud: hourly.cloudcover[idx],
            precipProb: hourly.precipitation_probability[idx],
            humidity: hourly.relative_humidity_2m[idx],
            condition: getCondition(hourly.weathercode[idx]),
        };
    };

    return {
        hour1: extractHour(startHour),
        hour2: extractHour(startHour + 1),
    };
}

async function fetchNWS(lat: number, lng: number, date: string, startHour: number): Promise<{ hour1: HourlyData; hour2: HourlyData }> {
    // Step 1: Get the forecast grid endpoint for this location
    const pointsRes = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`, {
        headers: { 'User-Agent': 'HiveForecast/1.0 (diagnostic)', Accept: 'application/geo+json' },
    });
    if (!pointsRes.ok) throw new Error(`NWS points returned ${pointsRes.status}`);
    const pointsData = await pointsRes.json();

    const forecastHourlyUrl = pointsData.properties?.forecastHourly;
    if (!forecastHourlyUrl) throw new Error('NWS did not return forecastHourly URL');

    // Step 2: Get hourly forecast
    const forecastRes = await fetch(forecastHourlyUrl, {
        headers: { 'User-Agent': 'HiveForecast/1.0 (diagnostic)', Accept: 'application/geo+json' },
    });
    if (!forecastRes.ok) throw new Error(`NWS forecast returned ${forecastRes.status}`);
    const forecastData = await forecastRes.json();

    const periods = forecastData.properties?.periods || [];

    const extractNWSHour = (hour: number): HourlyData => {
        // NWS periods have startTime in ISO format, find matching hour+date
        const match = periods.find((p: any) => {
            const dt = new Date(p.startTime);
            const pDate = dt.toISOString().slice(0, 10);
            const pHour = dt.getHours();
            return pDate === date && pHour === hour;
        });

        // NWS times are in local timezone, so also try matching by local date parsing
        if (!match) {
            // Try matching by just the hour from the ISO string
            const altMatch = periods.find((p: any) => {
                const startStr = p.startTime; // e.g. "2026-02-14T14:00:00-06:00"
                const datePart = startStr.slice(0, 10);
                const hourPart = parseInt(startStr.slice(11, 13));
                return datePart === date && hourPart === hour;
            });
            if (altMatch) {
                return {
                    temp: altMatch.temperature,
                    wind: parseWindSpeed(altMatch.windSpeed),
                    cloud: undefined, // NWS doesn't directly supply cloud cover %
                    precipProb: altMatch.probabilityOfPrecipitation?.value ?? undefined,
                    humidity: altMatch.relativeHumidity?.value ?? undefined,
                    condition: altMatch.shortForecast,
                };
            }
            return {};
        }

        return {
            temp: match.temperature,
            wind: parseWindSpeed(match.windSpeed),
            cloud: undefined, // NWS hourly forecast doesn't provide cloud cover %
            precipProb: match.probabilityOfPrecipitation?.value ?? undefined,
            humidity: match.relativeHumidity?.value ?? undefined,
            condition: match.shortForecast,
        };
    };

    return {
        hour1: extractNWSHour(startHour),
        hour2: extractNWSHour(startHour + 1),
    };
}

function parseWindSpeed(windStr: string | undefined): number | undefined {
    if (!windStr) return undefined;
    // NWS format: "10 mph" or "5 to 10 mph"
    const match = windStr.match(/(\d+)\s*(?:to\s*(\d+))?\s*mph/i);
    if (!match) return undefined;
    if (match[2]) {
        // Range — return average
        return (parseInt(match[1]) + parseInt(match[2])) / 2;
    }
    return parseInt(match[1]);
}
