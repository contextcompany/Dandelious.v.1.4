import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Moon, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudFog, 
  Wind, 
  Droplets, 
  Eye, 
  Gauge, 
  Sunrise, 
  Sunset, 
  Compass, 
  Search, 
  MapPin, 
  Navigation, 
  RefreshCw, 
  X, 
  ChevronRight, 
  ArrowUp, 
  ArrowDown, 
  Thermometer, 
  Sparkles,
  Umbrella,
  Clock,
  Calendar
} from 'lucide-react';
import { EngineSettings } from '../types';
import { playSound } from '../utils/sound';

interface WeatherData {
  city: string;
  country: string;
  lat: number;
  lon: number;
  current: {
    temp: number;
    apparentTemp: number;
    humidity: number;
    isDay: boolean;
    weatherCode: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    precipitation: number;
  };
  hourly: Array<{
    time: string;
    hourLabel: string;
    temp: number;
    weatherCode: number;
    precipProb: number;
    isDay: boolean;
  }>;
  daily: Array<{
    dateStr: string;
    dayLabel: string;
    weatherCode: number;
    tempMax: number;
    tempMin: number;
    uvIndex: number;
    sunrise: string;
    sunset: string;
    precipSum: number;
  }>;
}

const DEFAULT_CITIES = [
  { name: 'Berlin', country: 'Deutschland', lat: 52.52, lon: 13.405 },
  { name: 'München', country: 'Deutschland', lat: 48.137, lon: 11.576 },
  { name: 'Hamburg', country: 'Deutschland', lat: 53.551, lon: 9.993 },
  { name: 'Wien', country: 'Österreich', lat: 48.208, lon: 16.373 },
  { name: 'Zürich', country: 'Schweiz', lat: 47.376, lon: 8.541 },
  { name: 'New York', country: 'USA', lat: 40.712, lon: -74.006 },
  { name: 'Tokyo', country: 'Japan', lat: 35.676, lon: 139.65 },
  { name: 'Mallorca', country: 'Spanien', lat: 39.569, lon: 2.65 }
];

export const getWeatherCondition = (code: number, isDay: boolean = true): { label: string; icon: React.ReactNode; bgGradient: string } => {
  // WMO Weather interpretation codes (http://open-meteo.com)
  switch (code) {
    case 0:
      return {
        label: isDay ? 'Klar / Sonnig' : 'Klar',
        icon: isDay ? <Sun className="w-8 h-8 text-amber-300" /> : <Moon className="w-8 h-8 text-amber-100" />,
        bgGradient: isDay 
          ? 'from-blue-600 via-sky-800 to-slate-950' 
          : 'from-slate-900 via-indigo-950 to-black'
      };
    case 1:
    case 2:
      return {
        label: isDay ? 'Heiter bis wolkig' : 'Leicht bewölkt',
        icon: isDay ? <Cloud className="w-8 h-8 text-amber-200" /> : <Cloud className="w-8 h-8 text-slate-300" />,
        bgGradient: isDay 
          ? 'from-sky-700 via-slate-800 to-slate-950' 
          : 'from-slate-900 via-slate-950 to-black'
      };
    case 3:
      return {
        label: 'Bedeckt',
        icon: <Cloud className="w-8 h-8 text-slate-400" />,
        bgGradient: 'from-slate-700 via-slate-900 to-black'
      };
    case 45:
    case 48:
      return {
        label: 'Nebel',
        icon: <CloudFog className="w-8 h-8 text-slate-300" />,
        bgGradient: 'from-slate-800 via-zinc-900 to-black'
      };
    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
      return {
        label: code >= 65 ? 'Starker Regen' : 'Regen',
        icon: <CloudRain className="w-8 h-8 text-cyan-300 animate-pulse" />,
        bgGradient: 'from-slate-800 via-cyan-950 to-black'
      };
    case 71:
    case 73:
    case 75:
    case 85:
    case 86:
      return {
        label: 'Schneefall',
        icon: <CloudSnow className="w-8 h-8 text-blue-200" />,
        bgGradient: 'from-slate-700 via-blue-950 to-black'
      };
    case 95:
    case 96:
    case 99:
      return {
        label: 'Gewitter',
        icon: <CloudLightning className="w-8 h-8 text-yellow-300" />,
        bgGradient: 'from-purple-950 via-slate-900 to-black'
      };
    default:
      return {
        label: 'Heiter',
        icon: <Sun className="w-8 h-8 text-amber-300" />,
        bgGradient: 'from-sky-800 via-slate-900 to-black'
      };
  }
};

