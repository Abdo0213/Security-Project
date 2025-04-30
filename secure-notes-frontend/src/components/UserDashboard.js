// components/Notes.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchNotes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/notes', {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('accessToken')}` 
        }
      });
      setNotes(res.data);
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          const refreshRes = await axios.post('http://localhost:5000/token', {
            token: localStorage.getItem('refreshToken')
          });
          localStorage.setItem('accessToken', refreshRes.data.accessToken);
          fetchNotes();
        } catch (refreshError) {
          navigate('/login');
        }
      } else {
        setError('Failed to fetch notes');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/notes/${noteId}`, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('accessToken')}` 
        }
      });
      fetchNotes(); // Refresh the notes list
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      navigate('/login');
      return;
    }
    fetchNotes();
  }, [navigate]);

  return (
    <div className="app-container">
      <Navbar />
      
      <div className="notes-page">
        <div className="notes-header">
          <h1>My Notes</h1>
          <button 
            onClick={() => navigate('/notes/create')}
            className="create-button"
          >
            + Create New
          </button>
        </div>

        {isLoading ? (
          <div className="loading">Loading notes...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : notes.length === 0 ? (
          <div className="empty-notes">
            <p>You don't have any notes yet.</p>
            <button 
              onClick={() => navigate('/notes/create')}
              className="create-button"
            >
              Create Your First Note
            </button>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map(note => (
              <div key={note.id} className="note-card">
                <div className="note-content">
                  {note.content}
                </div>
                <div className="note-actions">
                  <button 
                    onClick={() => handleDelete(note.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}