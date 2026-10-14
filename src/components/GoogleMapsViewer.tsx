import React, { useState, useEffect } from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin, 
  InfoWindow 
} from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Layers, 
  Sparkles, 
  ExternalLink, 
  Key, 
  Compass, 
  Coffee, 
  Utensils, 
  Hotel, 
  TreePine, 
  Info, 
  X 
} from 'lucide-react';
import { playSound } from '../utils/sound';

interface LocationPoint {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  description: string;
  rating?: number;
  address?: string;
}

const DEFAULT_CENTER = { lat: 48.137154, lng: 11.576124 }; // Munich, Germany

const INITIAL_PLACES: LocationPoint[] = [
  {
    id: '1',
    name: 'Marienplatz & Neues Rathaus',
    category: 'Sehenswürdigkeit',
    lat: 48.1374,
    lng: 11.5755,
    description: 'Historischer Hauptplatz in der Münchner Innenstadt mit dem berühmten Glockenspiel.',
    rating: 4.8,
    address: 'Marienplatz 1, 80331 München'
  },
  {
    id: '2',
    name: 'Englischer Garten',
    category: 'Park & Natur',
    lat: 48.1528,
    lng: 11.5921,
    description: 'Einer der größten innerstädtischen Parkanlagen der Welt mit dem Eisbachwelle Surfspot.',
    rating: 4.9,
    address: '80538 München'
  },
  {
    id: '3',
    name: 'Deutsches Museum',
    category: 'Kultur & Museum',
    lat: 48.1301,
    lng: 11.5834,
    description: 'Das größte Naturwissenschafts- und Technikmuseum der Welt auf der Museumsinsel.',
    rating: 4.7,
    address: 'Museumsinsel 1, 80538 München'
  },
  {
    id: '4',
    name: 'Café Frischhut (Schmalznudel)',
    category: 'Gastronomie',
    lat: 48.1348,
    lng: 11.5746,
    description: 'Traditionelles Café bekannt für frische Schmalznudeln und bayerisches Gebäck.',
    rating: 4.6,
    address: 'Prälat-Zintl-Gasse 1, 80331 München'
  },
  {
    id: '5',
    name: 'Schloss Nymphenburg',
    category: 'Sehenswürdigkeit',
    lat: 48.1582,
    lng: 11.5036,
    description: 'Ehemalige Sommerresidenz der bayerischen Kurfürsten und Könige mit riesiger Parkanlage.',
    rating: 4.8,
    address: 'Schloß Nymphenburg 1, 80638 München'
  }
];

interface GoogleMapsViewerProps {
  apiKey?: string;
  enableSound?: boolean;
  onClose?: () => void;
  initialQuery?: string;
}