const getUVDescription = (uv: number): string => {
  if (uv <= 2) return 'Niedrig (kein Schutz nötig)';
  if (uv <= 5) return 'Mäßig (Sonnenschutz empfohlen)';
  if (uv <= 7) return 'Hoch (Sonnenschutz erforderlich)';
  if (uv <= 10) return 'Sehr hoch (Schatten suchen)';
  return 'Extrem';
};

interface WeatherStudioProps {
  settings?: EngineSettings;
}

export const WeatherStudio: React.FC<WeatherStudioProps> = ({ settings }) => {
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; country: string; lat: number; lon: number }>(DEFAULT_CITIES[0]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; country: string; admin1?: string; latitude: number; longitude: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch Weather Data from Open-Meteo
  const fetchWeather = async (lat: number, lon: number, cityName: string, countryName: string) => {
    setIsLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,precipitation_probability,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather API error');
      const data = await res.json();

      const current = {
        temp: Math.round(data.current.temperature_2m),
        apparentTemp: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        isDay: Boolean(data.current.is_day),
        weatherCode: data.current.weather_code,
        windSpeed: Math.round(data.current.wind_speed_10m),
        windDirection: data.current.wind_direction_10m,
        pressure: Math.round(data.current.surface_pressure),
        precipitation: data.current.precipitation || 0
      };

      // Hourly (Next 24 Hours)
      const currentHourIndex = new Date().getHours();
      const hourly = (data.hourly.time || []).slice(currentHourIndex, currentHourIndex + 24).map((t: string, idx: number) => {
        const actualIdx = currentHourIndex + idx;
        const dateObj = new Date(t);
        const hourLabel = idx === 0 ? 'Jetzt' : `${dateObj.getHours()}:00`;
        return {
          time: t,
          hourLabel,
          temp: Math.round(data.hourly.temperature_2m[actualIdx] ?? current.temp),
          weatherCode: data.hourly.weather_code[actualIdx] ?? 0,
          precipProb: data.hourly.precipitation_probability[actualIdx] ?? 0,
          isDay: Boolean(data.hourly.is_day[actualIdx] ?? 1)
        };
      });

      // Daily (7 Days)
      const daily = (data.daily.time || []).map((t: string, idx: number) => {
        const dObj = new Date(t);
        const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        const dayLabel = idx === 0 ? 'Heute' : dayNames[dObj.getDay()];
        const sunriseTime = data.daily.sunrise[idx] ? new Date(data.daily.sunrise[idx]).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '06:30';
        const sunsetTime = data.daily.sunset[idx] ? new Date(data.daily.sunset[idx]).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '20:15';

        return {
          dateStr: t,
          dayLabel,
          weatherCode: data.daily.weather_code[idx] ?? 0,
          tempMax: Math.round(data.daily.temperature_2m_max[idx] ?? current.temp),
          tempMin: Math.round(data.daily.temperature_2m_min[idx] ?? current.temp - 5),
          uvIndex: Math.round(data.daily.uv_index_max[idx] ?? 3),
          sunrise: sunriseTime,
          sunset: sunsetTime,
          precipSum: data.daily.precipitation_sum[idx] ?? 0
        };
      });

      setWeatherData({
        city: cityName,
        country: countryName,
        lat,
        lon,
        current,
        hourly,
        daily
      });
    } catch (err) {
      console.error('Failed to load weather:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedLocation.lat, selectedLocation.lon, selectedLocation.name, selectedLocation.country);
  }, [selectedLocation]);

  // Geocoding Search via Open-Meteo
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=de&format=json`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (e) {
        console.error('Geocoding search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // GPS Geolocation
  const handleUseCurrentLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            // Reverse Geocoding or fallback label
            setSelectedLocation({
              name: 'Mein Standort',
              country: 'GPS',
              lat: latitude,
              lon: longitude
            });
          } catch (e) {}
        },
        () => {
          alert('Standortzugriff wurde abgelehnt oder ist nicht verfügbar.');
        }
      );
    }
  };

  const condition = weatherData ? getWeatherCondition(weatherData.current.weatherCode, weatherData.current.isDay) : { label: 'Laden...', icon: <Sun />, bgGradient: 'from-slate-900 to-black' };

  return (
    <div className={`relative flex flex-col w-full h-[100dvh] bg-gradient-to-b ${condition.bgGradient} text-white select-none overflow-hidden font-['Plus_Jakarta_Sans'] transition-colors duration-1000`}>
      
      {/* Background Animated Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/5 rounded-full blur-[120px]" />
      </div>

      {/* Header & City Search */}
      <header className="sticky top-0 z-30 bg-black/20 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between w-full max-w-full shrink-0 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-wide">Dandelious Wetter</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs sm:max-w-md mx-3">
          <div className="relative flex items-center bg-black/40 rounded-full border border-white/15 shadow-inner px-3.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Stadt suchen (z.B. Zürich, München, Rom)..."
              className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-neutral-400 focus:outline-none min-w-0"
            />
            {isSearching && <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />}
            {searchQuery && !isSearching && (
              <button type="button" onClick={() => setSearchQuery('')} className="p-0.5 text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {searchResults.length > 0 && searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                className="absolute top-11 left-0 right-0 z-50 bg-[#16161a] border border-white/15 rounded-2xl p-1.5 shadow-2xl overflow-hidden"
              >
                {searchResults.map((res, idx) => (
                  <button
                    key={`${res.name}-${res.latitude}-${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedLocation({
                        name: res.name,
                        country: res.country || '',
                        lat: res.latitude,
                        lon: res.longitude
                      });
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 text-left transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-white">{res.name}</span>
                      <span className="text-[11px] text-neutral-400 ml-2">
                        {res.admin1 ? `${res.admin1}, ` : ''}{res.country}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GPS Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
          title="Meinen aktuellen GPS-Standort abrufen"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </header>

      {/* Main Weather Container */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-12 flex-1 flex flex-col items-center overflow-y-auto no-scrollbar space-y-5">
        
        {/* Quick Cities Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full py-1">
          {DEFAULT_CITIES.map((c) => {
            const isSelected = selectedLocation.name === c.name;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedLocation(c)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'bg-black/30 hover:bg-black/50 text-white/80 border border-white/10'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Hero Current Weather Card */}
        {weatherData && (
          <div className="w-full text-center py-4 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-sm font-medium text-white/80 drop-shadow-sm mb-1">
              <MapPin className="w-4 h-4 text-cyan-300" />
              <span>{weatherData.city}</span>
              {weatherData.country && <span className="text-xs text-white/60">({weatherData.country})</span>}
            </div>

            <div className="flex items-center justify-center gap-3">
              <span className="text-7xl sm:text-8xl font-light tracking-tighter text-white font-mono drop-shadow-lg">
                {weatherData.current.temp}°
              </span>
            </div>

            <div className="text-base sm:text-lg font-semibold text-white/90 drop-shadow-sm flex items-center gap-2 mt-1">
              <span>{condition.label}</span>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-white/75 mt-1 font-mono">
              <span className="flex items-center gap-0.5"><ArrowUp className="w-3 h-3 text-amber-300" /> H: {weatherData.daily[0]?.tempMax}°</span>
              <span className="flex items-center gap-0.5"><ArrowDown className="w-3 h-3 text-cyan-300" /> T: {weatherData.daily[0]?.tempMin}°</span>
              <span>• Gefühlt {weatherData.current.apparentTemp}°</span>
            </div>
          </div>
        )}

        {/* 24-Stunden Stündliche Vorhersage */}
        {weatherData && (
          <div className="w-full bg-black/40 backdrop-blur-xl border border-white/15 rounded-[32px] p-4 sm:p-5 shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60 border-b border-white/10 pb-3 mb-3">
              <Clock className="w-3.5 h-3.5" />
              <span>Stündliche Vorhersage</span>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-1">
              {weatherData.hourly.map((h, i) => {
                const hCond = getWeatherCondition(h.weatherCode, h.isDay);
                return (
                  <div key={h.time + i} className="flex flex-col items-center justify-between min-w-[54px] py-1 text-center shrink-0">
                    <span className="text-xs font-medium text-white/70 font-mono mb-2">{h.hourLabel}</span>
                    <div className="my-1 scale-90">
                      {hCond.icon}
                    </div>
                    {h.precipProb > 10 ? (
                      <span className="text-[10px] font-bold text-cyan-400 font-mono my-0.5">
                        {h.precipProb}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-transparent my-0.5">-</span>
                    )}
                    <span className="text-sm font-bold text-white font-mono mt-1">{h.temp}°</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7-Tage Vorhersage */}
        {weatherData && (
          <div className="w-full bg-black/40 backdrop-blur-xl border border-white/15 rounded-[32px] p-4 sm:p-5 shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60 border-b border-white/10 pb-3 mb-3">
              <Calendar className="w-3.5 h-3.5" />
              <span>7-Tage-Vorhersage</span>
            </div>

            <div className="space-y-3">
              {weatherData.daily.map((d, idx) => {
                const dCond = getWeatherCondition(d.weatherCode, true);
                return (
                  <div key={d.dateStr} className="flex items-center justify-between gap-3 text-xs sm:text-sm py-1 border-b border-white/5 last:border-0">
                    <span className="w-16 font-bold text-white">{d.dayLabel}</span>
                    <div className="flex items-center gap-2 w-24">
                      <div className="scale-75 origin-left">{dCond.icon}</div>
                      {d.precipSum > 0 && (
                        <span className="text-[10px] text-cyan-300 font-mono">{d.precipSum.toFixed(1)} mm</span>
                      )}
                    </div>
                    
                    {/* Temperature Bar */}
                    <div className="flex-1 flex items-center justify-end gap-3 font-mono">
                      <span className="text-white/60 text-xs w-8 text-right">{d.tempMin}°</span>
                      <div className="w-24 sm:w-36 h-1.5 bg-white/15 rounded-full overflow-hidden relative">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full"
                          style={{
                            marginLeft: '15%',
                            width: '70%'
                          }}
                        />
                      </div>
                      <span className="text-white font-bold text-xs w-8">{d.tempMax}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detaillierte Wetter-Kacheln */}
        {weatherData && (
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* UV Index */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/15 rounded-3xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-white/60 font-medium uppercase">
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span>UV-Index</span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold font-mono text-white">{weatherData.daily[0]?.uvIndex || 3}</span>
                <p className="text-[11px] text-neutral-300 mt-1">{getUVDescription(weatherData.daily[0]?.uvIndex || 3)}</p>
              </div>
            </div>

            {/* Wind */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/15 rounded-3xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-white/60 font-medium uppercase">
                <Wind className="w-3.5 h-3.5 text-cyan-300" />
                <span>Wind</span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold font-mono text-white">{weatherData.current.windSpeed} <span className="text-xs font-normal text-white/60">km/h</span></span>
                <p className="text-[11px] text-neutral-300 mt-1">Richtung: {weatherData.current.windDirection}°</p>
              </div>
            </div>

            {/* Luftfeuchtigkeit */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/15 rounded-3xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-white/60 font-medium uppercase">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span>Feuchtigkeit</span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold font-mono text-white">{weatherData.current.humidity}%</span>
                <p className="text-[11px] text-neutral-300 mt-1">Taupunkt: ca. {weatherData.current.temp - 4}°</p>
              </div>
            </div>

            {/* Luftdruck */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/15 rounded-3xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs text-white/60 font-medium uppercase">
                <Gauge className="w-3.5 h-3.5 text-emerald-300" />
                <span>Luftdruck</span>
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold font-mono text-white">{weatherData.current.pressure} <span className="text-xs font-normal text-white/60">hPa</span></span>
                <p className="text-[11px] text-neutral-300 mt-1">Stabil</p>
              </div>
            </div>

            {/* Sonnenaufgang & Untergang */}
            <div className="col-span-2 bg-black/40 backdrop-blur-xl border border-white/15 rounded-3xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <Sunrise className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-white/60 font-medium uppercase block">Sonnenaufgang</span>
                  <span className="text-base font-bold font-mono text-white">{weatherData.daily[0]?.sunrise}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
                  <Sunset className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-white/60 font-medium uppercase block">Sonnenuntergang</span>
                  <span className="text-base font-bold font-mono text-white">{weatherData.daily[0]?.sunset}</span>
                </div>
              </div>
            </div>

            {/* Niederschlag */}
            <div className="col-span-2 bg-black/40 backdrop-blur-xl border border-white/15 rounded-3xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                  <Umbrella className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-white/60 font-medium uppercase block">Niederschlag heute</span>
                  <span className="text-base font-bold font-mono text-white">{weatherData.daily[0]?.precipSum?.toFixed(1) || '0.0'} mm</span>
                </div>
              </div>
              <span className="text-xs text-cyan-300 font-mono">Kein starker Regen erwartet</span>
            </div>

          </div>
        )}

      </main>

    </div>
  );
};
