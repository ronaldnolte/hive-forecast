'use client';

import { useState } from 'react';
import { CoordinatesInput } from './CoordinatesInput';

export interface LocationInputProps {
    onLocationSubmit: (location: { type: 'zip' | 'coords'; zip?: string; countryCode?: string; lat?: number; lng?: number; elevation?: number; remember: boolean }) => void;
    initialValues?: { type: 'zip' | 'coords'; zip?: string; countryCode?: string; lat?: number; lng?: number; elevation?: number; remember?: boolean };
}

const COUNTRIES = [
    { code: 'us', name: 'United States', flag: '🇺🇸', regex: /^\d{5}$/, placeholder: 'Zip Code (e.g. 80304)' },
    { code: 'gb', name: 'United Kingdom', flag: '🇬🇧', regex: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, placeholder: 'Postcode (e.g. SW1A 1AA)' },
    { code: 'be', name: 'Belgium', flag: '🇧🇪', regex: /^\d{4}$/, placeholder: 'Code Postal (e.g. 1000)' },
    { code: 'de', name: 'Germany', flag: '🇩🇪', regex: /^\d{5}$/, placeholder: 'PLZ (e.g. 10115)' },
    { code: 'dk', name: 'Denmark', flag: '🇩🇰', regex: /^\d{4}$/, placeholder: 'Postnummer (e.g. 1050)' },
    { code: 'fr', name: 'France', flag: '🇫🇷', regex: /^\d{5}$/, placeholder: 'Code Postal (e.g. 75001)' },
    { code: 'es', name: 'Spain', flag: '🇪🇸', regex: /^\d{5}$/, placeholder: 'Código Postal (e.g. 28001)' },
    { code: 'it', name: 'Italy', flag: '🇮🇹', regex: /^\d{5}$/, placeholder: 'CAP (e.g. 00100)' },
    { code: 'nl', name: 'Netherlands', flag: '🇳🇱', regex: /^\d{4}\s?[A-Z]{2}$/i, placeholder: 'Postcode (e.g. 1012 JS)' },
    { code: 'au', name: 'Australia', flag: '🇦🇺', regex: /^\d{4}$/, placeholder: 'Postcode (e.g. 2000)' },
    { code: 'ca', name: 'Canada', flag: '🇨🇦', regex: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i, placeholder: 'Postal Code (e.g. K1A 0B1)' },
];

export function LocationInput({ onLocationSubmit, initialValues }: LocationInputProps) {
    const [activeTab, setActiveTab] = useState<'zip' | 'coords'>(initialValues?.type === 'coords' ? 'coords' : 'zip');
    const [remember, setRemember] = useState(initialValues?.remember || false);

    // Zip Input State
    const [zip, setZip] = useState(initialValues?.zip || '');
    const [countryCode, setCountryCode] = useState(initialValues?.countryCode || 'us');
    const [zipError, setZipError] = useState('');

    const currentCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

    const handleZipSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentCountry.regex.test(zip)) {
            setZipError(`Invalid format for ${currentCountry.name}`);
            return;
        }
        setZipError('');
        onLocationSubmit({ type: 'zip', zip, countryCode, remember });
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
                        Postal Code
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
                            {/* Country Selector */}
                            <div>
                                <label htmlFor="country" className="sr-only">Country</label>
                                <div className="relative">
                                    <select
                                        id="country"
                                        value={countryCode}
                                        onChange={(e) => {
                                            setCountryCode(e.target.value);
                                            setZipError(''); // Clear error on change
                                        }}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all appearance-none bg-white text-gray-900 pr-10"
                                    >
                                        {COUNTRIES.map(c => (
                                            <option key={c.code} value={c.code}>
                                                {c.flag} {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                        ▼
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="zip" className="sr-only">Postal Code</label>
                                <input
                                    type="text"
                                    id="zip"
                                    value={zip}
                                    onChange={(e) => {
                                        setZip(e.target.value);
                                        setZipError('');
                                    }}
                                    placeholder={currentCountry.placeholder}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-center text-lg tracking-widest text-gray-900 placeholder:text-gray-500"
                                    autoComplete="postal-code"
                                />
                            </div>

                            {zipError && (
                                <p className="text-red-500 text-xs text-center animate-pulse">{zipError}</p>
                            )}

                            <button
                                type="submit"
                                disabled={!zip}
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
