import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Music, Video, Image as ImageIcon, FileText, Clock } from 'lucide-react';
import type { Content } from '../types';

const Home: React.FC = () => {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchCurrentContent();
    const contentTimer = setInterval(fetchCurrentContent, 60000); // Re-fetch every minute

    return () => {
      clearInterval(timer);
      clearInterval(contentTimer);
    };
  }, []);

  const fetchCurrentContent = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/content/current');
      setContent(response.data);
      setLoading(false);
      setError(null);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setContent(null);
      } else {
        setError('Connection issues. Please try again later.');
      }
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (!content) return (
      <div className="no-content">
        <Clock size={48} className="icon-muted" />
        <p>Seeking peace... Next message coming soon.</p>
      </div>
    );

    switch (content.type) {
      case 'image':
        return <img src={content.contentUrl} alt={content.title} className="content-media" />;
      case 'video':
        return <video src={content.contentUrl} controls className="content-media" />;
      case 'audio':
        return (
          <div className="audio-wrapper">
            <Music size={64} />
            <audio src={content.contentUrl} controls className="audio-player" />
          </div>
        );
      case 'text':
        return <div className="text-content">{content.contentUrl}</div>;
      default:
        return null;
    }
  };

  const handleShare = async () => {
    if (!content) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.description || `Check out this ${content.type} on Catholiques du Monde`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Sharing failed', err);
      }
    } else {
      alert('Sharing is not supported on this browser. You can copy the URL instead.');
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
    <div className="landing-page">
      <header className="header animate-fade-in">
        <h1 className="logo">Catholiques du Monde</h1>
        <div className="time-display">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="loader"
            >
              <div className="pulse"></div>
            </motion.div>
          ) : (
            <motion.div
              key={content?.id || 'empty'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="content-card glass"
            >
              <div className="content-header">
                <span className="content-type-badge">
                  {content?.type === 'image' && <ImageIcon size={16} />}
                  {content?.type === 'video' && <Video size={16} />}
                  {content?.type === 'audio' && <Music size={16} />}
                  {content?.type === 'text' && <FileText size={16} />}
                  {content?.type?.toUpperCase()}
                </span>
                <h2 className="content-title">{content?.title || 'Peace be with you'}</h2>
              </div>

              <div className="content-body">
                {renderContent()}
              </div>

              {content && (
                <div className="content-footer">
                  <p className="content-description">{content.description}</p>
                  <div className="action-buttons">
                    {content.isDownloadable && (
                      <button className="btn btn-primary" onClick={handleDownload}>
                        <Download size={18} /> Download
                      </button>
                    )}
                    <button className="btn" onClick={handleShare}>
                      <Share2 size={18} /> Share
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="footer animate-fade-in">
        <p>&copy; 2026 Catholiques du Monde. All rights reserved.</p>
      </footer>

      <style>{`
        .landing-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #ffffff 0%, #f0f2f5 100%);
        }
        .header {
          padding: 40px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .logo {
          font-size: 1.5rem;
          letter-spacing: 1px;
          color: var(--accent);
        }
        .time-display {
          font-family: 'Lora', serif;
          font-size: 1.2rem;
          color: var(--gold);
        }
        .main-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .content-card {
          width: 100%;
          max-width: 600px;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.05);
          text-align: center;
        }
        .content-header {
          margin-bottom: 30px;
        }
        .content-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 1px;
          color: var(--gold);
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        .content-title {
          font-size: 2rem;
          color: var(--text-main);
        }
        .content-body {
          margin-bottom: 30px;
          border-radius: 16px;
          overflow: hidden;
        }
        .content-media {
          width: 100%;
          border-radius: 12px;
          max-height: 400px;
          object-fit: cover;
        }
        .audio-wrapper {
          padding: 40px;
          background: var(--secondary);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          color: var(--gold);
        }
        .audio-player {
          width: 100%;
        }
        .text-content {
          font-family: 'Lora', serif;
          font-size: 1.3rem;
          line-height: 1.8;
          color: var(--text-main);
          font-style: italic;
        }
        .content-description {
          color: var(--text-muted);
          margin-bottom: 30px;
          font-size: 0.95rem;
        }
        .action-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
        }
        .no-content {
          padding: 60px 20px;
          color: var(--text-muted);
        }
        .icon-muted {
          margin-bottom: 20px;
          opacity: 0.3;
        }
        .loader {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .pulse {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--gold);
          animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.2; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
        .footer {
          padding: 40px 20px;
          text-align: center;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        @media (max-width: 600px) {
          .content-card {
            padding: 20px;
          }
          .content-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
