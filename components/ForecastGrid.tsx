'use client';

import { useState, useEffect } from 'react';
import { WeatherService, InspectionWindow } from '@/services/WeatherService';
import { ScoringHelpModal } from './ScoringHelpModal';
import { DiagnosticTable } from './DiagnosticTable';

interface ForecastGridProps {
    location: {
        type: 'zip' | 'coords';
        zip?: string;
        countryCode?: string;
        lat?: number;
        lng?: number;
        elevation?: number;
    };
    onBack?: () => void;
}

export function ForecastGrid({ location, onBack }: ForecastGridProps) {
    const [timezone, setTimezone] = useState<string>('UTC');
    const [windows, setWindows] = useState<InspectionWindow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedWindow, setSelectedWindow] = useState<InspectionWindow | null>(null);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [isTBH, setIsTBH] = useState(false);
    const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [diagWindow, setDiagWindow] = useState<InspectionWindow | null>(null);

    // Locale settings (US = Imperial/12h, Others = Metric/24h)
    const isUS = !location.countryCode || location.countryCode.toLowerCase() === 'us';
    const isMetric = !isUS;
    const is24h = !isUS;

    useEffect(() => {
        const fetchForecast = async () => {
            setLoading(true);
            setError(null);
            try {
                let lat: number;
                let lng: number;

                if (location.type === 'zip' && location.zip) {
                    // Fetch coords from Zip
                    const coords = await WeatherService.getCoordinates(location.zip, location.countryCode);
                    lat = coords.lat;
                    lng = coords.lng;
                } else if (location.type === 'coords' && location.lat !== undefined && location.lng !== undefined) {
                    // Use provided coords
                    lat = location.lat;
                    lng = location.lng;
                } else {
                    throw new Error('Invalid location data');
                }

                setResolvedCoords({ lat, lng });

                // Fetch weather
                const data = await WeatherService.getWeatherForecast(lat, lng, location.elevation, location.countryCode);

                // Store timezone from API (e.g., "America/New_York")
                if (data.timezone) {
                    setTimezone(data.timezone);
                }

                // Pass isMetric preference to calculation
                const forecast = WeatherService.calculateForecast(data, isTBH, isMetric);
                setWindows(forecast);
            } catch (err: any) {
                console.error('Forecast error:', err);
                setError(err.message || 'Failed to load forecast');
            } finally {
                setLoading(false);
            }
        };

        fetchForecast();
    }, [location, isTBH, isMetric]);

    // Group windows by date
    const gridData: Record<string, Record<number, InspectionWindow>> = {};
    const uniqueDates = new Set<string>();

    windows.forEach(w => {
        const windowDateString = w.displayDate;
        uniqueDates.add(windowDateString);
        if (!gridData[windowDateString]) gridData[windowDateString] = {};
        gridData[windowDateString][w.displayHour] = w;
    });

    const sortedDates = Array.from(uniqueDates).sort();

    // Group only today onwards (relative to Location's Timezone)
    const now = new Date();
    // Get "YYYY-MM-DD" string for the location's timezone
    const locationToday = now.toLocaleDateString('en-CA', { timeZone: timezone });
    const filteredDates = sortedDates.filter(dateStr => dateStr >= locationToday);

    const timeSlots = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'bg-green-700';
        if (score >= 70) return 'bg-green-500';
        if (score >= 55) return 'bg-amber-400';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getScoreColorV2 = (classification: 'Optimal' | 'Viable' | 'Inadvisable', score: number) => {
        if (classification === 'Optimal') return 'bg-green-600';
        if (classification === 'Viable') return 'bg-amber-400';
        return 'bg-red-500';
    };

    const formatTimeSlot = (hour: number) => {
        if (is24h) {
            return `${hour.toString().padStart(2, '0')}:00`;
        }
        // 12h format — single hour labels
        if (hour === 0 || hour === 24) return '12am';
        if (hour === 12) return '12pm';
        if (hour < 12) return `${hour}am`;
        return `${hour - 12}pm`;
    };

    // Helper to format temp
    const formatTemp = (tempF: number) => {
        if (isMetric) {
            const tempC = (tempF - 32) * 5 / 9;
            return `${Math.round(tempC)}°C`;
        }
        return `${Math.round(tempF)}°F`;
    };

    // Helper to format speed
    const formatSpeed = (mph: number) => {
        if (isMetric) {
            return `${Math.round(mph * 1.60934)}km/h`;
        }
        return `${Math.round(mph)}mph`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#FFFBF0]">
                <div className="text-center">
                    <div className="animate-pulse text-4xl mb-4">🐝</div>
                    <div className="text-[#8B4513] font-bold">Loading Forecast...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="text-center text-red-600 mb-4">
                    <div className="text-2xl mb-2">⚠️</div>
                    <div className="font-bold">Error: {error}</div>
                </div>
                {onBack && (
                    <button onClick={onBack} className="text-[#8B4513] underline text-sm">
                        Try another zip code
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 pb-20">
            {/* Unified Header */}
            <div className="max-w-xl mx-auto mb-8 px-4">
                <div className="flex items-center justify-between gap-6 bg-white/50 p-4 rounded-2xl backdrop-blur-sm shadow-sm border border-white/20">
                    <div className="flex items-center gap-4">
                        <a href="/" className="shrink-0">
                            <img
                                src="/icon-192.png"
                                alt="Logo"
                                className="w-12 h-12 rounded-xl shadow-sm"
                            />
                        </a>

                        <div>
                            <h2 className="text-xl font-bold text-[#8B4513] leading-tight">Hive Forecast</h2>
                            <p className="text-xs text-gray-600 font-medium">
                                {location.type === 'zip'
                                    ? `Zip: ${location.zip}`
                                    : `Loc: ${location.lat?.toFixed(2)}, ${location.lng?.toFixed(2)}`}
                            </p>
                        </div>
                    </div>

                    {onBack && (
                        <button
                            onClick={onBack}
                            className="shrink-0 text-xs font-semibold bg-white border border-amber-200 px-4 py-2 rounded-xl text-amber-800 shadow-sm hover:bg-amber-50 hover:border-amber-300 transition-all active:scale-95 whitespace-nowrap"
                        >
                            Change Location
                        </button>
                    )}
                </div>
            </div>

            {/* Minimal Header: Legend + Help */}
            <div className="mb-6 space-y-4">
                {/* TBH Mode Toggle */}
                <div className="flex justify-center">
                    <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                        <input
                            type="checkbox"
                            checked={isTBH}
                            onChange={(e) => setIsTBH(e.target.checked)}
                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-700">Top Bar Hive Mode</span>
                        <span className="text-[10px] text-gray-400">(heat penalty)</span>
                    </label>
                </div>

                {/* Unified Legend */}
                <div className="flex flex-col md:flex-row gap-4 justify-center items-center text-[10px] sm:text-xs bg-white/70 p-4 rounded-2xl border border-amber-100 shadow-sm max-w-3xl mx-auto backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <span className="font-extrabold text-[#8B4513] mb-1.5 uppercase tracking-wider text-[9px]">Grid 1: Continuous (0-100)</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
                            <LegendItem label="Excellent 85+" color="bg-green-700" />
                            <LegendItem label="Good 70-84" color="bg-green-500" />
                            <LegendItem label="Fair 55-69" color="bg-amber-400" />
                            <LegendItem label="Poor 40-54" color="bg-orange-500" />
                            <LegendItem label="Inadvisable <40" color="bg-red-500" />
                        </div>
                    </div>
                    <div className="hidden md:block h-10 w-px bg-amber-200/60"></div>
                    <div className="flex flex-col items-center">
                        <span className="font-extrabold text-[#8B4513] mb-1.5 uppercase tracking-wider text-[9px]">Grid 2: Decision Points (0-9)</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
                            <LegendItem label="Optimal 7-9" color="bg-green-600" />
                            <LegendItem label="Viable 4-6" color="bg-amber-400" />
                            <LegendItem label="Inadvisable 0-3" color="bg-red-500" />
                        </div>
                    </div>
                </div>

                {/* Help Link */}
                <div className="flex flex-col items-center gap-2">
                    <div className="text-center text-[10px] text-gray-400 italic">
                        Tap a cell on either grid to view side-by-side details
                    </div>
                    <button
                        onClick={() => setShowHelpModal(true)}
                        className="text-[11px] text-amber-600 hover:text-amber-700 font-bold underline decoration-dotted underline-offset-4 transition-colors"
                    >
                        How are these scores calculated?
                    </button>
                </div>
            </div>

            {/* Grids Side-by-Side Wrapper */}
            <div className="flex flex-col xl:flex-row gap-8 justify-center items-start w-full max-w-7xl mx-auto px-2">
                
                {/* GRID 1: V1 SCORE (0-100) */}
                <div className="w-full xl:w-1/2 flex flex-col items-center">
                    <h3 className="text-sm font-black text-[#8B4513] mb-3.5 flex items-center gap-2 bg-white/70 border border-amber-200 px-4 py-2 rounded-full shadow-sm">
                        <span>📊</span> Grid 1: Original Score (0-100)
                    </h3>
                    <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200 w-full max-w-2xl bg-white">
                        <table className="border-collapse w-full text-xs">
                            <thead>
                                <tr className="bg-amber-50/50">
                                    <th className="border-b border-r border-gray-200 px-3 py-2.5 font-bold sticky left-0 bg-amber-50/90 z-10 text-[#8B4513]">Time</th>
                                    {filteredDates.map(dateStr => {
                                        const date = new Date(dateStr + 'T12:00:00');
                                        return (
                                            <th key={dateStr} className="border-b border-gray-200 px-2 py-2.5 min-w-[65px] text-center">
                                                <div className="font-extrabold text-[#8B4513]">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                                <div className="text-[10px] text-gray-500 font-bold">{date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.map(hour => (
                                    <tr key={hour} className="hover:bg-amber-50/20">
                                        <td className="border-b border-r border-gray-200 px-3 py-2 font-bold sticky left-0 bg-white z-10 text-gray-500 text-[10px]">
                                            {formatTimeSlot(hour)}
                                        </td>
                                        {filteredDates.map(dateStr => {
                                            const window = gridData[dateStr]?.[hour];
                                            if (!window) {
                                                return <td key={dateStr} className="border-b border-gray-200 bg-gray-50 h-10 w-16"></td>;
                                            }

                                            const isFail = window.score < 40 || window.issues.length > 0;
                                            const textColor = isFail ? 'text-black' : 'text-white';

                                            return (
                                                <td
                                                    key={dateStr}
                                                    className={`border-b border-gray-200 h-10 w-16 cursor-pointer hover:opacity-90 transition-opacity ${getScoreColor(window.score)}`}
                                                    onClick={() => { setSelectedWindow(window); setDiagWindow(window); }}
                                                >
                                                    <div className={`flex items-center justify-center h-full font-black text-sm ${textColor}`}>
                                                        {Math.round(window.score)}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* GRID 2: V2 SCORE (0-9 POINTS) */}
                <div className="w-full xl:w-1/2 flex flex-col items-center">
                    <h3 className="text-sm font-black text-[#8B4513] mb-3.5 flex items-center gap-2 bg-white/70 border border-amber-200 px-4 py-2 rounded-full shadow-sm">
                        <span>🔬</span> Grid 2: Decision Points (0-9)
                    </h3>
                    <div className="overflow-x-auto rounded-xl shadow-md border border-gray-200 w-full max-w-2xl bg-white">
                        <table className="border-collapse w-full text-xs">
                            <thead>
                                <tr className="bg-amber-50/50">
                                    <th className="border-b border-r border-gray-200 px-3 py-2.5 font-bold sticky left-0 bg-amber-50/90 z-10 text-[#8B4513]">Time</th>
                                    {filteredDates.map(dateStr => {
                                        const date = new Date(dateStr + 'T12:00:00');
                                        return (
                                            <th key={dateStr} className="border-b border-gray-200 px-2 py-2.5 min-w-[65px] text-center">
                                                <div className="font-extrabold text-[#8B4513]">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                                <div className="text-[10px] text-gray-500 font-bold">{date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.map(hour => (
                                    <tr key={hour} className="hover:bg-amber-50/20">
                                        <td className="border-b border-r border-gray-200 px-3 py-2 font-bold sticky left-0 bg-white z-10 text-gray-500 text-[10px]">
                                            {formatTimeSlot(hour)}
                                        </td>
                                        {filteredDates.map(dateStr => {
                                            const window = gridData[dateStr]?.[hour];
                                            if (!window) {
                                                return <td key={dateStr} className="border-b border-gray-200 bg-gray-50 h-10 w-16"></td>;
                                            }

                                            return (
                                                <td
                                                    key={dateStr}
                                                    className={`border-b border-gray-200 h-10 w-16 cursor-pointer hover:opacity-90 transition-opacity ${getScoreColorV2(window.classificationV2, window.scoreV2)}`}
                                                    onClick={() => { setSelectedWindow(window); setDiagWindow(window); }}
                                                >
                                                    <div className="flex items-center justify-center h-full font-black text-sm text-white">
                                                        {window.issuesV2.length > 0 ? 'FAIL' : window.scoreV2}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Side-by-Side Detailed Comparison Modal */}
            {selectedWindow && (
                <div className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto" onClick={() => setSelectedWindow(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 mt-8 relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-[#8B4513]">Inspection Window Comparison</h3>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">
                                    {selectedWindow.startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    <span className="text-amber-600 ml-2 font-black">
                                        {formatTimeSlot(selectedWindow.startTime.getHours())}
                                    </span>
                                </p>
                            </div>
                            <button onClick={() => setSelectedWindow(null)} className="text-3xl text-gray-400 hover:text-gray-600 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">&times;</button>
                        </div>

                        {/* Side-by-Side Methodology Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            
                            {/* METHODOLOGY 1 (V1) */}
                            <div className="bg-amber-50/30 border border-amber-100 rounded-2xl p-5 shadow-sm space-y-4">
                                <h4 className="text-base font-black text-[#8B4513] border-b border-amber-100 pb-2 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                    V1: Continuous Score (0-100)
                                </h4>
                                
                                <div className={`${getScoreColor(selectedWindow.score)} rounded-xl p-5 text-center text-white shadow-md`}>
                                    <span className="text-5xl font-black">{Math.round(selectedWindow.score)}</span>
                                    <span className="text-sm font-black block opacity-90 uppercase mt-1">
                                        {selectedWindow.score >= 85 ? 'Excellent' :
                                         selectedWindow.score >= 70 ? 'Good' :
                                         selectedWindow.score >= 55 ? 'Fair' :
                                         selectedWindow.score >= 40 ? 'Poor' : 'Not Recommended'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <StatCard label="Temperature" value={formatTemp(selectedWindow.tempF)} score={selectedWindow.scoreBreakdown['Temperature']} maxScore={40} />
                                    <StatCard label="Cloud Cover" value={`${Math.round(selectedWindow.cloudCover)}%`} score={selectedWindow.scoreBreakdown['Cloud Cover']} maxScore={20} />
                                    <StatCard label="Wind Speed" value={formatSpeed(selectedWindow.windMph)} score={selectedWindow.scoreBreakdown['Wind Speed']} maxScore={20} />
                                    <StatCard label="Precip Chance" value={`${Math.round(selectedWindow.precipProb)}%`} score={selectedWindow.scoreBreakdown['Precipitation']} maxScore={15} />
                                    <StatCard label="Humidity" value={`${Math.round(selectedWindow.humidity)}%`} score={selectedWindow.scoreBreakdown['Humidity']} maxScore={5} />
                                </div>

                                {selectedWindow.issues.length > 0 && (
                                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs">
                                        <h5 className="font-bold text-red-700 mb-1">V1 Penalties/Issues:</h5>
                                        <ul className="text-red-600 space-y-0.5 list-disc pl-4 font-medium">
                                            {selectedWindow.issues.map((issue, idx) => <li key={idx}>{issue}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* METHODOLOGY 2 (V2) */}
                            <div className="bg-amber-50/30 border border-amber-100 rounded-2xl p-5 shadow-sm space-y-4">
                                <h4 className="text-base font-black text-[#8B4513] border-b border-amber-100 pb-2 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                    V2: Decision Points (0-9)
                                </h4>

                                <div className={`${getScoreColorV2(selectedWindow.classificationV2, selectedWindow.scoreV2)} rounded-xl p-5 text-center text-white shadow-md`}>
                                    <span className="text-5xl font-black">{selectedWindow.scoreV2} / 9</span>
                                    <span className="text-sm font-black block opacity-90 uppercase mt-1">
                                        {selectedWindow.classificationV2}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <StatCard label="Temperature" value={formatTemp(selectedWindow.tempF)} score={selectedWindow.scoreBreakdownV2['Temperature']} maxScore={3} />
                                    <StatCard label="Time of Day" value={formatTimeSlot(selectedWindow.startTime.getHours())} score={selectedWindow.scoreBreakdownV2['Time of Day']} maxScore={2} />
                                    <StatCard label="Sky Condition" value={selectedWindow.cloudCover <= 30 ? 'Sunny' : 'Cloudy'} score={selectedWindow.scoreBreakdownV2['Sky Condition']} maxScore={2} />
                                    <StatCard label="Wind Speed" value={formatSpeed(selectedWindow.windMph)} score={selectedWindow.scoreBreakdownV2['Wind Speed']} maxScore={2} />
                                </div>

                                {/* Barometric storm tracking stats in V2 */}
                                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-xs flex justify-between">
                                    <div>
                                        <span className="text-gray-500 font-bold block">Barometric Pressure</span>
                                        <span className="font-bold text-gray-800">{selectedWindow.pressureHpa.toFixed(1)} hPa</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-500 font-bold block">Hourly Trend</span>
                                        <span className={`font-bold ${selectedWindow.pressureTrend >= 1.5 ? 'text-red-600' : 'text-blue-600'}`}>
                                            {selectedWindow.pressureTrend > 0 ? '↓' : '↑'} {Math.abs(selectedWindow.pressureTrend).toFixed(1)} hPa/hr
                                        </span>
                                    </div>
                                </div>

                                {selectedWindow.issuesV2.length > 0 ? (
                                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs">
                                        <h5 className="font-bold text-red-700 mb-1">V2 Tripped Fail-Safes (Short-Circuit):</h5>
                                        <ul className="text-red-600 space-y-0.5 list-disc pl-4 font-bold">
                                            {selectedWindow.issuesV2.map((issue, idx) => <li key={idx}>{issue}</li>)}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-xs text-green-700 font-bold">
                                        ✓ Fail-safes cleared! Inspection is safe to conduct.
                                    </div>
                                )}
                            </div>

                        </div>
                        
                        {/* Footer text */}
                        <div className="text-center mt-6 text-[10px] text-gray-400 font-bold italic">
                            Methodology comparison helps identify the gentlest environment for your bees and comb.
                        </div>
                    </div>
                </div>
            )}


            {/* Scoring Help Modal */}
            <ScoringHelpModal
                isOpen={showHelpModal}
                onClose={() => setShowHelpModal(false)}
            />

            {/* Footnote */}
            <div className="text-center mt-4 space-y-3">
                <p className="text-[10px] text-gray-400 italic">
                    White numerals = OK to inspect · Black numerals = Not recommended
                </p>
                <a
                    href="https://beektools.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium hover:underline transition-colors"
                >
                    Full Beekeeping App →
                </a>
            </div>
        </div>
    );
}

function LegendItem({ label, color }: { label: string; color: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
            <span className="text-gray-600">{label}</span>
        </div>
    );
}

function StatCard({ label, value, score, maxScore }: { label: string; value: string; score?: number; maxScore?: number }) {
    // Determine status (Red border if score is low, e.g., < 50%)
    const isLow = (score !== undefined && maxScore !== undefined) && (score <= (maxScore / 2));

    return (
        <div className={`bg-gray-50 rounded-lg p-3 ${isLow ? 'border-2 border-red-100' : 'border border-gray-100'}`}>
            <div className="text-[10px] text-gray-500 font-medium mb-0.5 uppercase tracking-wider">{label}</div>
            <div className="flex justify-between items-end">
                <div className="text-base font-semibold text-gray-900">{value}</div>
                {(score !== undefined && maxScore !== undefined) && (
                    <div className="text-xs font-bold text-gray-400">
                        {score}/{maxScore}
                    </div>
                )}
            </div>
        </div>
    );
}
