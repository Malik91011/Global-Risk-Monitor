import { useMemo } from "react";
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from "react-simple-maps";
import { CountryStat, RiskLevel } from "@workspace/api-client-react";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Map risk levels to heat colors
function getRiskColor(stat?: CountryStat) {
  if (!stat) return "#1e293b"; // base border color
  if (stat.criticalCount > 0) return "#ef4444"; // red-500
  if (stat.highCount > 0) return "#f59e0b"; // amber-500
  if (stat.count > 10) return "#8b5cf6"; // violet-500
  return "#3b82f6"; // blue-500
}

export default function WorldMap({ data = [] }: { data?: CountryStat[] }) {
  const statsMap = useMemo(() => {
    const map = new Map<string, CountryStat>();
    data.forEach(stat => map.set(stat.country.toLowerCase(), stat));
    return map;
  }, [data]);

  return (
    <div className="w-full aspect-[2/1] relative flex items-center justify-center overflow-hidden rounded-xl bg-[#090e1a] border border-white/5">
      <ComposableMap 
        projection="geoMercator" 
        projectionConfig={{ scale: 120 }}
        className="w-full h-full opacity-80"
      >
        <Sphere stroke="#1e293b" strokeWidth={0.5} fill="transparent" id="sphere" />
        <Graticule stroke="#1e293b" strokeWidth={0.5} />
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryName = geo.properties.name.toLowerCase();
              const stat = statsMap.get(countryName);
              
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getRiskColor(stat)}
                  stroke="#0f172a"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none", transition: "all 250ms" },
                    hover: { fill: "#fcd34d", outline: "none", cursor: "pointer" },
                    pressed: { fill: "#f59e0b", outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur border border-white/10 rounded-lg p-3 text-xs flex flex-col gap-2">
        <div className="font-display font-bold text-foreground mb-1">Risk Heatmap</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> Critical Incidents</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /> High Risk</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500" /> Active Hotspot</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700" /> No Data</div>
      </div>
    </div>
  );
}
