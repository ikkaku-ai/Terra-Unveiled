import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import FogLayer from './FogLayer';

// Leafletのデフォルトアイコン設定 (React環境でのバグ対策)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapEvents = ({ onVisit }: { onVisit: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      onVisit(e.latlng);
    },
  });
  return null;
};

const Map = () => {
  const initialCenter: L.LatLngExpression = [35.6812, 139.7671]; // 東京駅
  
  // 初期データの読み込み
  const [visitedPoints, setVisitedPoints] = useState<L.LatLng[]>(() => {
    const saved = localStorage.getItem('visitedPoints');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { lat: number; lng: number }[];
        return parsed.map(p => L.latLng(p.lat, p.lng));
      } catch (e) {
        console.error('Failed to parse saved points', e);
      }
    }
    return [L.latLng(35.6812, 139.7671)];
  });

  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // データの保存
  useEffect(() => {
    const toSave = visitedPoints.map(p => ({ lat: p.lat, lng: p.lng }));
    localStorage.setItem('visitedPoints', JSON.stringify(toSave));
  }, [visitedPoints]);

  const addVisit = useCallback((latlng: L.LatLng) => {
    setVisitedPoints((prev) => {
      // 直前のポイントと近すぎる（例: 5m以内）場合は追加しない
      const lastPoint = prev[prev.length - 1];
      if (lastPoint && latlng.distanceTo(lastPoint) < 5) {
        return prev;
      }
      return [...prev, latlng];
    });
  }, []);

  // GPS追跡
  useEffect(() => {
    let watchId: number | null = null;

    if (isTracking && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          addVisit(L.latLng(latitude, longitude));
        },
        (err) => {
          setError(err.message);
          setIsTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking, addVisit]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <MapContainer
        center={initialCenter}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FogLayer visitedPoints={visitedPoints} radius={100} />
        <MapEvents onVisit={addVisit} />
      </MapContainer>
      
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50px',
        zIndex: 1000,
        background: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '300px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Terra-Unveiled</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>地図をクリックするか、歩いて霧を晴らしてください</p>
        
        <div style={{ margin: '15px 0' }}>
          <button 
            onClick={() => setIsTracking(!isTracking)}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: isTracking ? '#ff4d4f' : '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isTracking ? 'GPS追跡停止' : 'GPS追跡開始'}
          </button>
        </div>

        {error && <p style={{ color: 'red', fontSize: '12px' }}>Error: {error}</p>}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px' }}>訪れた数: {visitedPoints.length}</span>
          <button 
            onClick={() => setVisitedPoints([L.latLng(35.6812, 139.7671)])}
            style={{ padding: '4px 8px', fontSize: '12px' }}
          >
            リセット
          </button>
        </div>
      </div>
    </div>
  );
};

export default Map;
