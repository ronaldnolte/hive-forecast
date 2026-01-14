'use client';

import { useState, useEffect } from 'react';
import { ZipCodeInput } from '@/components/ZipCodeInput';
import { ForecastGrid } from '@/components/ForecastGrid';

export default function Home() {
  const [zipCode, setZipCode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from local storage if available
    const saved = localStorage.getItem('hive_forecast_zip');
    if (saved) {
      setZipCode(saved);
    }
  }, []);

  const handleZipSubmit = (zip: string) => {
    setZipCode(zip);
    localStorage.setItem('hive_forecast_zip', zip);
  };

  const handleBack = () => {
    setZipCode(null);
    localStorage.removeItem('hive_forecast_zip');
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#FFFBF0]">
      {zipCode ? (
        <ForecastGrid zipCode={zipCode} onBack={handleBack} />
      ) : (
        <ZipCodeInput onZipSubmit={handleZipSubmit} />
      )}
    </main>
  );
}
