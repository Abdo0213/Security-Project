// components/NoteDetail.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../assets/Notes.css';

export default function NoteDetail() {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/notes/${id}`, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('accessToken')}` 
          }
        });
        setNote(res.data);
      } catch (error) {
        setError(error.response?.data || 'Failed to fetch note');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  if (loading) return <div className="loading">Loading note...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!note) return <div className="empty-notes">Note not found</div>;

  return (
    <div className="note-detail">
      <h1>Note Details</h1>
      <div className="note-card">
        <div className="note-content">
          {note.content}
        </div>
        <div className="note-meta">
          <p>Created at: {new Date(note.createdAt).toLocaleString()}</p>
          {note.updatedAt && <p>Updated at: {new Date(note.updatedAt).toLocaleString()}</p>}
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="auth-button secondary"
        >
          Back to Notes
        </button>
      </div>
    </div>
  );
}