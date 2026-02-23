'use client';

import { useState } from 'react';
import { CoordinatesInput } from './CoordinatesInput';

export interface LocationInputProps {
    onLocationSubmit: (location: { type: 'zip' | 'coords'; zip?: string; countryCode?: string; lat?: number; lng?: number; elevation?: number; remember: boolean }) => void;
    initialValues?: { type: 'zip' | 'coords'; zip?: string; countryCode?: string; lat?: number; lng?: number; elevation?: number; remember?: boolean };
}

const COUNTRIES = [
    { code: 'au', name: 'Australia', flag: '🇦🇺', regex: /^\d{4}$/, placeholder: 'Postcode (e.g. 2000)' },
    { code: 'at', name: 'Austria', flag: '🇦🇹', regex: /^\d{4}$/, placeholder: 'PLZ (e.g. 1010)' },
    { code: 'be', name: 'Belgium', flag: '🇧🇪', regex: /^\d{4}$/, placeholder: 'Code Postal (e.g. 1000)' },
    { code: 'bg', name: 'Bulgaria', flag: '🇧🇬', regex: /^\d{4}$/, placeholder: 'Пощенски код (e.g. 1000)' },
    { code: 'ca', name: 'Canada', flag: '🇨🇦', regex: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i, placeholder: 'Postal Code (e.g. K1A 0B1)' },
    { code: 'hr', name: 'Croatia', flag: '🇭🇷', regex: /^\d{5}$/, placeholder: 'Poštanski broj (e.g. 10000)' },
    { code: 'cz', name: 'Czech Republic', flag: '🇨🇿', regex: /^\d{3}\s?\d{2}$/, placeholder: 'PSČ (e.g. 110 00)' },
    { code: 'dk', name: 'Denmark', flag: '🇩🇰', regex: /^\d{4}$/, placeholder: 'Postnummer (e.g. 1050)' },
    { code: 'ee', name: 'Estonia', flag: '🇪🇪', regex: /^\d{5}$/, placeholder: 'Postiindeks (e.g. 10001)' },
    { code: 'fi', name: 'Finland', flag: '🇫🇮', regex: /^\d{5}$/, placeholder: 'Postinumero (e.g. 00100)' },
    { code: 'fr', name: 'France', flag: '🇫🇷', regex: /^\d{5}$/, placeholder: 'Code Postal (e.g. 75001)' },
    { code: 'de', name: 'Germany', flag: '🇩🇪', regex: /^\d{5}$/, placeholder: 'PLZ (e.g. 10115)' },
    { code: 'gh', name: 'Ghana', flag: '🇬🇭', regex: /^.+$/, placeholder: 'Use Coordinates tab instead' },
    { code: 'gr', name: 'Greece', flag: '🇬🇷', regex: /^\d{3}\s?\d{2}$/, placeholder: 'Τ.Κ. (e.g. 104 31)' },
    { code: 'hu', name: 'Hungary', flag: '🇭🇺', regex: /^\d{4}$/, placeholder: 'Irányítószám (e.g. 1011)' },
    { code: 'ie', name: 'Ireland', flag: '🇮🇪', regex: /^[A-Z]\d[\dW]\s?[A-Z\d]{4}$/i, placeholder: 'Eircode (e.g. D01 F5P2)' },
    { code: 'it', name: 'Italy', flag: '🇮🇹', regex: /^\d{5}$/, placeholder: 'CAP (e.g. 00100)' },
    { code: 'lv', name: 'Latvia', flag: '🇱🇻', regex: /^LV-?\d{4}$/i, placeholder: 'Pasta indekss (e.g. LV-1001)' },
    { code: 'lt', name: 'Lithuania', flag: '🇱🇹', regex: /^(LT-?)?\d{5}$/i, placeholder: 'Pašto kodas (e.g. 01001)' },
    { code: 'lu', name: 'Luxembourg', flag: '🇱🇺', regex: /^\d{4}$/, placeholder: 'Code Postal (e.g. 1009)' },
    { code: 'nl', name: 'Netherlands', flag: '🇳🇱', regex: /^\d{4}\s?[A-Z]{2}$/i, placeholder: 'Postcode (e.g. 1012 JS)' },
    { code: 'nz', name: 'New Zealand', flag: '🇳🇿', regex: /^\d{4}$/, placeholder: 'Postcode (e.g. 6011)' },
    { code: 'no', name: 'Norway', flag: '🇳🇴', regex: /^\d{4}$/, placeholder: 'Postnummer (e.g. 0001)' },
    { code: 'pl', name: 'Poland', flag: '🇵🇱', regex: /^\d{2}-\d{3}$/, placeholder: 'Kod pocztowy (e.g. 00-001)' },
    { code: 'pt', name: 'Portugal', flag: '🇵🇹', regex: /^\d{4}-\d{3}$/, placeholder: 'Código Postal (e.g. 1000-001)' },
    { code: 'ro', name: 'Romania', flag: '🇷🇴', regex: /^\d{6}$/, placeholder: 'Cod poștal (e.g. 010001)' },
    { code: 'es', name: 'Spain', flag: '🇪🇸', regex: /^\d{5}$/, placeholder: 'Código Postal (e.g. 28001)' },
    { code: 'se', name: 'Sweden', flag: '🇸🇪', regex: /^\d{3}\s?\d{2}$/, placeholder: 'Postnummer (e.g. 111 22)' },
    { code: 'ch', name: 'Switzerland', flag: '🇨🇭', regex: /^\d{4}$/, placeholder: 'PLZ (e.g. 3000)' },
    { code: 'gb', name: 'United Kingdom', flag: '🇬🇧', regex: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, placeholder: 'Postcode (e.g. SW1A 1AA)' },
    { code: 'us', name: 'United States', flag: '🇺🇸', regex: /^\d{5}$/, placeholder: 'Zip Code (e.g. 80304)' },
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
                                            const newCode = e.target.value;
                                            setCountryCode(newCode);
                                            setZipError('');
                                            // Ghana has no postal codes — auto-switch to Coordinates
                                            if (newCode === 'gh') {
                                                setActiveTab('coords');
                                            }
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
