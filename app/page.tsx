'use client';

import { useState, useEffect } from 'react';
import { LocationInput } from '@/components/LocationInput';
import { ForecastGrid } from '@/components/ForecastGrid';

interface LocationState {
  type: 'zip' | 'coords';
  zip?: string;
  countryCode?: string;
  lat?: number;
  lng?: number;
  elevation?: number;
  remember?: boolean;
}

export default function Home() {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [view, setView] = useState<'input' | 'forecast'>('input');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    }

    // Try to load from localStorage
    try {
      const saved = localStorage.getItem('hive_forecast_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        setLocation(parsed);
        // setView('forecast'); // Disable auto-run
      }
    } catch (e) {
      console.error('Failed to load location', e);
    }
  }, []);

  const handleLocationSubmit = (loc: LocationState) => {
    setLocation(loc);
    setView('forecast');

    // Handle Persistence
    if (loc.remember) {
      localStorage.setItem('hive_forecast_location', JSON.stringify(loc));
    } else {
      localStorage.removeItem('hive_forecast_location');
    }
  };

  const handleBack = () => {
    setView('input');
    // We do NOT clear location here, so we can pass it back as initialValues
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen">
      <div className="fixed bottom-2 right-3 text-[10px] text-gray-500 select-none z-50">v1.0.1</div>

      {/* Logo in upper left - Only visible on input screen */}
      {view === 'input' && (
        <div className="absolute top-4 left-4 z-50">
          <a href="/">
            <img
              src="/icon-192.png"
              alt="Hive Forecast Logo"
              className="w-12 h-12 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            />
          </a>
        </div>
      )}


      {view === 'forecast' && location ? (
        <ForecastGrid location={location} onBack={handleBack} />
      ) : (
        <LocationInput
          key={location ? 'loaded' : 'new'}
          onLocationSubmit={handleLocationSubmit}
          initialValues={location || undefined}
        />
      )}
    </main>
  );
}
