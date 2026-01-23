'use client';

import { useState, useEffect } from 'react';
import { WeatherService, InspectionWindow } from '@/services/WeatherService';
import { ScoringHelpModal } from './ScoringHelpModal';

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

                // Fetch weather
                const data = await WeatherService.getWeatherForecast(lat, lng, location.elevation);

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

    const timeSlots = [6, 8, 10, 12, 14, 16];

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'bg-green-700';
        if (score >= 70) return 'bg-green-500';
        if (score >= 55) return 'bg-amber-400';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const formatTimeSlot = (hour: number) => {
        if (is24h) {
            // 24h format: "06:00", "14:00" etc.
            return `${hour.toString().padStart(2, '0')}:00`;
        }
        // 12h format
        const slots: Record<number, string> = {
            6: '6-8am',
            8: '8-10am',
            10: '10am-12pm',
            12: '12-2pm',
            14: '2-4pm',
            16: '4-6pm'
        };
        return slots[hour] || `${hour}:00`;
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
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pl-16">
                <div>
                    <h2 className="text-xl font-bold text-[#8B4513]">Hive Forecast</h2>
                    <p className="text-xs text-gray-700 font-medium">
                        {location.type === 'zip'
                            ? `Zip: ${location.zip}`
                            : `Loc: ${location.lat?.toFixed(2)}, ${location.lng?.toFixed(2)}`}
                    </p>
                </div>
                {onBack && (
                    <button onClick={onBack} className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-full text-gray-600 shadow-sm">
                        Change Location
                    </button>
                )}
            </div>

            {/* Minimal Header: Legend + Help */}
            <div className="mb-4 space-y-3">
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

                {/* Legend */}
                <div className="flex flex-wrap gap-x-3 gap-y-2 justify-center text-[10px] sm:text-xs">
                    <LegendItem label="Excellent 85+" color="bg-green-700" />
                    <LegendItem label="Good 70-84" color="bg-green-500" />
                    <LegendItem label="Fair 55-69" color="bg-amber-400" />
                    <LegendItem label="Poor 40-54" color="bg-orange-500" />
                    <LegendItem label="Not Rec <40" color="bg-red-500" />
                </div>

                {/* Help Link */}
                <div className="flex flex-col items-center gap-2">
                    <div className="text-center text-[10px] text-gray-400 italic">
                        Tap a score for details
                    </div>
                    <button
                        onClick={() => setShowHelpModal(true)}
                        className="text-[11px] text-amber-600 hover:text-amber-700 font-bold underline decoration-dotted underline-offset-4 transition-colors"
                    >
                        How are these scores calculated?
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex justify-center">
                <div className="overflow-x-auto rounded-lg shadow-sm">
                    <table className="border-collapse border border-gray-200 bg-white text-xs">
                        <thead>
                            <tr className="bg-amber-50">
                                <th className="border border-gray-200 px-2 py-2 font-bold sticky left-0 bg-amber-50 z-10 text-[#8B4513]">Time</th>
                                {filteredDates.map(dateStr => {
                                    // Parse as local date (not UTC) by adding a time component
                                    const date = new Date(dateStr + 'T12:00:00');
                                    return (
                                        <th key={dateStr} className="border border-gray-200 px-2 py-2 min-w-[60px]">
                                            <div className="font-bold text-[#8B4513]">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                            <div className="text-[10px] text-gray-500">{date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map(hour => (
                                <tr key={hour}>
                                    <td className="border border-gray-200 px-2 py-1 font-bold sticky left-0 bg-white z-10 text-gray-600 text-[10px]">
                                        {formatTimeSlot(hour)}
                                    </td>
                                    {filteredDates.map(dateStr => {
                                        const window = gridData[dateStr]?.[hour];
                                        if (!window) {
                                            return <td key={dateStr} className="border border-gray-200 bg-gray-50 h-10 w-16"></td>;
                                        }

                                        const isFail = window.score < 40 || window.issues.length > 0;
                                        const textColor = isFail ? 'text-black' : 'text-white';

                                        return (
                                            <td
                                                key={dateStr}
                                                className={`border border-gray-200 h-10 w-16 cursor-pointer hover:opacity-90 transition-opacity ${getScoreColor(window.score)}`}
                                                onClick={() => setSelectedWindow(window)}
                                            >
                                                <div className={`flex items-center justify-center h-full font-bold text-sm ${textColor}`}>
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

            {/* Detail Modal */}
            {selectedWindow && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedWindow(null)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-[#8B4513]">Conditions</h3>
                                <p className="text-sm text-gray-600">
                                    {selectedWindow.startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <p className="text-sm font-medium text-amber-600">{formatTimeSlot(selectedWindow.startTime.getHours())}</p>
                            </div>
                            <button onClick={() => setSelectedWindow(null)} className="text-2xl text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">&times;</button>
                        </div>

                        {/* Score Banner */}
                        <div className={`${getScoreColor(selectedWindow.score)} rounded-lg p-6 text-center mb-3 shadow-inner`}>
                            <div className="text-6xl font-black text-white">{Math.round(selectedWindow.score)}</div>
                            <div className="text-white/90 font-medium text-sm uppercase tracking-wide">Overall Score</div>
                        </div>
                        <button
                            onClick={() => { setSelectedWindow(null); setShowHelpModal(true); }}
                            className="w-full text-center text-[11px] text-amber-600 hover:text-amber-700 font-medium underline decoration-dotted underline-offset-4 mb-4"
                        >
                            How are these scores calculated?
                        </button>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <StatCard
                                label="Temperature"
                                value={formatTemp(selectedWindow.tempF)}
                                score={selectedWindow.scoreBreakdown['Temperature']}
                                maxScore={40}
                            />
                            <StatCard
                                label="Cloud Cover"
                                value={`${Math.round(selectedWindow.cloudCover)}%`}
                                score={selectedWindow.scoreBreakdown['Cloud Cover']}
                                maxScore={20}
                            />
                            <StatCard
                                label="Wind Speed"
                                value={formatSpeed(selectedWindow.windMph)}
                                score={selectedWindow.scoreBreakdown['Wind Speed']}
                                maxScore={20}
                            />
                            <StatCard
                                label="Precip Chance"
                                value={`${Math.round(selectedWindow.precipProb)}%`}
                                score={selectedWindow.scoreBreakdown['Precipitation']}
                                maxScore={15}
                            />
                            {/* Humidity is minor, verify if we want it */}
                            <StatCard
                                label="Humidity"
                                value={`${Math.round(selectedWindow.humidity)}%`}
                                score={selectedWindow.scoreBreakdown['Humidity']}
                                maxScore={5}
                            />
                        </div>

                        <div className="space-y-4">
                            {/* Issues */}
                            {selectedWindow.issues.length > 0 && (
                                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                    <h4 className="font-bold text-red-700 mb-1 text-sm">Issues detected:</h4>
                                    <ul className="text-sm text-red-600 space-y-1 ml-1">
                                        {selectedWindow.issues.map((issue, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span>•</span>
                                                <span>{issue}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Good Conditions */}
                            {(() => {
                                const good = [];
                                if (selectedWindow.windMph <= 10) good.push(`Light winds (${formatSpeed(selectedWindow.windMph)})`);
                                if (selectedWindow.cloudCover <= 20) good.push(`Sunny (${Math.round(selectedWindow.cloudCover)}% clouds)`);
                                if (selectedWindow.precipProb === 0) good.push("No rain expected");
                                if (selectedWindow.tempF >= 60 && selectedWindow.tempF <= 90) good.push(`Good temperature (${formatTemp(selectedWindow.tempF)})`);
                                if (selectedWindow.humidity >= 30 && selectedWindow.humidity <= 70) good.push("Ideal humidity");

                                if (good.length > 0) {
                                    return (
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                            <h4 className="font-bold text-green-700 mb-1 text-sm">Good conditions:</h4>
                                            <ul className="text-sm text-green-600 space-y-1 ml-1">
                                                {good.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span>•</span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Scoring Help Modal */}
            <ScoringHelpModal
                isOpen={showHelpModal}
                onClose={() => setShowHelpModal(false)}
            />
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
