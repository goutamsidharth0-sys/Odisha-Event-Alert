"use client"

import { Typewriter } from "@/components/ui/typewriter"

interface HeroTypewriterProps {
  cityName?: string
}

export default function HeroTypewriter({ cityName }: HeroTypewriterProps) {
  return (
    <span className="bg-gradient-to-r from-brand-accent to-brand-glow bg-clip-text text-transparent glow-text font-black">
      <Typewriter
        text={
          cityName
            ? [
                cityName,
                "Live Concerts",
                "Comedy Nights",
                "Cultural Fests",
                "Weekend Vibes",
                cityName,
              ]
            : [
                "Across Odisha",
                "Live Concerts",
                "Comedy Shows",
                "Cultural Fests",
                "College Events",
                "Food Festivals",
                "Startup Meets",
                "Weekend Plans",
              ]
        }
        speed={80}
        deleteSpeed={40}
        waitTime={1800}
        cursorChar="_"
        cursorClassName="ml-0.5 text-brand-accent"
        className=""
      />
    </span>
  )
}
