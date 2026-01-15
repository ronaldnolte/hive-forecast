'use client';

import { useState, useEffect } from 'react';
import { ZipCodeInput } from '@/components/ZipCodeInput';
import { ForecastGrid } from '@/components/ForecastGrid';

export default function Home() {
  const [zipCode, setZipCode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Do not load from localStorage - always start fresh
  }, []);

  const handleZipSubmit = (zip: string) => {
    setZipCode(zip);
    // Do not save to localStorage
  };

  const handleBack = () => {
    setZipCode(null);
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen">
      {/* Logo in upper left */}
      <div className="absolute top-4 left-4 z-50">
        <a href="/">
          <img
            src="/icon-192.png"
            alt="Hive Forecast Logo"
            className="w-12 h-12 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          />
        </a>
      </div>

      {zipCode ? (
        <ForecastGrid zipCode={zipCode} onBack={handleBack} />
      ) : (
        <ZipCodeInput onZipSubmit={handleZipSubmit} />
      )}
    </main>
  );
}
