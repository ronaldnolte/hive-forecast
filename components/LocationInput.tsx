'use client';

import { useState } from 'react';
import { CoordinatesInput } from './CoordinatesInput';

export interface LocationInputProps {
    onLocationSubmit: (location: { type: 'zip' | 'coords'; zip?: string; lat?: number; lng?: number; elevation?: number; remember: boolean }) => void;
    initialValues?: { type: 'zip' | 'coords'; zip?: string; lat?: number; lng?: number; elevation?: number; remember?: boolean };
}

export function LocationInput({ onLocationSubmit, initialValues }: LocationInputProps) {
    const [activeTab, setActiveTab] = useState<'zip' | 'coords'>(initialValues?.type === 'coords' ? 'coords' : 'zip');
    const [remember, setRemember] = useState(initialValues?.remember || false);

    // Zip Input State
    const [zip, setZip] = useState(initialValues?.zip || '');
    const [zipError, setZipError] = useState('');

    const handleZipSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d{5}$/.test(zip)) {
            setZipError('Please enter a valid 5-digit US Zip Code');
            return;
        }
        setZipError('');
        onLocationSubmit({ type: 'zip', zip, remember });
    };

    const handleCoordsSubmit = (lat: number, lng: number, elevation?: number) => {
        onLocationSubmit({ type: 'coords', lat, lng, elevation, remember });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100">
                {/* Header */}
                <div className="text-center pt-8 pb-4 px-8">
                    <div className="text-5xl mb-4">🐝</div>
                    <h1 className="text-2xl font-bold text-[#8B4513] mb-2">Hive Forecast</h1>
                    <p className="text-gray-600 text-sm">
                        Enter your apiary's location to see the best times for inspections.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('zip')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'zip'
                            ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Zip Code
                    </button>
                    <button
                        onClick={() => setActiveTab('coords')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'coords'
                            ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Coordinates
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 pt-6 pb-4">
                    {activeTab === 'zip' ? (
                        <form onSubmit={handleZipSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="zip" className="sr-only">Zip Code</label>
                                <input
                                    type="text"
                                    id="zip"
                                    value={zip}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                                        setZip(val);
                                        setZipError('');
                                    }}
                                    placeholder="Zip Code (e.g. 80304)"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-center text-lg tracking-widest text-gray-900 placeholder:text-gray-500"
                                    inputMode="numeric"
                                />
                            </div>

                            {zipError && (
                                <p className="text-red-500 text-xs text-center animate-pulse">{zipError}</p>
                            )}

                            <button
                                type="submit"
                                disabled={zip.length !== 5}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-95"
                            >
                                Get Forecast
                            </button>
                        </form>
                    ) : (
                        <CoordinatesInput
                            onCoordsSubmit={handleCoordsSubmit}
                            initialValues={initialValues}
                        />
                    )}
                </div>

                {/* Footer / Checkbox */}
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-center">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-800 transition-colors">
                        <input
                            type="checkbox"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                        />
                        Remember this location
                    </label>
                </div>
            </div>

            <p className="mt-8 text-xs text-gray-400 text-center max-w-xs">
                Data provided by Open-Meteo & Zippopotam.us. <br />
                No account required.
            </p>
        </div>
    );
}
