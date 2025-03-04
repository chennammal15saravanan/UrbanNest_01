import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';

const supabaseUrl = 'https://ddxaptcwkmwcbwovdrlr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeGFwdGN3a213Y2J3b3ZkcmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5Nzc1NzgsImV4cCI6MjA1NjU1MzU3OH0.BWCikX8MvBWSrXkSIwgVA28RXDq1WSuYs4Me_JNFR5k';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Project {
  id: number;
  user_id: string;
  project_name: string;
  start_date: string | null;
  end_date: string | null;
  estimated_cost: number | null;
  phases: Record<string, { items: Array<{ item: string; cost: number | null; attachment: string | null; status: string; completion: string; comments: string }> }>;
  created_at: string;
}

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!user || !user.id || !id) {
          throw new Error('User not authenticated or project ID missing');
        }

        const { data, error } = await supabase
          .from('project_users')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setProject(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching project:', errorMessage);
        setError(`Failed to fetch project: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [user, id]);

  if (loading) {
    return <div className="p-6">Loading project details...</div>;
  }

  if (error || !project) {
    return <div className="p-6 text-red-600">{error || 'Project not found'}</div>;
  }

  const currentPhase = 'landPreConstruction'; // Default to Land & Pre-Construction for this example
  const phaseItems = project.phases[currentPhase]?.items || [];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Phase Navigation Tabs */}
      <div className="flex space-x-2 mb-4">
        {['Land & Pre-Construction', 'Foundation & Structural', 'Superstructure', 'Internal & External Works', 'Final Installations', 'Testing & Quality', 'Handover'].map((phase, index) => (
          <button
            key={phase}
            className={`px-4 py-2 rounded-md ${index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => console.log(`Switch to ${phase}`)} // Implement phase switching logic here
          >
            {index + 1}. {phase}
          </button>
        ))}
      </div>

      {/* Project Details Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">1. Land & Pre-Construction Phase</h2>
        <h3 className="text-lg font-medium text-blue-500 mb-2">a) Land Acquisition & Verification</h3>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black text-white">
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Cost (INR)</th>
              <th className="px-4 py-2">Attachment</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">%</th>
              <th className="px-4 py-2">Comments</th>
            </tr>
          </thead>
          <tbody>
            {phaseItems.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="px-4 py-2">{item.item}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={item.cost || ''}
                    onChange={(e) => console.log(`Update cost for ${item.item}: ${e.target.value}`)}
                    className="w-full p-1 border rounded"
                    disabled
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="file"
                    onChange={(e) => console.log(`Upload file for ${item.item}:`, e.target.files?.[0])}
                    className="w-full p-1 border rounded"
                  />
                  {item.attachment ? 'File attached' : 'No file chosen'}
                </td>
                <td className="px-4 py-2">
                  <select
                    value={item.status}
                    onChange={(e) => console.log(`Update status for ${item.item}: ${e.target.value}`)}
                    className="w-full p-1 border rounded"
                    disabled
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={item.completion}
                    onChange={(e) => console.log(`Update completion for ${item.item}: ${e.target.value}`)}
                    className="w-full p-1 border rounded"
                    disabled
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={item.comments || ''}
                    onChange={(e) => console.log(`Update comments for ${item.item}: ${e.target.value}`)}
                    className="w-full p-1 border rounded"
                    disabled
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          className="mt-4 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600"
          onClick={() => console.log('Save details')}
        >
          Save Details
        </button>
      </div>
    </div>
  );
};

export default ProjectDetails;