import React from 'react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SignupForm from '../components/SignupForm';

export default function CustomerSignup() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center mb-6">
          <Users className="h-12 w-12 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 ml-3">Customer Registration</h2>
        </div>
        <SignupForm 
          userType="customer"
          onCancel={() => navigate('/')}
        />
      </div>
    </div>
  );
}