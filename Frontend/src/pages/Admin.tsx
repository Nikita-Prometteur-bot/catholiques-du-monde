import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit2, Trash2, X, Save, Clock, Type, Image, Music, Video, LogOut, Upload } from 'lucide-react';
import type { Content } from '../types';
import { api } from '../config/api';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Partial<Content> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<Partial<Content>>({
    title: '',
    description: '',
    type: 'text',
    contentUrl: '',
    longText: '',
    startTime: '06:00:00',
    endTime: '07:00:00',
    isDownloadable: true
  });

  const [startHour, setStartHour] = useState('06');
  const [startMinute, setStartMinute] = useState('00');
  const [startAmPm, setStartAmPm] = useState<'AM' | 'PM'>('AM');
  const [endHour, setEndHour] = useState('07');
  const [endMinute, setEndMinute] = useState('00');
  const [endAmPm, setEndAmPm] = useState<'AM' | 'PM'>('AM');

  const convertTo24Hour = (hour: string, minute: string, amPm: 'AM' | 'PM') => {
    let h = parseInt(hour, 10);
    if (amPm === 'PM' && h !== 12) h += 12;
    if (amPm === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${minute}:00`;
  };

  const parseTimeToAmPm = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const amPm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return {
      hour: h.toString().padStart(2, '0'),
      minute: minutes,
      amPm
    };
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(api.endpoints.admin.getAllContent());
      setContents(response.data);
    } catch (err) {
      console.error('Error fetching contents', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const response = await axios.post(api.endpoints.admin.uploadFile(), formData, {
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

  const checkTimeOverlap = (startTime: string, endTime: string, excludeId?: number) => {
    const newStart = new Date(`2000-01-01T${startTime}`);
    const newEnd = new Date(`2000-01-01T${endTime}`);

    return contents.some(content => {
      if (excludeId && content.id === excludeId) return false;
      
      const existingStart = new Date(`2000-01-01T${content.startTime}`);
      const existingEnd = new Date(`2000-01-01T${content.endTime}`);

      return (
        (newStart < existingEnd && newEnd > existingStart) ||
        (newStart < existingStart && newEnd > existingStart) ||
        (newStart >= existingStart && newEnd <= existingEnd)
      );
    });
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const autoDetectType = (url: string, file: File | null) => {
    if (file) {
      if (file.type.startsWith('image/')) return 'image';
      if (file.type.startsWith('video/')) return 'video';
      if (file.type.startsWith('audio/')) return 'audio';
    }
    if (url) {
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.match(/\.(jpeg|jpg|gif|png|webp)$/)) return 'image';
      if (lowerUrl.match(/\.(mp4|webm|ogg)$/)) return 'video';
      if (lowerUrl.match(/\.(mp3|wav|ogg)$/)) return 'audio';
    }
    return 'text';
  };

  const detectedType = autoDetectType(formData.contentUrl || '', selectedFile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    // Convert AM/PM to 24-hour format
    const startTime24 = convertTo24Hour(startHour, startMinute, startAmPm);
    const endTime24 = convertTo24Hour(endHour, endMinute, endAmPm);

    // Validate time slot
    if (startTime24 && endTime24) {
      if (startTime24 >= endTime24) {
        setFormError('End time must be after start time');
        setSaving(false);
        return;
      }

      if (checkTimeOverlap(startTime24, endTime24, editingContent?.id)) {
        setFormError('This time slot overlaps with an existing schedule');
        setSaving(false);
        return;
      }
    }

    try {
      let finalContentUrl = formData.contentUrl;

      if (selectedFile) {
        const uploadedUrl = await handleFileUpload(selectedFile);
        if (uploadedUrl) {
          finalContentUrl = uploadedUrl;
        }
      }

      // Automatically use the detected type
      const submissionData = { 
        ...formData, 
        type: detectedType, 
        contentUrl: finalContentUrl, 
        startTime: startTime24, 
        endTime: endTime24 
      };

      if (editingContent?.id) {
        await axios.put(api.endpoints.admin.updateContent(editingContent.id), submissionData);
        showSuccess('Schedule updated successfully!');
      } else {
        await axios.post(api.endpoints.admin.createContent(), submissionData);
        showSuccess('Schedule created successfully!');
      }
      setIsModalOpen(false);
      setEditingContent(null);
      setSelectedFile(null);
      setFormError('');
      fetchContents();
    } catch (err) {
      console.error('Error saving content', err);
      setFormError('Failed to save content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await axios.delete(api.endpoints.admin.deleteContent(id));
        showSuccess('Schedule deleted successfully!');
        fetchContents();
      } catch (err) {
        console.error('Error deleting content', err);
        setFormError('Failed to delete schedule. Please try again.');
      }
    }
  };

  const openEditModal = (content: Content) => {
    setEditingContent(content);
    setFormData(content);
    setSelectedFile(null);
    
    // Parse existing times to AM/PM format
    const startParsed = parseTimeToAmPm(content.startTime);
    const endParsed = parseTimeToAmPm(content.endTime);
    setStartHour(startParsed.hour);
    setStartMinute(startParsed.minute);
    setStartAmPm(startParsed.amPm);
    setEndHour(endParsed.hour);
    setEndMinute(endParsed.minute);
    setEndAmPm(endParsed.amPm);
    
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingContent(null);
    setFormData({
      title: '',
      description: '',
      type: 'text',
      contentUrl: '',
      longText: '',
      startTime: '06:00:00',
      endTime: '07:00:00',
      isDownloadable: true
    });
    setSelectedFile(null);
    setStartHour('06');
    setStartMinute('00');
    setStartAmPm('AM');
    setEndHour('07');
    setEndMinute('00');
    setEndAmPm('AM');
    setIsModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/login');
  };

  return (
    <div className="admin-page">
      <div className="admin-container container">
        <header className="admin-header">
          <h1>CMS Dashboard</h1>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18} /> Schedule Content
            </button>
            <button className="btn" onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </header>

        <div className="content-table-wrapper glass">
          {loading ? (
            <div className="table-loader">
              <div className="pulse"></div>
              <p>Loading schedules...</p>
            </div>
          ) : contents.length === 0 ? (
            <div className="empty-state">
              <Clock size={48} className="icon-muted" />
              <p>No schedules yet. Create your first content schedule.</p>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <div>
                <h2>{editingContent ? 'Edit Schedule' : 'New Schedule'}</h2>
                <p className="modal-subtitle">{editingContent ? 'Update your content schedule' : 'Create a new content schedule'}</p>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            {formError && <div className="form-error">{formError}</div>}
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter content title"
                  required 
                />
              </div>
              <div className="form-row auto-detect-row">
                <div className="form-group">
                  <label>Content Type (Auto-Detected)</label>
                  <div className="detection-badge-container">
                    <div className={`detection-badge ${detectedType}`}>
                      {detectedType === 'image' && <Image size={16} />}
                      {detectedType === 'video' && <Video size={16} />}
                      {detectedType === 'audio' && <Music size={16} />}
                      {detectedType === 'text' && <Type size={16} />}
                      <span>{detectedType.toUpperCase()} DETECTED</span>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Downloadable</label>
                  <select 
                    value={formData.isDownloadable ? 'yes' : 'no'} 
                    onChange={(e) => setFormData({...formData, isDownloadable: e.target.value === 'yes'})}
                  >
                    <option value="yes">✓ Yes</option>
                    <option value="no">✗ No</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <div className="time-inputs">
                    <select 
                      value={startHour} 
                      onChange={(e) => setStartHour(e.target.value)}
                      className="time-select"
                    >
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i} value={(i + 1).toString().padStart(2, '0')}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                    <span className="time-separator">:</span>
                    <select 
                      value={startMinute} 
                      onChange={(e) => setStartMinute(e.target.value)}
                      className="time-select"
                    >
                      {Array.from({length: 60}, (_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <select 
                      value={startAmPm} 
                      onChange={(e) => setStartAmPm(e.target.value as 'AM' | 'PM')}
                      className="ampm-select"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <div className="time-inputs">
                    <select 
                      value={endHour} 
                      onChange={(e) => setEndHour(e.target.value)}
                      className="time-select"
                    >
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i} value={(i + 1).toString().padStart(2, '0')}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                    <span className="time-separator">:</span>
                    <select 
                      value={endMinute} 
                      onChange={(e) => setEndMinute(e.target.value)}
                      className="time-select"
                    >
                      {Array.from({length: 60}, (_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <select 
                      value={endAmPm} 
                      onChange={(e) => setEndAmPm(e.target.value as 'AM' | 'PM')}
                      className="ampm-select"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-group file-upload-group">
                <label>Media File (Optional)</label>
                <div className="file-upload-wrapper">
                  <input 
                    type="file" 
                    accept="image/*,audio/*,video/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    id="file-upload"
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    <Upload size={20} />
                    <span>{selectedFile ? selectedFile.name : 'Choose file or drag & drop'}</span>
                  </label>
                </div>
                {uploading && <p className="upload-status">⏳ Uploading media...</p>}
              </div>
              <div className="form-group">
                <label>Media Source (URL)</label>
                <input 
                  type="text"
                  value={formData.contentUrl} 
                  onChange={(e) => setFormData({...formData, contentUrl: e.target.value})}
                  placeholder="Enter image/video/audio URL"
                />
              </div>

              <div className="form-group">
                <label>Message Content (Long Text)</label>
                <textarea 
                  value={formData.longText} 
                  onChange={(e) => setFormData({...formData, longText: e.target.value})}
                  placeholder="Type your spiritual message here..."
                  style={{ height: '200px' }}
                />
                <p className="input-hint">This text will appear below your media file.</p>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Add a description (optional)"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={saving || uploading}>
                {saving ? '💾 Saving...' : uploading ? '📤 Uploading...' : (
                  <>
                    <Save size={18} /> Save Schedule
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="success-toast animate-fade-in">
          <p>{successMessage}</p>
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
        .header-actions {
          display: flex;
          gap: 12px;
        }
        .content-table-wrapper {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          min-height: 200px;
        }
        .table-loader {
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          color: var(--text-muted);
        }
        .empty-state {
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          color: var(--text-muted);
          text-align: center;
        }
        .icon-muted {
          opacity: 0.3;
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
          padding: 20px;
        }
        .modal-content {
          background: white;
          width: 100%;
          max-width: 550px;
          max-height: 90vh;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 25px 80px rgba(0,0,0,0.12);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
        }
        .modal-header h2 {
          font-size: 1.5rem;
          color: var(--accent);
          margin-bottom: 4px;
        }
        .modal-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin: 0;
        }
        .close-btn {
          background: #f5f5f5;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .close-btn:hover {
          background: #e0e0e0;
          color: var(--text-main);
        }
        .form-error {
          background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
          color: #c62828;
          padding: 14px 18px;
          border-radius: 12px;
          font-size: 0.9rem;
          margin-bottom: 24px;
          border-left: 4px solid #d32f2f;
        }
        .admin-form .form-group {
          margin-bottom: 22px;
        }
        .admin-form label {
          display: block;
          margin-bottom: 10px;
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-main);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .admin-form input, .admin-form select, .admin-form textarea {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e8e8e8;
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: inherit;
          transition: all 0.2s;
          background: #fafafa;
        }
        .admin-form input:focus, .admin-form select:focus, .admin-form textarea:focus {
          outline: none;
          border-color: var(--gold);
          background: white;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }
        .admin-form textarea {
          height: 100px;
          resize: vertical;
        }
         .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .auto-detect-row {
          margin-bottom: 24px;
        }

        .detection-badge-container {
          padding: 8px 0;
        }

        .detection-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
        }

        .detection-badge.text { background: #f5f5f5; color: #666; border: 1px solid #e0e0e0; }
        .detection-badge.image { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
        .detection-badge.video { background: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb; }
        .detection-badge.audio { background: #fff3e0; color: #ef6c00; border: 1px solid #ffe0b2; }

        .detection-badge span {
          position: relative;
          top: 0px;
        }
        .btn-block {
          width: 100%;
          justify-content: center;
          margin-top: 10px;
        }
        .input-hint {
          font-size: 0.8rem;
          color: var(--text-light);
          margin-top: 6px;
          font-style: italic;
        }
        .upload-status {
          font-size: 0.85rem;
          color: var(--gold);
          margin-top: 8px;
          font-weight: 500;
        }
        .file-upload-group {
          margin-bottom: 24px;
        }
        .file-upload-wrapper {
          position: relative;
        }
        .file-input {
          display: none;
        }
        .file-upload-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 20px;
          border: 2px dashed #d4af37;
          border-radius: 12px;
          background: linear-gradient(135deg, #faf9f5 0%, #f5f0e6 100%);
          cursor: pointer;
          transition: all 0.3s;
          color: var(--gold);
          font-weight: 500;
        }
        .file-upload-label:hover {
          background: linear-gradient(135deg, #f5f0e6 0%, #efe5d3 100%);
          border-color: #c9a227;
          transform: translateY(-2px);
        }
        .file-upload-label span {
          font-size: 0.9rem;
        }
        .success-toast {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: #e8f5e9;
          color: #2e7d32;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          z-index: 1001;
          font-weight: 500;
        }
        .time-inputs {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .time-select {
          width: 70px; /* Specific width for hours/minutes */
          padding: 8px 10px;
          border: 2px solid #e8e8e8;
          border-radius: 10px;
          font-size: 0.95rem;
          font-family: inherit;
          background: #ffffff;
          color: #222222; /* High contrast text */
          cursor: pointer;
        }
        .ampm-select {
          width: 80px; /* Slightly wider for AM/PM */
          padding: 8px 10px;
          border: 2px solid #e8e8e8;
          border-radius: 10px;
          font-size: 0.95rem;
          font-family: inherit;
          background: #ffffff;
          color: #222222; /* High contrast text */
          cursor: pointer;
        }
        .time-separator {
          font-size: 1.1rem;
          color: var(--text-muted);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default Admin;
