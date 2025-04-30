import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserRoleBadge from './UserRoleBadge';
import Navbar from './Navbar';


export default function EditorDashboard() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      setError(error.response?.data || 'Failed to fetch notes');
    } finally {
      setLoading(false);
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

  const handleEdit = (noteId) => {
    navigate(`/notes/edit/${noteId}`);
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      navigate('/login');
      return;
    }
    fetchNotes();
  }, [navigate]);

  if (loading) return <div className="loading">Loading notes...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className='app-container'>
        <Navbar/>
        <div className="notes-page">
        <div className="dashboard-header">
            <h1>Editor Dashboard</h1>
            <div className="editor-actions">
            <button 
                onClick={() => navigate('/notes/create')}
                className="auth-button primary"
            >
                + Create New Note
            </button>
            </div>
        </div>

        <div className="notes-grid">
            {notes.map(note => (
            <div key={note.id} className="note-card">
                <div className="note-content">
                {note.content}
                </div>
                <div className="note-actions">
                <button 
                    onClick={() => handleEdit(note.id)}
                    className="edit-button"
                >
                    Edit
                </button>
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
        </div>
    </div>
  );
}