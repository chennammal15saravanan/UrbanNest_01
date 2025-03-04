import React from 'react';
import { Building2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Connect</h1>
        <p className="text-xl text-gray-600">
          Build, Understand, and Explore more with UrbanNest !!!!!
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center mb-6">
            <Building2 className="h-12 w-12 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 ml-3">Builder Login</h2>
          </div>
          <AuthForm 
            userType="builder" 
            onSignupClick={() => navigate('/builder/signup')} 
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center mb-6">
            <Users className="h-12 w-12 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 ml-3">Customer Login</h2>
          </div>
          <AuthForm 
            userType="customer" 
            onSignupClick={() => navigate('/customer/signup')} 
          />
        </div>
      </div>

      <div className="mt-12 bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?auto=format&fit=crop&w=300&h=300"
            alt="Have a nice day"
            className="rounded-full w-32 h-32 object-cover"
          />
        </div>
        <h3 className="text-2xl font-bold text-center text-gray-900 mt-4">
          Welcome to UrbanNest!
        </h3>
        <p className="text-center text-gray-600 mt-2">
          Have a great day ahead!
        </p>
      </div>
    </div>
  );
}