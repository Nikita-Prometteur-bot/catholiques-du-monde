import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Music, Video, Image as ImageIcon, FileText, Clock, Settings, Headphones } from 'lucide-react';
import type { Content } from '../types';
import { api } from '../config/api';
import logo from "../assets/Image.png.jpeg";


const Home: React.FC = () => {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchCurrentContent();
    const contentTimer = setInterval(fetchCurrentContent, 60000);

    return () => {
      clearInterval(timer);
      clearInterval(contentTimer);
    };
  }, []);

  const fetchCurrentContent = async () => {
    try {
      const response = await axios.get(api.endpoints.getCurrentContent());
      setContent(response.data);
      setLoading(false);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setContent(null);
      }
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const getDetectedType = () => {
    if (!content || !content.contentUrl) return 'text';
    const url = content.contentUrl.toLowerCase();
    if (url.match(/\.(jpeg|jpg|gif|png|webp)$/)) return 'image';
    if (url.match(/\.(mp4|webm|ogg)$/)) return 'video';
    if (url.match(/\.(mp3|wav|ogg|m4a)$/)) return 'audio';
    return content.type || 'text';
  };

  const renderMedia = () => {
    if (!content || !content.contentUrl) return null;
    const type = getDetectedType();
    
    if (type === 'image') {
      return (
        <div className="media-box-centered">
          <img src={content.contentUrl} alt={content.title} className="content-image" />
        </div>
      );
    }
    
    if (type === 'video') {
      return (
        <div className="media-box-centered">
          <video src={content.contentUrl} controls className="content-video" />
        </div>
      );
    }
    
    if (type === 'audio') {
      return (
        <div className="media-box-centered">
          <div className="audio-premium-container">
            <div className="audio-glow"></div>
            <div className="audio-content">
              <div className="audio-icon-wrapper">
                <Headphones size={40} className="floating-icon" />
              </div>
              <audio src={content.contentUrl} controls className="audio-player-premium" />
              <p className="audio-hint">Tuned for peace</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const handleShare = async () => {
    if (!content) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.description || `Check out this on Catholiques du Monde`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Sharing failed', err);
      }
    } else {
      alert('Sharing is not supported on this browser.');
    }
  };

  const handleDownload = () => {
    if (!content) return;
    const link = document.createElement('a');
    link.href = content.contentUrl;
    link.download = content.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="top-bar">
          <div className="brand-container">
            <img src={logo} alt="Catholiques du Monde" className="brand-logo" />
            <span className="brand-text">Catholiques du Monde</span>
          </div>
          <div className="top-right">
            <span className="current-clock">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <Link to="/login" className="settings-btn">
              <Settings size={16} />
            </Link>
          </div>
        </div>
      </header>

      <main className="content-area">
        <div className="greeting-section">
          <h1 className="greeting-text">{getGreeting()}</h1>
          <div className="time-badge">
             <span className="dot"></span>
             {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="loading-spinner"><div className="spinner-dot"></div></div>
          ) : (
            <motion.div
              key={content?.id || 'empty'}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="premium-card-wrapper"
            >
              <div className="premium-card">
                <div className="card-inner-body">
                  {content ? (
                    <div className="sticky-layout-container">
                      <div className="scrollable-content-area">
                        <div className="content-type-tag">
                          {getDetectedType() === 'image' && <ImageIcon size={14} />}
                          {getDetectedType() === 'video' && <Video size={14} />}
                          {getDetectedType() === 'audio' && <Music size={14} />}
                          {getDetectedType() === 'text' && <FileText size={14} />}
                          <span>{getDetectedType().toUpperCase()}</span>
                        </div>

                        <div className="message-header">
                          <h2 className="message-title">{content.title}</h2>
                        </div>
                        
                        {renderMedia()}

                        {content.longText && (
                          <div className="text-display">
                            <div className="text-body-long">
                              {content.longText.split('\n').map((paragraph, index) => {
                                if (paragraph.includes('read') || paragraph.includes('Updated') || paragraph.match(/^\d+ \w+/)) {
                                   return <p key={index} className="text-metadata">{paragraph}</p>
                                }
                                return <p key={index}>{paragraph}</p>
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="sticky-bottom-actions">
                          {content.description && <p className="message-summary">{content.description}</p>}
                          <div className="button-group">
                            {content.isDownloadable && content.contentUrl && (
                              <button className="btn download-btn" onClick={handleDownload}>
                                <Download size={16} /> Download
                              </button>
                            )}
                            <button className="btn share-btn" onClick={handleShare}>
                              <Share2 size={16} /> Share
                            </button>
                          </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-content">
                      <img src={logo} alt="Catholiques du Monde" className="no-content-logo" />
                      <h2 className="no-content-title">Peace be with you</h2>
                      <Clock size={40} className="icon-muted" />
                      <p className="no-content-text">Seeking peace... Next message coming soon.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="page-footer">
        <p className="footer-copyright">© 2026 Catholiques du Monde</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,700;1,400&display=swap');

        :root {
          --brand-gold: #d4af37;
          --brand-navy: #0a192f;
          --bg-warm: #fdfaf7;
          --card-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          --text-dark: #222222;
          --text-muted: #8c8c8c;
          --border-color: #f1ede8;
        }

        .app-container {
          min-height: 100vh;
          background-color: var(--bg-warm);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          font-family: 'Inter', sans-serif;
        }

        .main-header {
          width: 100%;
          padding: 20px 5%;
          background: white;
          border-bottom: 1px solid var(--border-color);
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1100px;
          margin: 0 auto;
        }

        .brand-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-logo {
          height: 57px;
          width: auto;
          object-fit: contain;
          border-radius: 8px;
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.15));
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .brand-logo:hover {
          transform: scale(1.03);
          filter: drop-shadow(0 5px 12px rgba(212, 175, 55, 0.4));
        }

        .brand-text {
          font-weight: 600;
          letter-spacing: 1.5px;
          font-size: 0.9rem;
          color: var(--brand-navy);
          text-transform: uppercase;
        }

        .content-area {
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 16px 20px;
        }

        .greeting-section { text-align: center; margin-bottom: 12px; }
        .greeting-text { font-family: 'Lora', serif; font-size: 1.5rem; color: var(--text-dark); margin-bottom: 4px; }
        .time-badge { display: inline-flex; align-items: center; background: white; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; color: var(--brand-gold); border: 1px solid var(--border-color); }

        .premium-card-wrapper {
          width: 100%;
          max-width: 540px;
        }

        /* Smart Adaptive Height */
        .premium-card {
          width: 100%;
          height: auto;
          max-height: 78vh;
          background: white;
          border-radius: 28px;
          box-shadow: var(--card-shadow);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(0,0,0,0.01);
          margin-top: 5px;
        }

        .card-inner-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sticky-layout-container {
          display: flex;
          flex-direction: column;
          max-height: inherit;
          overflow: hidden;
        }

        .scrollable-content-area {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0 16px;
          scrollbar-width: none;
        }
        .scrollable-content-area::-webkit-scrollbar { display: none; }

        .sticky-bottom-actions {
          flex-shrink: 0;
          padding: 16px 32px 28px;
          background: white;
          border-top: 1px solid #f9f9f9;
        }

        .content-type-tag { display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--brand-gold); font-size: 0.65rem; font-weight: 700; letter-spacing: 2px; margin: 12px 0 4px; text-transform: uppercase; }
        .message-title { font-family: 'Lora', serif; font-size: 1.6rem; color: var(--text-dark); margin-bottom: 12px; font-weight: 600; text-align: center; padding: 0 20px; }

        .media-box-centered { padding: 4px 20px 16px; }
        .content-image, .content-video { width: 100%; height: auto; display: block; border-radius: 16px; max-height: 350px; object-fit: contain; background: #fafafa; }

        /* Premium Audio UI */
        .audio-premium-container {
          position: relative;
          background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
          border-radius: 20px;
          padding: 40px 20px;
          overflow: hidden;
          border: 1px solid #eee;
          text-align: center;
        }

        .audio-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
          transform: translate(-50%, -50%);
          z-index: 1;
        }

        .audio-content { position: relative; z-index: 2; }
        .audio-icon-wrapper { margin-bottom: 24px; color: var(--brand-gold); }
        .floating-icon { filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
        .audio-player-premium { width: 100%; margin-bottom: 12px; filter: grayscale(0.2); }
        .audio-hint { font-size: 0.75rem; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; }

        .text-body-long { font-family: 'Lora', serif; font-size: 0.95rem; line-height: 1.75; color: #222; white-space: pre-wrap; padding: 10px 32px 0; font-style: italic; overflow-wrap: break-word; }
        .text-metadata { color: var(--text-muted); font-size: 0.82rem; margin-bottom: 12px; font-family: 'Inter', sans-serif; font-style: normal; }
        .message-summary { color: var(--text-muted); font-size: 0.8rem; margin-bottom: 20px; text-align: center; }

        .button-group { display: flex; gap: 16px; width: 100%; justify-content: center; }
        .btn { flex: 1; max-width: 165px; height: 48px; border-radius: 50px; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s ease; cursor: pointer; }
        .download-btn { background: var(--brand-navy); color: white; border: none; }
        .share-btn { background: white; color: var(--brand-navy); border: 1.5px solid #b0b0b0; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

        .page-footer { width: 100%; padding: 16px; text-align: center; font-size: 0.7rem; color: var(--text-muted); }
        .loading-spinner { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 200px; }
        .spinner-dot { width: 12px; height: 12px; background: var(--brand-gold); border-radius: 50%; animation: pulse 1.5s infinite ease-in-out; }
        @keyframes pulse { 0%, 100% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } }

        .no-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .no-content-logo {
          width: 80px;
          height: auto;
          margin-bottom: 24px;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
        }

        .no-content-title {
          font-family: 'Lora', serif;
          font-size: 1.8rem;
          color: var(--brand-navy);
          margin-bottom: 16px;
          font-weight: 600;
        }

        .no-content-text {
          font-size: 0.95rem;
          color: var(--text-muted);
          margin-top: 16px;
          line-height: 1.6;
        }

        .icon-muted {
          color: var(--brand-gold);
          margin-bottom: 8px;
        }

        @media (max-width: 600px) {
          .premium-card { max-height: 85vh; border-radius: 20px; }
          .message-title { font-size: 1.4rem; }
          .text-body-long { padding: 10px 24px 0; }
        }
      `}</style>
    </div>
  );
};

export default Home;
