'use client';

import { useState } from 'react';

interface CoordinatesInputProps {
    onCoordsSubmit: (lat: number, lng: number, elevation?: number) => void;
    initialValues?: { type: 'zip' | 'coords'; zip?: string; lat?: number; lng?: number; elevation?: number; remember?: boolean };
}

export function CoordinatesInput({ onCoordsSubmit, initialValues }: CoordinatesInputProps) {
    const [lat, setLat] = useState(initialValues?.lat !== undefined ? String(initialValues.lat) : '');
    const [lng, setLng] = useState(initialValues?.lng !== undefined ? String(initialValues.lng) : '');
    const [elevation, setElevation] = useState(initialValues?.elevation !== undefined ? String(initialValues.elevation) : '');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        const elevNum = elevation ? parseFloat(elevation) : undefined;

        if (isNaN(latNum) || latNum < -90 || latNum > 90) {
            setError('Latitude must be between -90 and 90');
            return;
        }

        if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
            setError('Longitude must be between -180 and 180');
            return;
        }

        setError('');
        onCoordsSubmit(latNum, lngNum, elevNum);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="lat" className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Latitude</label>
                    <input
                        type="number"
                        id="lat"
                        value={lat}
                        onChange={(e) => { setLat(e.target.value); setError(''); }}
                        placeholder="e.g. 56.26"
                        step="any"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-center text-lg text-gray-900 placeholder:text-gray-400"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="lng" className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Longitude</label>
                    <input
                        type="number"
                        id="lng"
                        value={lng}
                        onChange={(e) => { setLng(e.target.value); setError(''); }}
                        placeholder="e.g. 9.50"
                        step="any"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-center text-lg text-gray-900 placeholder:text-gray-400"
                        required
                    />
                </div>
            </div>

            <div>
                <label htmlFor="elevation" className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                    Elevation <span className="text-gray-400 font-normal lowercase">(meters, optional)</span>
                </label>
                <input
                    type="number"
                    id="elevation"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-center text-lg text-gray-900 placeholder:text-gray-400"
                />
            </div>

            {error && (
                <p className="text-red-500 text-xs text-center animate-pulse">{error}</p>
            )}

            <button
                type="submit"
                disabled={!lat || !lng}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-95"
            >
                Get Forecast
            </button>
        </form>
    );
}
