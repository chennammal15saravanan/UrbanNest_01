import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import HomePage from './pages/HomePage';
import BuilderSignup from './pages/BuilderSignup';
import CustomerSignup from './pages/CustomerSignup';
import BuilderDashboard from './pages/BuilderDashboard';
import { useAuth } from './contexts/AuthContext';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">UrbanNest</span>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/" className="text-gray-700 hover:text-blue-600">Home</a>
                <a href="#" className="text-gray-700 hover:text-blue-600">Docs</a>
                <a href="#" className="text-gray-700 hover:text-blue-600">Blogs</a>
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/builder/signup" element={<BuilderSignup />} />
          <Route path="/customer/signup" element={<CustomerSignup />} />
          <Route path="/builder/dashboard/*" element={
            <ProtectedRoute>
              <BuilderDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default App;