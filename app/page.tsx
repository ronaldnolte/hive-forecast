"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

import Image from "next/image"

export default function Home() {
  const [zipCode, setZipCode] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (zipCode.length === 5) {
      router.push(`/forecast?zip=${zipCode}`)
    }
  }

  return (
    <div className="min-h-screen bg-background honeycomb-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <div className="w-24 h-24 mx-auto flex items-center justify-center mb-6">
            <Image
              src="/logo.jpg"
              alt="HiveForecast Logo"
              width={96}
              height={96}
              className="rounded-2xl shadow-lg"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">HiveForecast</h1>
          <p className="text-muted-foreground">
            Enter your zip code to see the best times to inspect your hives.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="Enter Zip Code (e.g. 12345)"
              className="w-full h-12 px-4 rounded-lg border bg-background shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-center text-lg tracking-widest"
              pattern="[0-9]{5}"
              required
            />
          </div>
          <Button type="submit" className="w-full h-12 text-lg" disabled={zipCode.length !== 5}>
            <Search className="mr-2 h-5 w-5" />
            Get Forecast
          </Button>
        </form>
      </div>
    </div>
  )
}