export const GoogleMapsViewer: React.FC<GoogleMapsViewerProps> = ({
  apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '',
  enableSound = true,
  onClose,
  initialQuery = ''
}) => {
  const [customKey, setCustomKey] = useState<string>(() => {
    return localStorage.getItem('saphire_gmaps_api_key') || apiKey || '';
  });
  const [showKeyInput, setShowKeyInput] = useState<boolean>(!customKey);
  const [inputKey, setInputKey] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedPlace, setSelectedPlace] = useState<LocationPoint | null>(null);
  const [places, setPlaces] = useState<LocationPoint[]>(INITIAL_PLACES);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(13);
  const [filterCategory, setFilterCategory] = useState<string>('Alle');

  const categories = ['Alle', 'Sehenswürdigkeit', 'Gastronomie', 'Park & Natur', 'Kultur & Museum'];

  const handleSaveKey = () => {
    if (inputKey.trim()) {
      const cleanKey = inputKey.trim();
      setCustomKey(cleanKey);
      localStorage.setItem('saphire_gmaps_api_key', cleanKey);
      setShowKeyInput(false);
      playSound('click', enableSound);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    playSound('click', enableSound);
    // Simple mock geocode search for demo
    const queryLower = searchQuery.toLowerCase();
    const matched = places.find(p => p.name.toLowerCase().includes(queryLower) || p.description.toLowerCase().includes(queryLower));

    if (matched) {
      setSelectedPlace(matched);
      setMapCenter({ lat: matched.lat, lng: matched.lng });
      setZoom(15);
    } else {
      // Add dynamic location query target
      const newPlace: LocationPoint = {
        id: `search-${Date.now()}`,
        name: searchQuery,
        category: 'Gesucht',
        lat: mapCenter.lat + (Math.random() - 0.5) * 0.02,
        lng: mapCenter.lng + (Math.random() - 0.5) * 0.02,
        description: `Suchergebnis für "${searchQuery}" in der Region`,
        rating: 4.5,
        address: `Ergebnis in der Nähe von München`
      };
      setPlaces(prev => [newPlace, ...prev]);
      setSelectedPlace(newPlace);
      setMapCenter({ lat: newPlace.lat, lng: newPlace.lng });
      setZoom(15);
    }
  };

  const filteredPlaces = places.filter(p => {
    const matchesCategory = filterCategory === 'Alle' || p.category === filterCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeApiKey = customKey || 'AIzaSyDemoKeyFallbackForMapsApiStudio';

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 text-white relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Top Header Bar */}
      <div className="px-5 py-3.5 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-lime-500/20 border border-lime-500/30 flex items-center justify-center text-lime-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-tight">Google Maps Explorer</h2>
              <span className="text-[10px] font-semibold text-lime-400 bg-lime-500/10 border border-lime-500/20 px-2 py-0.5 rounded-full">
                Interactive SDK
              </span>
            </div>
            <p className="text-xs text-neutral-400">Erkunde Orte, Routen und Sehenswürdigkeiten</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowKeyInput(!showKeyInput);
              playSound('click', enableSound);
            }}
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>{customKey ? 'API Key Konfiguriert' : 'Maps Key Eingeben'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Key Banner Modal / Overlay if needed */}
      {showKeyInput && (
        <div className="px-5 py-3 bg-amber-950/40 border-b border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-20 shrink-0">
          <div className="flex items-start gap-2 max-w-xl">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-amber-100">Google Maps API Schlüssel:</strong> Standardmäßig läuft die interaktive Ansicht im Prototypen-Modus. Du kannst deinen eigenen Google Maps API Key oder den kostenlosen Maps Demo Key nutzen.
              <a 
                href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio" 
                target="_blank" 
                rel="noreferrer"
                className="ml-1 text-lime-400 underline font-medium hover:text-lime-300"
              >
                Maps Demo Key holen &rarr;
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="API Key hier einfügen..."
              className="px-3 py-1.5 bg-black/60 border border-amber-500/40 text-xs text-white placeholder-amber-400/50 rounded-lg focus:outline-none focus:border-amber-400 flex-1 sm:w-56"
            />
            <button
              type="button"
              onClick={handleSaveKey}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* Search & Category Filter Toolbar */}
      <div className="px-5 py-3 bg-neutral-900/90 backdrop-blur-md border-b border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 z-10 shrink-0">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ort, Adresse oder Sehenswürdigkeit suchen..."
            className="w-full bg-[#18181b] text-xs text-white placeholder-neutral-500 rounded-full pl-10 pr-4 py-2.5 focus:outline-none border border-white/10 focus:border-lime-500/50 transition-all"
          />
        </form>

        <LayoutGroup id="google-maps-categories">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat, idx) => {
              const isActive = filterCategory === cat;
              return (
                <button
                  key={`map-cat-${cat || idx}-${idx}`}
                  type="button"
                  onClick={() => {
                    setFilterCategory(cat);
                    playSound('click', enableSound);
                  }}
                  className={`relative px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer z-10 ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mapsCategoryActivePill"
                      className="absolute inset-0 bg-lime-700 rounded-full shadow-md -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      {/* Main Map Canvas Section */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        <APIProvider apiKey={activeApiKey}>
          <Map
            defaultCenter={DEFAULT_CENTER}
            center={mapCenter}
            defaultZoom={13}
            zoom={zoom}
            onCameraChanged={(ev) => {
              setMapCenter(ev.detail.center);
              setZoom(ev.detail.zoom);
            }}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
            gestureHandling="greedy"
            disableDefaultUI={false}
          >
            {filteredPlaces.map((place, idx) => (
              <AdvancedMarker
                key={`map-marker-${place.id || idx}-${idx}`}
                position={{ lat: place.lat, lng: place.lng }}
                onClick={() => {
                  setSelectedPlace(place);
                  playSound('click', enableSound);
                }}
              >
                <Pin 
                  background={selectedPlace?.id === place.id ? '#7e22ce' : '#ef4444'}
                  borderColor="#ffffff"
                  glyphColor="#ffffff"
                />
              </AdvancedMarker>
            ))}

            {selectedPlace && (
              <InfoWindow
                position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                onCloseClick={() => setSelectedPlace(null)}
              >
                <div className="p-2 max-w-xs text-neutral-900">
                  <span className="inline-block text-[10px] font-bold text-lime-700 bg-lime-50 px-2 py-0.5 rounded-full mb-1">
                    {selectedPlace.category}
                  </span>
                  <h3 className="text-xs font-bold text-neutral-900">{selectedPlace.name}</h3>
                  <p className="text-[11px] text-neutral-600 mt-1 leading-snug">{selectedPlace.description}</p>
                  {selectedPlace.address && (
                    <p className="text-[10px] text-neutral-400 mt-1 italic">{selectedPlace.address}</p>
                  )}
                  {selectedPlace.rating && (
                    <div className="mt-1.5 text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                      ★ {selectedPlace.rating} / 5.0
                    </div>
                  )}
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Sidebar list overlay on bottom left / desktop side */}
        <div className="absolute bottom-4 left-4 z-10 max-w-xs w-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl hidden sm:block">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-lime-400" />
              Entdeckungen ({filteredPlaces.length})
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 no-scrollbar pr-1">
            {filteredPlaces.map((p, idx) => (
              <div
                key={`map-item-${p.id || idx}-${idx}`}
                onClick={() => {
                  setSelectedPlace(p);
                  setMapCenter({ lat: p.lat, lng: p.lng });
                  setZoom(15);
                  playSound('click', enableSound);
                }}
                className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${
                  selectedPlace?.id === p.id 
                    ? 'bg-lime-600/30 border border-lime-500/50 text-white' 
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-transparent'
                }`}
              >
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-[10px] text-neutral-400 truncate">{p.category} • {p.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
