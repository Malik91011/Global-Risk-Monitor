import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  className?: string;
  format?: "rectangle" | "horizontal" | "vertical";
}

export default function AdSlot({ className, format = "rectangle" }: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // In a real implementation, we'd call (window.adsbygoogle = window.adsbygoogle || []).push({})
      // Leaving a try-catch so it doesn't crash during preview
    } catch (e) {
      console.error("Ad slot initialization error", e);
    }
  }, []);

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border border-white/5 bg-secondary/30 relative flex flex-col items-center justify-center text-muted-foreground/50 text-xs",
      format === "rectangle" && "w-full aspect-square",
      format === "horizontal" && "w-full h-24",
      format === "vertical" && "w-64 h-[600px] mx-auto",
      className
    )} ref={adRef}>
      <span className="uppercase tracking-widest text-[10px] mb-2 font-display opacity-40">Advertisement</span>
      <div className="w-12 h-12 border-2 border-dashed border-muted-foreground/20 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
        <div className="w-2 h-2 bg-muted-foreground/20 rounded-full" />
      </div>
      
      {/* Real ad code placeholder */}
      {/* 
      <ins className="adsbygoogle"
           style={{ display: "block" }}
           data-ad-client="pub-3806563466848436"
           data-ad-slot="1234567890"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
      */}
    </div>
  );
}
