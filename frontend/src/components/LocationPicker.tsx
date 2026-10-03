import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Crosshair, MapPin, Search, X, Layers, Loader2, Navigation } from 'lucide-react';
import L, { type LatLngLiteral } from 'leaflet';
import 'leaflet/dist/leaflet.css';

type CoordinateValue = { lat: string | number; lng: string | number; address?: string };

interface LocationPickerProps {
  value: CoordinateValue;
  onChange: (location: { lat: string; lng: string; address?: string }) => void;
  label?: string;
}

const DEFAULT_CENTER: LatLngLiteral = { lat: 13.0827, lng: 80.2707 }; // Default: Chennai

// Map tile layers
const MAP_LAYERS = {
  voyager: {
    name: 'Street View',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery'
  },
  dark: {
    name: 'Dark View',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }
};

// Custom SVG Red Pulse Pin Icon for Leaflet
const createCustomPinIcon = () => {
  return L.divIcon({
    className: 'custom-location-pin-wrapper',
    html: `
      <div className="custom-location-pin">
        <div className="pin-head">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3" fill="#ffffff"/>
          </svg>
        </div>
        <div className="pin-pulse"></div>
      </div>
    `,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
  });
};

const customPinIcon = createCustomPinIcon();

const parseCoordinates = (value: CoordinateValue): LatLngLiteral | null => {
  const lat = Number(value.lat);
  const lng = Number(value.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    ? { lat, lng }
    : null;
};

// Auto-resizes Leaflet map when rendered inside modals/tabs
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 300);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map]);
  return null;
};

const RecenterMap = ({ position }: { position: LatLngLiteral }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, Math.max(map.getZoom(), 14));
  }, [map, position]);
  return null;
};

const MapClickHandler = ({ onSelect }: { onSelect: (position: LatLngLiteral) => void }) => {
  useMapEvents({
    click: (event) => onSelect(event.latlng),
  });
  return null;
};

const LocationPicker = ({ value, onChange, label = 'Select location on the map' }: LocationPickerProps) => {
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'voyager' | 'satellite' | 'dark'>('voyager');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const selectedPosition = useMemo(() => parseCoordinates(value), [value.lat, value.lng]);
  const mapCenter = selectedPosition || DEFAULT_CENTER;

  // Handle click outside search results dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle location search via Nominatim
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const data = await response.json();
        setSearchResults(data || []);
        setShowResults(true);
      } catch (err) {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const addressName = data?.display_name || '';
      onChange({
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        address: addressName,
      });
    } catch {
      onChange({
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
      });
    }
    setIsGeocoding(false);
  };

  const selectPosition = (position: LatLngLiteral, updateAddress = true) => {
    if (updateAddress) {
      reverseGeocode(position.lat, position.lng);
    } else {
      onChange({
        lat: position.lat.toFixed(6),
        lng: position.lng.toFixed(6),
      });
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const address = result.display_name;

    onChange({
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      address,
    });
    setSearchQuery(result.display_name);
    setShowResults(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        selectPosition(coords, true);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  return (
    <section className="location-picker" aria-label={label}>
      <div className="location-picker-header">
        <div>
          <div className="form-label" style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Navigation size={15} style={{ color: 'var(--accent-blue)' }} />
            <span>
              {label.replace(/\s*\*/g, '').trim()}
              {label.includes('*') && (
                <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}> *</span>
              )}
            </span>
          </div>
          <p className="location-picker-hint">
            Search location below, click the map, or drag the red marker to set precise coordinates.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={useCurrentLocation}
          disabled={locating || !navigator.geolocation}
          style={{ gap: 6, flexShrink: 0 }}
        >
          {locating ? <Loader2 size={14} className="spinner-icon" /> : <Crosshair size={14} />}
          {locating ? 'Locating...' : 'Use My Location'}
        </button>
      </div>

      {/* Interactive Search Bar */}
      <div className="location-search-box" ref={searchContainerRef}>
        <div className="location-search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="location-search-input"
            placeholder="Search address, landmark, city (e.g. Anna Nagar, Chennai)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowResults(false);
              }}
            >
              <X size={14} />
            </button>
          )}
          {isSearching && <Loader2 size={16} className="search-spinner-icon" />}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <ul className="location-search-results">
            {searchResults.map((result, idx) => (
              <li
                key={idx}
                className="location-search-item"
                onClick={() => handleSelectSearchResult(result)}
              >
                <MapPin size={15} className="item-icon" />
                <div className="item-text">
                  <span className="item-title">{result.display_name}</span>
                  <span className="item-coords">
                    Lat: {parseFloat(result.lat).toFixed(4)}, Lng: {parseFloat(result.lon).toFixed(4)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map Display Box */}
      <div className="location-picker-map">
        <MapContainer
          center={mapCenter}
          zoom={selectedPosition ? 15 : 11}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <MapResizer />
          <RecenterMap position={mapCenter} />
          <TileLayer
            url={MAP_LAYERS[activeLayer].url}
            attribution={MAP_LAYERS[activeLayer].attribution}
          />
          <MapClickHandler onSelect={(pos) => selectPosition(pos, true)} />
          {selectedPosition && (
            <Marker
              position={selectedPosition}
              icon={customPinIcon}
              draggable={true}
              eventHandlers={{
                dragend: (event) => selectPosition(event.target.getLatLng(), true),
              }}
            />
          )}
        </MapContainer>

        {/* Map Controls & Badges Overlay */}
        <div className="location-map-controls">
          <div className="map-layer-selector">
            <Layers size={13} />
            {(['voyager', 'satellite', 'dark'] as const).map((layerKey) => (
              <button
                key={layerKey}
                type="button"
                className={`layer-btn ${activeLayer === layerKey ? 'is-active' : ''}`}
                onClick={() => setActiveLayer(layerKey)}
              >
                {MAP_LAYERS[layerKey].name}
              </button>
            ))}
          </div>

          {selectedPosition ? (
            <div className="location-coords-badge">
              <MapPin size={12} style={{ color: '#ef4444' }} />
              <span>
                {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
              </span>
              {isGeocoding && <Loader2 size={12} className="spinner-icon" />}
            </div>
          ) : (
            <div className="location-picker-empty-hint">
              <MapPin size={14} /> Click map to place location pin
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LocationPicker;
