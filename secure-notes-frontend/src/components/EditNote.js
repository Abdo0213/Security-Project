import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import '../assets/Notes.css';

export default function EditNote() {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams(); // Get the note ID from the URL

  // Fetch the existing note data when the component mounts
  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/notes/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        console.log(response);
        // Assuming the note content is stored encrypted, decrypt it here
        const encryptedContent = response.data.encryptedContent;
        const iv = response.data.iv;
        const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'yourencryptionkey';
        const decrypted = CryptoJS.AES.decrypt(encryptedContent, ENCRYPTION_KEY, { iv: CryptoJS.enc.Hex.parse(iv) });
        setContent(decrypted.toString(CryptoJS.enc.Utf8));
      } catch (error) {
        setError(error.response?.data || 'Failed to fetch note');
      }
    };

    fetchNote();
  }, [id]);

  // Handle form submission to update the note
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'yourencryptionkey';
      const iv = CryptoJS.lib.WordArray.random(16); // Generate new IV for encryption
      const encrypted = CryptoJS.AES.encrypt(content, ENCRYPTION_KEY, { iv }).toString();

      await axios.put(`http://localhost:5000/notes/${id}`, { encrypted, iv }, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      navigate('/editor'); // Navigate back to the notes list
    } catch (error) {
      setError(error.response?.data || 'Failed to update note');
    }
  };

  return (
    <div className="note-form-container">
      <div className="note-form-card">
        <h2 className="note-form-title">Edit Note</h2>

        {error && <div className="note-form-error">{error}</div>}

        <form onSubmit={handleSubmit} className="note-form">
          <div className="form-group">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="note-input full-width"
              placeholder="Edit your note here..."
              rows="6"
            />
          </div>

          <div className="form-actions">
            <button 
              type="button"
              onClick={() => navigate('/editor')}
              className="auth-button secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="auth-button primary"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
