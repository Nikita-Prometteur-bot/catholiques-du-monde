import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X, Save, Clock, Type, Image, Music, Video } from 'lucide-react';
import type { Content } from '../types';

const Admin: React.FC = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Partial<Content> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Partial<Content>>({
    title: '',
    description: '',
    type: 'text',
    contentUrl: '',
    startTime: '06:00:00',
    endTime: '07:00:00',
    isDownloadable: true
  });

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/content');
      setContents(response.data);
    } catch (err) {
      console.error('Error fetching contents', err);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const response = await axios.post('http://localhost:5000/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.url;
    } catch (err) {
      console.error('Upload failed', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalContentUrl = formData.contentUrl;

      if (selectedFile) {
        const uploadedUrl = await handleFileUpload(selectedFile);
        if (uploadedUrl) {
          finalContentUrl = uploadedUrl;
        }
      }

      const submissionData = { ...formData, contentUrl: finalContentUrl };
      if (editingContent?.id) {
        await axios.put(`http://localhost:5000/api/admin/content/${editingContent.id}`, submissionData);
      } else {
        await axios.post('http://localhost:5000/api/admin/content', submissionData);
      }
      setIsModalOpen(false);
      setEditingContent(null);
      setSelectedFile(null);
      fetchContents();
    } catch (err) {
      console.error('Error saving content', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/content/${id}`);
        fetchContents();
      } catch (err) {
        console.error('Error deleting content', err);
      }
    }
  };

  const openEditModal = (content: Content) => {
    setEditingContent(content);
    setFormData(content);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingContent(null);
    setFormData({
      title: '',
      description: '',
      type: 'text',
      contentUrl: '',
      startTime: '06:00:00',
      endTime: '07:00:00',
      isDownloadable: true
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  return (
    <div className="admin-page">
      <div className="admin-container container">
        <header className="admin-header">
          <h1>CMS Dashboard</h1>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Schedule Content
          </button>
        </header>

        <div className="content-table-wrapper glass">
          <table className="content-table">
            <thead>
              <tr>
                <th>Time Slot</th>
                <th>Type</th>
                <th>Title</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contents.map((c) => (
                <tr key={c.id}>
                  <td className="time-cell">
                    <Clock size={14} /> {c.startTime.substring(0, 5)} - {c.endTime.substring(0, 5)}
                  </td>
                  <td>
                    <span className="type-icon">
                      {c.type === 'text' && <Type size={14} />}
                      {c.type === 'image' && <Image size={14} />}
                      {c.type === 'audio' && <Music size={14} />}
                      {c.type === 'video' && <Video size={14} />}
                      {c.type}
                    </span>
                  </td>
                  <td className="title-cell">{c.title}</td>
                  <td>
                    <span className="status-badge active">Scheduled</span>
                  </td>
                  <td className="actions-cell">
                    <button className="action-btn edit" onClick={() => openEditModal(c)}><Edit2 size={16} /></button>
                    <button className="action-btn delete" onClick={() => handleDelete(c.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h2>{editingContent ? 'Edit Schedule' : 'New Schedule'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="text">Text / Message</option>
                    <option value="image">Image URL</option>
                    <option value="audio">Audio URL</option>
                    <option value="video">Video URL</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Downloadable</label>
                  <select 
                    value={formData.isDownloadable ? 'yes' : 'no'} 
                    onChange={(e) => setFormData({...formData, isDownloadable: e.target.value === 'yes'})}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input 
                    type="time" 
                    step="1"
                    value={formData.startTime} 
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input 
                    type="time" 
                    step="1"
                    value={formData.endTime} 
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Media File (Optional - overrides URL)</label>
                <input 
                  type="file" 
                  accept="image/*,audio/*,video/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {uploading && <p className="upload-status">Uploading media...</p>}
              </div>
              <div className="form-group">
                <label>Content (Text or URL)</label>
                <textarea 
                  value={formData.contentUrl} 
                  onChange={(e) => setFormData({...formData, contentUrl: e.target.value})}
                  required={!selectedFile} 
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                <Save size={18} /> Save Schedule
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-page {
          min-height: 100vh;
          background: #fcfcfc;
          padding: 60px 0;
        }
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }
        .content-table-wrapper {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }
        .content-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }
        .content-table th {
          text-align: left;
          padding: 20px;
          background: #f8f9fa;
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .content-table td {
          padding: 20px;
          border-top: 1px solid #f0f0f0;
          font-size: 0.95rem;
        }
        .time-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--gold);
          font-weight: 500;
        }
        .type-icon {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: #f0f0f0;
          border-radius: 4px;
          font-size: 0.75rem;
          text-transform: capitalize;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .status-badge.active {
          background: #e8f5e9;
          color: #2e7d32;
        }
        .actions-cell {
          display: flex;
          gap: 10px;
        }
        .action-btn {
          padding: 8px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .action-btn.edit {
          background: #e3f2fd;
          color: #1976d2;
        }
        .action-btn.delete {
          background: #ffebee;
          color: #d32f2f;
        }
        .action-btn:hover {
          opacity: 0.8;
          transform: translateY(-2px);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          width: 100%;
          max-width: 500px;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }
        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
        }
        .admin-form .form-group {
          margin-bottom: 20px;
        }
        .admin-form label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .admin-form input, .admin-form select, .admin-form textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 10px;
          font-size: 1rem;
          font-family: inherit;
        }
        .admin-form textarea {
          height: 100px;
          resize: vertical;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .btn-block {
          width: 100%;
          justify-content: center;
          margin-top: 10px;
        }
        .upload-status {
          font-size: 0.8rem;
          color: var(--gold);
          margin-top: 5px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default Admin;
