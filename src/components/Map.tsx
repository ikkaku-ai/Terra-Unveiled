import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import FogLayer from './FogLayer';
import Onboarding from './Onboarding';

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

// 現在地マーカー用のアイコン
const CurrentPosIcon = L.divIcon({
  className: 'current-pos-icon',
  html: `<div style="width: 15px; height: 15px; background: #007AFF; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,122,255,0.5);"></div>`,
  iconSize: [15, 15],
  iconAnchor: [7, 7]
});

const MapEvents = ({ onVisit }: { onVisit: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      onVisit(e.latlng);
    },
  });
  return null;
};

// 地図操作用ヘルパーコンポーネント
const MapController = ({ center }: { center: L.LatLng | null }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom(), { animate: true, duration: 1.5 });
    }
  }, [center, map]);
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

  const [currentPos, setCurrentPos] = useState<L.LatLng | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [jumpToPos, setJumpToPos] = useState<L.LatLng | null>(null);

  // データの保存
  useEffect(() => {
    const toSave = visitedPoints.map(p => ({ lat: p.lat, lng: p.lng }));
    localStorage.setItem('visitedPoints', JSON.stringify(toSave));
  }, [visitedPoints]);

  const addVisit = useCallback((latlng: L.LatLng) => {
    setVisitedPoints((prev) => {
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
          const pos = L.latLng(latitude, longitude);
          setCurrentPos(pos);
          addVisit(pos);
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
    } else {
      setCurrentPos(null);
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking, addVisit]);

  // 探索率の擬似計算（訪問ポイント数に基づくスコア）
  const discoveryScore = Math.min((visitedPoints.length / 500) * 100, 100).toFixed(1);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#1a1a1a' }}>
      <Onboarding />
      
      <MapContainer
        center={initialCenter}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false} // デフォルトのズームコントロールを非表示
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FogLayer visitedPoints={visitedPoints} radius={100} />
        <MapEvents onVisit={addVisit} />
        <MapController center={jumpToPos} />
        
        {currentPos && (
          <Marker position={currentPos} icon={CurrentPosIcon} />
        )}
      </MapContainer>
      
      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        zIndex: 1000,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        {/* Stats Card */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          padding: '15px 25px',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.4)',
          pointerEvents: 'auto'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a' }}>Terra-Unveiled</h2>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
            <div style={{ width: '100px', height: '6px', backgroundColor: '#eee', borderRadius: '3px', marginRight: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${discoveryScore}%`, height: '100%', backgroundColor: '#007AFF', transition: 'width 0.5s ease' }}></div>
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#666' }}>探索度: {discoveryScore}%</span>
          </div>
        </div>

        {/* Controls Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'auto' }}>
          <button 
            onClick={() => setIsTracking(!isTracking)}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '25px',
              backgroundColor: isTracking ? '#007AFF' : 'white',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
            title={isTracking ? 'GPS追跡を停止' : 'GPS追跡を開始'}
          >
            {isTracking ? '📡' : '🛰️'}
          </button>

          {isTracking && currentPos && (
            <button 
              onClick={() => setJumpToPos(currentPos)}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '25px',
                backgroundColor: 'white',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                fontSize: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              title="現在地にジャンプ"
            >
              🎯
            </button>
          )}

          <button 
            onClick={() => {
                if (window.confirm('これまでの探索データを消去しますか？')) {
                    setVisitedPoints([L.latLng(35.6812, 139.7671)]);
                    localStorage.removeItem('visitedPoints');
                }
            }}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '25px',
              backgroundColor: 'white',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            title="リセット"
          >
            🗑️
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255, 77, 79, 0.9)',
          color: 'white',
          padding: '8px 20px',
          borderRadius: '20px',
          fontSize: '12px',
          zIndex: 2000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          ⚠️ GPS Error: {error}
        </div>
      )}
    </div>
  );
};

export default Map;
