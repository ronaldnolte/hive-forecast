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
                <div className="p-6 overflow-y-auto space-y-6 text-sm">
                    {/* Intro */}
                    <p className="text-gray-600 leading-relaxed">
                        The inspection suitability score (0-100) is a weighted calculation based on 5 key weather factors. High scores indicate ideal conditions for opening the hive with minimal stress to the colony.
                    </p>

                    {/* Point Breakdown */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-[#4A3C28] uppercase tracking-wider text-xs">Point System</h4>

                        <div className="grid gap-3">
                            <ScoreRule
                                label="Temperature"
                                max="40"
                                description="Best above 75°F. Bees are more active and brood is less likely to chill."
                                detail="75°F+ (40 pts), 70°F (37 pts), 65°F (33 pts), 60°F (27 pts), 57°F (18 pts), 55°F (8 pts)."
                            />
                            <ScoreRule
                                label="Cloud Cover"
                                max="20"
                                description="Bees prefer sun. Foragers are out working, making the hive less crowded."
                                detail="Sunny (20 pts), Partly Cloudy (17 pts), Mostly Cloudy (12 pts), Overcast (6 pts)."
                            />
                            <ScoreRule
                                label="Wind Speed"
                                max="20"
                                description="High winds make bees defensive and can chill the brood."
                                detail="<5mph (20 pts), 10mph (18 pts), 15mph (12 pts), 20mph (6 pts), 24mph (2 pts)."
                            />
                            <ScoreRule
                                label="Precipitation"
                                max="15"
                                description="Rain is a hard limit. Never open a hive in the rain."
                                detail="0% Prob (15 pts), 10% (12 pts), 20% (8 pts), 35% (4 pts), 49% (1 pt)."
                            />
                            <ScoreRule
                                label="Humidity"
                                max="5"
                                description="Bees regulate humidity easily if the air is moderate (30-70%)."
                                detail="30-70% (5 pts). Outside this range (0 pts)."
                            />
                        </div>
                    </div>

                    {/* Critical Limits */}
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Hard Limits
                        </h4>
                        <p className="text-xs text-red-600 mb-2">
                            A score will appear in <span className="font-bold text-black border-b border-black">black text</span> if any of these conditions are met, suggesting you should **not** inspect:
                        </p>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-red-700 list-disc ml-4">
                            <li>Score below 40</li>
                            <li>Temperature &lt; 55°F</li>
                            <li>Wind &gt; 24mph</li>
                            <li>Rain Chance &gt; 49%</li>
                            <li>Active Storms</li>
                            <li>Raining Now</li>
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
