import { useState, useEffect } from 'react';

const WelcomeModal = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setIsVisible(true);
    }
  }, []);

  const closeIntro = () => {
    localStorage.setItem('hasVisited', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '40px',
        borderRadius: '24px',
        maxWidth: '450px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        margin: '20px',
        border: '1px solid rgba(255,255,255,0.3)'
      }}>
        <div style={{ fontSize: '50px', marginBottom: '10px' }}>🌍</div>
        <h1 style={{ margin: '0 0 10px 0', color: '#1a1a1a', letterSpacing: '-0.5px' }}>Terra-Unveiled</h1>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '25px' }}>Explore the Unknown</p>
        
        <p style={{ lineHeight: '1.7', color: '#444', marginBottom: '30px' }}>
          世界は深い霧に包まれています。<br />
          あなたの足跡が、この地図に光を灯す唯一の方法です。<br />
          準備はいいですか？
        </p>

        <div style={{ textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.05)', padding: '20px', borderRadius: '16px', marginBottom: '30px' }}>
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px' }}>📡</span>
            <span style={{ fontSize: '14px' }}><b>GPS追跡</b>: 移動して霧を晴らす</span>
          </div>
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px' }}>👆</span>
            <span style={{ fontSize: '14px' }}><b>タップ</b>: 地図を触って擬似探索</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '10px' }}>💾</span>
            <span style={{ fontSize: '14px' }}><b>オートセーブ</b>: 記録は自動保存されます</span>
          </div>
        </div>

        <div style={{ 
          fontSize: '11px', 
          color: '#ff4d4f', 
          backgroundColor: '#fff1f0', 
          padding: '10px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'left',
          border: '1px solid #ffa39e'
        }}>
          ⚠️ <b>安全上の注意:</b><br />
          ・歩きスマホは厳禁です。周囲の安全を確認してから操作してください。<br />
          ・私有地や立ち入り禁止区域には絶対に入らないでください。<br />
          ・データはブラウザ内にのみ保存され、外部に送信されることはありません。
        </div>

        <button 
          onClick={closeIntro}
          style={{
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            padding: '16px 40px',
            borderRadius: '30px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.2s',
            boxShadow: '0 4px 15px rgba(0,122,255,0.3)'
          }}
        >
          探索を開始する
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
