'use client';

import { useState } from 'react';

interface ZipCodeInputProps {
    onZipSubmit: (zip: string) => void;
}

export function ZipCodeInput({ onZipSubmit }: ZipCodeInputProps) {
    const [zip, setZip] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic US Zip validation
        if (!/^\d{5}$/.test(zip)) {
            setError('Please enter a valid 5-digit US Zip Code');
            return;
        }

        setError('');
        onZipSubmit(zip);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-amber-100">
                <div className="text-center mb-6">
                    <div className="text-5xl mb-4">🐝</div>
                    <h1 className="text-2xl font-bold text-[#8B4513] mb-2">Hive Forecast</h1>
                    <p className="text-gray-600 text-sm">
                        Enter your apiary's zip code to see the best times for inspections.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="zip" className="sr-only">Zip Code</label>
                        <input
                            type="text"
                            id="zip"
                            value={zip}
                            onChange={(e) => {
                                // Only allow numbers and max 5 chars
                                const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                                setZip(val);
                                setError('');
                            }}
                            placeholder="Zip Code (e.g. 80304)"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-center text-lg tracking-widest text-gray-900 placeholder:text-gray-500"
                            inputMode="numeric"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-xs text-center animate-pulse">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={zip.length !== 5}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-95"
                    >
                        Get Forecast
                    </button>
                </form>
            </div>

            <p className="mt-8 text-xs text-gray-400 text-center max-w-xs">
                Data provided by Open-Meteo & Zippopotam.us. <br />
                No account required.
            </p>
        </div>
    );
}
