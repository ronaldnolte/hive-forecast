"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ScoringExplanationModalProps {
    isOpen: boolean
    onClose: () => void
}

export function ScoringExplanationModal({ isOpen, onClose }: ScoringExplanationModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div 
                className="bg-background rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-border" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-border shrink-0">
                    <h2 className="text-xl md:text-2xl font-bold">Scoring Formula</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
                    
                    {/* Time Periods */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 text-primary">Time Periods</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                                <span className="font-medium block mb-1">Early AM</span>
                                <span className="text-muted-foreground">8:00 AM – 10:00 AM</span>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                                <span className="font-medium block mb-1">Late AM</span>
                                <span className="text-muted-foreground">11:00 AM – 1:00 PM</span>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                                <span className="font-medium block mb-1">Early PM</span>
                                <span className="text-muted-foreground">2:00 PM – 4:00 PM</span>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                                <span className="font-medium block mb-1">Late PM</span>
                                <span className="text-muted-foreground">5:00 PM – 7:00 PM</span>
                            </div>
                        </div>
                    </section>

                    {/* Automatic Fail Conditions */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">Automatic Fail Conditions (Score = 0)</h3>
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground mb-3">
                                If any of these conditions are met, the score is automatically <strong>0</strong>, regardless of other factors:
                            </p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-medium">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    Temperature &lt; 55°F
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    Wind Speed &gt; 24 mph
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    Rain Probability &gt; 49%
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    Heavy Rain (&gt; 0.02"/hr)
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    Thunderstorm Detected
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Scoring Breakdown */}
                    <section>
                        <h3 className="text-lg font-semibold mb-4 text-primary">Scoring Breakdown (Max 100 Points)</h3>
                        <div className="space-y-6">
                            
                            {/* Temperature */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">1. Temperature</h4>
                                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">Max 30 pts</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Bees prefer warm weather.</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>≥ 75°F</span> <strong>30 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>70-74°F</span> <strong>28 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>65-69°F</span> <strong>25 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>60-64°F</span> <strong>20 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>57-59°F</span> <strong>12 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>55-56°F</span> <strong>5 pts</strong></div>
                                </div>
                            </div>

                            {/* Cloud Cover */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">2. Cloud Cover</h4>
                                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">Max 20 pts</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Sunny days are best for inspections.</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>0-20%</span> <strong>20 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>21-40%</span> <strong>17 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>41-60%</span> <strong>12 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>61-80%</span> <strong>6 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>&gt; 80%</span> <strong>2 pts</strong></div>
                                </div>
                            </div>

                            {/* Wind Speed */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">3. Wind Speed</h4>
                                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">Max 20 pts</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Low wind is crucial for calming bees.</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>0-5 mph</span> <strong>20 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>6-10 mph</span> <strong>18 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>11-15 mph</span> <strong>12 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>16-20 mph</span> <strong>6 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>21-24 mph</span> <strong>2 pts</strong></div>
                                </div>
                            </div>

                            {/* Precipitation */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">4. Precipitation Chance</h4>
                                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">Max 15 pts</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Rain is a major deterrent.</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>0%</span> <strong>15 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>1-10%</span> <strong>12 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>11-20%</span> <strong>8 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>21-35%</span> <strong>4 pts</strong></div>
                                    <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>36-49%</span> <strong>1 pts</strong></div>
                                </div>
                            </div>

                            {/* Humidity & Time Bonus */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">5. Humidity</h4>
                                        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">Max 5 pts</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Moderate humidity is preferred.</p>
                                    <div className="space-y-1 text-xs">
                                        <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>30-70%</span> <strong>5 pts</strong></div>
                                        <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>Other</span> <strong>2 pts</strong></div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">6. Time Bonus</h4>
                                        <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded">Max 10 pts</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Inspections best during peak daylight.</p>
                                    <div className="space-y-1 text-xs">
                                        <div className="p-2 bg-muted rounded border border-border/50 flex justify-between"><span>10AM - 4PM</span> <strong>10 pts</strong></div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </section>
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-border shrink-0 flex justify-end">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    )
}
