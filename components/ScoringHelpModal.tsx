'use client';

import React from 'react';

interface ScoringHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ScoringHelpModal({ isOpen, onClose }: ScoringHelpModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-amber-50/30">
                    <div>
                        <h3 className="text-xl font-bold text-[#8B4513]">How Scores are Calculated</h3>
                        <p className="text-xs text-[#8B4513]/70 font-medium">Optimal conditions for hive inspections</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
                    {/* V2 Intro */}
                    <p className="text-gray-600 leading-relaxed">
                        The Decision Points matrix (0-9 points) evaluates key weather bounds. Points are calculated unconditionally, allowing you to see the score potential even when safety fail-safes are triggered (which colors the cell Red).
                    </p>

                    {/* V2 Point Breakdown */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-[#4A3C28] uppercase tracking-wider text-xs">Point System</h4>

                        <div className="grid gap-3">
                            <ScoreRule
                                label="Temperature"
                                max="3"
                                description="Warm weather is safer. Brood chilling is a primary concern."
                                detail="Optimal: 68°F - 85°F (3 pts). Sub-optimal: 58°F - 67°F or 86°F - 91°F (1 pt). Else (0 pts)."
                            />
                            <ScoreRule
                                label="Time of Day"
                                max="2"
                                description="Inspect after the colony wakes up and before foragers return."
                                detail="Optimal: >= 1 hour since temperature hit 55°F AND starts >= 1 hour before sunset (2 pts). Else (0 pts)."
                            />
                            <ScoreRule
                                label="Sky Condition"
                                max="2"
                                description="Sunny, clear weather encourages flight and lowers defensive tempers."
                                detail="Clear / Sunny (< 30% clouds) (2 pts). Partly Cloudy (30% - 70% clouds) (1 pt). Overcast (> 70% clouds) (0 pts)."
                            />
                            <ScoreRule
                                label="Wind Speed"
                                max="2"
                                description="Calm winds preserve hive warmth and prevent flight disruptions."
                                detail="Optimal: < 10mph (2 pts). Sub-optimal: 10 - 15mph (1 pt). Else (0 pts)."
                            />
                        </div>
                    </div>

                    {/* V2 Fail-Safes */}
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                            </svg>
                            Safety Fail-Safes (Forces Red Cell)
                        </h4>
                        <p className="text-xs text-red-600 mb-2">
                            If any of these conditions evaluate to TRUE, execution is immediately aborted (classification: <strong>Inadvisable / Red Cell</strong>) and points default to 0:
                        </p>
                        <ul className="grid grid-cols-1 gap-y-1 text-xs text-red-700 list-disc ml-4 font-medium">
                            <li><strong>Brood Chill Threshold:</strong> Temperature &lt; 57°F (14°C) (extreme cold risk)</li>
                            <li><strong>Comb Heat/Heat Stroke:</strong> Temperature &gt; 92°F (33°C) (slumping wax risk)</li>
                            <li><strong>Flight Disruption Wind:</strong> Wind speed &gt; 18mph (colony aggression risk)</li>
                            <li><strong>Active Precipitation:</strong> Raining, stormy, or precipitation chance &ge; 50%</li>
                            <li><strong>Severe Storm Plunge:</strong> 3-hour barometric pressure drop &ge; 4.0 hPa (severe front approaching)</li>
                            <li><strong>Wake-up Temperature:</strong> Must be at least 1 hour since temperature crossed &ge; 55°F (colony activity wake-up buffer)</li>
                            <li><strong>Sunset Safety Buffer:</strong> Inspection must start at least 1 hour before daily sunset (allows foragers to safely return to hive)</li>
                            <li><em>Note: A moderate drop of 1.5 to 4.0 hPa does not abort, but applies a <strong>-2 point penalty</strong>.</em></li>
                        </ul>
                    </div>
                </div>
                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-[#8B4513] text-white rounded-lg font-bold hover:bg-[#6D360F] transition-colors shadow-sm"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
}

function ScoreRule({ label, max, description, detail }: { label: string, max: string, description: string, detail: string }) {
    return (
        <div className="group border border-gray-100 rounded-xl p-3 hover:bg-amber-50/20 transition-colors">
            <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-[#4A3C28]">{label}</span>
                <span className="text-xs font-bold bg-amber-100 text-[#8B4513] px-2 py-0.5 rounded-full">{max} pts</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{description}</p>
            <p className="text-[10px] text-gray-400 font-mono bg-gray-50 p-1.5 rounded">{detail}</p>
        </div>
    );
}
