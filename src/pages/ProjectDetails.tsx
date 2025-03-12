import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';

const supabaseUrl = 'https://mddprsymtcgvybenatwg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHByc3ltdGNndnliZW5hdHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwOTY5MzQsImV4cCI6MjA1NjY3MjkzNH0.hawSQGzxjV0bKG7PqP6BmpJtLmW89BSsj8AeButHrGQ';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Phase {
  id: number;
  project_id: number;
  phase_name: string;
  enabled: boolean;
  percentage: number;
  items: Array<{ item: string; cost: number | null; attachment: string | null; status: string; completion: string; comments: string }>;
}

interface Floor {
  id: number;
  project_id: number;
  floor_number: number;
  num_apartments: number;
  apartment_types: string[];
}

interface Project {
  id: number;
  user_id: string;
  project_name: string;
  start_date: string | null;
  end_date: string | null;
  total_sq_feet: number | null;
  construction_type: string | null;
  num_floors: number | null;
  estimated_cost: number | null;
  created_at: string;
}

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('Land & Pre-Construction');

  useEffect(() => {
    const fetchProjectAndPhases = async () => {
      try {
        if (!user || !user.id || !id) {
          throw new Error('User not authenticated or project ID missing');
        }

        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('project_users')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (projectError) throw projectError;

        if (!projectData) throw new Error('Project not found');

        setProject(projectData);

        // Fetch phases
        const { data: phasesData, error: phasesError } = await supabase
          .from('project_phases')
          .select('*')
          .eq('project_id', projectData.id);

        if (phasesError) throw phasesError;

        setPhases(phasesData || []);

        // Fetch floors
        const { data: floorsData, error: floorsError } = await supabase
          .from('project_floors')
          .select('*')
          .eq('project_id', projectData.id);

        if (floorsError) throw floorsError;

        setFloors(floorsData || []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Failed to fetch project: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndPhases();
  }, [user, id]);

  const handlePhaseChange = (phaseName: string) => {
    setCurrentPhase(phaseName);
  };

  if (loading) {
    return <div className="p-6">Loading project details...</div>;
  }

  if (error || !project) {
    return <div className="p-6 text-red-600">{error || 'Project not found'}</div>;
  }

  const currentPhaseData = phases.find((phase) => phase.phase_name === currentPhase);
  const phaseItems = currentPhaseData?.items || [];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Project Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{project.project_name}</h2>
        <p className="text-sm text-gray-600">Start Date: {project.start_date || 'Not set'}</p>
        <p className="text-sm text-gray-600">End Date: {project.end_date || 'Not set'}</p>
        <p className="text-sm text-gray-600">
          Estimated Cost: {project.estimated_cost ? `₹${project.estimated_cost.toLocaleString()}` : 'Not set'}
        </p>
        <p className="text-sm text-gray-600">Construction Type: {project.construction_type || 'Not set'}</p>
        <p className="text-sm text-gray-600">
          Total Sq. Feet: {project.total_sq_feet ? project.total_sq_feet.toLocaleString() : 'Not set'}
        </p>
        <p className="text-sm text-gray-600">Number of Floors: {project.num_floors || 'Not set'}</p>
      </div>

      {/* Floor Details */}
      {floors.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Floor Details</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="px-4 py-2 text-left">Floor Number</th>
                <th className="px-4 py-2 text-left">Number of Apartments</th>
                <th className="px-4 py-2 text-left">Apartment Types</th>
              </tr>
            </thead>
            <tbody>
              {floors.map((floor) => (
                <tr key={floor.id} className="border-b">
                  <td className="px-4 py-2">{floor.floor_number}</td>
                  <td className="px-4 py-2">{floor.num_apartments || 'Not set'}</td>
                  <td className="px-4 py-2">{floor.apartment_types?.join(', ') || 'Not set'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Phase Navigation Tabs */}
      <div className="flex space-x-2 mb-4 flex-wrap">
        {phases.map((phase, index) => (
          <button
            key={phase.id}
            className={`px-4 py-2 rounded-md mb-2 ${
              phase.phase_name === currentPhase ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => handlePhaseChange(phase.phase_name)}
          >
            {index + 1}. {phase.phase_name}
          </button>
        ))}
      </div>

      {/* Phase Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">
          {phases.findIndex((phase) => phase.phase_name === currentPhase) + 1}. {currentPhase} Phase
        </h2>
        <h3 className="text-lg font-medium text-blue-500 mb-2">
          {currentPhase === 'Land & Pre-Construction' ? 'a) Land Acquisition & Verification' : 'Details'}
        </h3>

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