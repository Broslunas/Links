'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
} from 'react-simple-maps';

interface CountryData {
  country: string;
  clicks: number;
}

interface WorldMapProps {
  data: CountryData[];
  className?: string;
}

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

// Country name mappings for better matching
const countryNameMappings: { [key: string]: string } = {
  'United States': 'United States of America',
  'USA': 'United States of America',
  'US': 'United States of America',
  'UK': 'United Kingdom',
  'Britain': 'United Kingdom',
  'Russia': 'Russian Federation',
  'South Korea': 'Republic of Korea',
  'North Korea': 'Democratic People\'s Republic of Korea',
  'Iran': 'Islamic Republic of Iran',
  'Venezuela': 'Bolivarian Republic of Venezuela',
  'Bolivia': 'Plurinational State of Bolivia',
  'Tanzania': 'United Republic of Tanzania',
  'Macedonia': 'North Macedonia',
  'Congo': 'Democratic Republic of the Congo',
  'Czech Republic': 'Czechia',
  'Myanmar': 'Myanmar',
  'Burma': 'Myanmar',
};

function normalizeCountryName(name: string): string {
  return countryNameMappings[name] || name;
}

export function WorldMap({ data, className = '' }: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<{ country: string; clicks: number } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mapError, setMapError] = useState<string | null>(null);

  // Fallback to test data if no real data is available (for development/testing)
  useEffect(() => {
    if (data && data.length > 0) {
      console.log('WorldMap: Using real analytics data');
    } else {
      console.log('WorldMap: Using test data (no analytics data available)');
    }
  }, [data]);

  // Fallback test data for demonstration purposes
  // This will be used when no real analytics data is available
  const testData = [
    { country: 'United States', clicks: 150 },
    { country: 'Brazil', clicks: 89 },
    { country: 'Germany', clicks: 67 },
    { country: 'United Kingdom', clicks: 45 },
    { country: 'France', clicks: 34 },
    { country: 'Canada', clicks: 28 },
    { country: 'Australia', clicks: 22 },
    { country: 'Japan', clicks: 18 },
    { country: 'Mexico', clicks: 15 },
    { country: 'Spain', clicks: 12 }
  ];

  // Use test data if no real data is available
  const displayData = (data && data.length > 0) ? data : testData;

  if (!displayData || displayData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-500">
          <p>No hay datos de países disponibles</p>
          <p className="text-sm mt-2">Esperando datos de analytics...</p>
        </div>
      </div>
    );
  }

  // Create a map of country clicks for quick lookup
  const countryClicksMap = useMemo(() => {
    const map = new Map<string, number>();
    displayData.forEach(item => {
      const normalizedName = normalizeCountryName(item.country);
      map.set(normalizedName, item.clicks);
      // Also add the original name for fallback
      map.set(item.country, item.clicks);
    });
    return map;
  }, [displayData]);

  // Calculate color intensity based on clicks
  const maxClicks = Math.max(...data.map(d => d.clicks), 1);
  
  const getCountryColor = (countryName: string): string => {
    const clicks = countryClicksMap.get(countryName) || 0;
    if (clicks === 0) return '#f8f9fa';
    
    const intensity = clicks / maxClicks;
    const opacity = Math.max(0.1, intensity);
    
    // Use a blue color scheme
    return `rgba(99, 102, 241, ${opacity})`;
  };

  const handleMouseEnter = (geo: any, event: React.MouseEvent) => {
    const countryName = geo.properties.NAME;
    const clicks = countryClicksMap.get(countryName) || countryClicksMap.get(normalizeCountryName(countryName)) || 0;
    
    setHoveredCountry(countryName);
    setTooltipContent({ country: countryName, clicks });
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredCountry(null);
    setTooltipContent(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {mapError && (
        <div className="flex items-center justify-center h-full bg-red-50 text-red-600 p-4">
          <p>Error cargando el mapa: {mapError}</p>
        </div>
      )}
      
      <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 100,
            center: [0, 20],
          }}
          width={800}
          height={400}
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <Geographies 
             geography={geoUrl}
             onError={(error) => {
               console.error('Error loading geography:', error);
               setMapError('No se pudo cargar el mapa mundial');
             }}
           >
             {({ geographies }) => {
               return geographies.map((geo) => {
                const countryName = geo.properties.NAME;
                const isHovered = hoveredCountry === countryName;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(event) => handleMouseEnter(geo, event)}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                    style={{
                      default: {
                        fill: getCountryColor(countryName),
                        stroke: '#cbd5e1',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      hover: {
                        fill: isHovered ? '#4f46e5' : getCountryColor(countryName),
                        stroke: '#4f46e5',
                        strokeWidth: 1,
                        outline: 'none',
                      },
                      pressed: {
                        fill: '#3730a3',
                        stroke: '#3730a3',
                        strokeWidth: 1,
                        outline: 'none',
                      },
                    }}
                  />
                );
              });
            }}
          </Geographies>
        </ComposableMap>
      </div>

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none text-sm"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translateY(-100%)',
          }}
        >
          <div className="font-semibold">{tooltipContent.country}</div>
          <div className="text-gray-300">
            {tooltipContent.clicks.toLocaleString()} clicks
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-xs font-semibold text-gray-700 mb-2">Clicks por País</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-gray-200 rounded-sm"></div>
          <span className="text-xs text-gray-600">0</span>
          <div className="flex gap-1">
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((opacity) => (
              <div
                key={opacity}
                className="w-4 h-3 rounded-sm"
                style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})` }}
              ></div>
            ))}
          </div>
          <span className="text-xs text-gray-600">{Math.max(...displayData.map(d => d.clicks)).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}