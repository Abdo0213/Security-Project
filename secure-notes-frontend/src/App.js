// App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import EditorDashboard from './components/EditorDashboard';
import UserDashboard from './components/UserDashboard';
import './assets/Auth.css';
import Login from './components/Login';
import Register from './components/Register';
import Unauthorized from './components/UnAuthorized';
import CreateNote from './components/CreateNote';
import NoteDetail from './components/NoteDetail';
import Logout from './components/Logout';
import { AuthProvider } from './context/authcontext';
import EditNote from './components/EditNote';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute requiredRoles={['user']}>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/editor" 
            element={
              <ProtectedRoute requiredRoles={['editor']}>
                <EditorDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiredRoles={['user']}>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/notes/edit/:id" element={<EditNote />} />
          <Route 
            path="/notes/create" 
            element={
              <ProtectedRoute requiredRoles={['user', 'editor']}>
                <CreateNote />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/notes/:id" 
            element={
              <ProtectedRoute requiredRoles={['user']}>
                <NoteDetail />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/notes/edit/:id" 
            element={
              <ProtectedRoute requiredRoles={['editor']}>
                <CreateNote editMode={true} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/logout" 
            element={
              <ProtectedRoute requiredRoles={['user', 'editor']}>
                <Logout />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;