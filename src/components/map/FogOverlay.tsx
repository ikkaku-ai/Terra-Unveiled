import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface FogOverlayProps {
  visitedPoints: L.LatLng[];
  radius?: number; // 霧を晴らす半径（ピクセル）
}

const FogOverlay = ({ visitedPoints, radius = 50 }: FogOverlayProps) => {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    // 1. 全体を霧で覆う (半透明の黒)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 訪れたポイントの霧を晴らす
    ctx.globalCompositeOperation = 'destination-out';
    
    visitedPoints.forEach((point) => {
      const p = map.latLngToContainerPoint(point);
      
      // グラデーションを使って縁をぼかす
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 元に戻す
    ctx.globalCompositeOperation = 'source-over';
  }, [map, visitedPoints, radius]);

  useEffect(() => {
    // Canvas要素の作成と初期配置
    const container = map.getContainer();
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none'; // 地図の操作を邪魔しない
    canvas.style.zIndex = '400'; // 地図タイルとマーカーの間、またはマーカーの上
    container.appendChild(canvas);
    canvasRef.current = canvas;

    // 地図の動きに同期
    const onMove = () => draw();
    map.on('viewreset move', onMove);
    draw();

    return () => {
      map.off('viewreset move', onMove);
      container.removeChild(canvas);
    };
  }, [map, draw]);

  return null;
};

export default FogOverlay;
