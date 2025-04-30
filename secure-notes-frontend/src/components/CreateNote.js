// components/CreateNote.js
import CryptoJS from 'crypto-js';
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../assets/Notes.css'; // We'll create this new CSS file

export default function CreateNote() {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "yourencryptionkey";
      // Encrypt the note content before saving
      const iv = CryptoJS.lib.WordArray.random(16);
      const encrypted = CryptoJS.AES.encrypt(content, ENCRYPTION_KEY, { iv }).toString();
      await axios.post('http://localhost:5000/notes', { encrypted, iv }, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('accessToken')}` 
        }
      });
      // Get token and decode it to extract the role
      const userData = JSON.parse(localStorage.getItem('userData'));
      const role = userData.roles?.[0];
      // Navigate based on role
      if (role === 'editor') {
        navigate('/editor');
      } else {
        navigate('/dashboard');
      }
      } catch (error) {
        setError(error.response?.data || 'Failed to create note');
      }
  };
  const handleRole = () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const role = userData.roles?.[0];
    // Navigate based on role
    if (role === 'editor') {
        navigate('/editor');
    } else {
        navigate('/dashboard');
      }
  }

  return (
    <div className="note-form-container">
      <div className="note-form-card">
        <h2 className="note-form-title">Create New Note</h2>
        
        {error && <div className="note-form-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="note-form">
          <div className="form-group">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="note-input full-width"
              placeholder="Write your note here..."
              rows="6"
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button"
              onClick={handleRole}
              className="auth-button secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="auth-button primary"
            >
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}