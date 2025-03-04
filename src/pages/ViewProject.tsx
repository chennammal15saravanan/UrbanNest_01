import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { phaseDefinitions } from '../constants/phases'; // Import from the shared file

const supabaseUrl = 'https://ddxaptcwkmwcbwovdrlr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeGFwdGN3a213Y2J3b3ZkcmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5Nzc1NzgsImV4cCI6MjA1NjU1MzU3OH0.BWCikX8MvBWSrXkSIwgVA28RXDq1WSuYs4Me_JNFR5k';
const supabase = createClient(supabaseUrl, supabaseKey);

interface PhaseItem {
  item: string;
  cost: number | null;
  attachment: string | null;
  status: string;
  completion: string;
  comments: string;
}

interface Phase {
  items: PhaseItem[];
}

interface Project {
  id: number;
  user_id: string;
  project_name: string;
  start_date: string | null;
  end_date: string | null;
  estimated_cost: number | null;
  phases: Record<string, Phase> | null;
  created_at: string;
}

const ViewProject: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('landPreConstruction'); // Default phase
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

        // Ensure phases are initialized with all subphases if missing
        const updatedPhases = data?.phases || {};
        Object.keys(phaseDefinitions).forEach((phaseKey) => {
          if (!updatedPhases[phaseKey]) {
            updatedPhases[phaseKey as keyof typeof phaseDefinitions] = { items: phaseDefinitions[phaseKey as keyof typeof phaseDefinitions].subphases };
          } else if (!updatedPhases[phaseKey as keyof typeof phaseDefinitions].items || updatedPhases[phaseKey as keyof typeof phaseDefinitions].items.length === 0) {
            updatedPhases[phaseKey as keyof typeof phaseDefinitions] = { items: phaseDefinitions[phaseKey as keyof typeof phaseDefinitions].subphases };
          } else {
            // Ensure all subphases exist and are up to date
            const existingItems = updatedPhases[phaseKey as keyof typeof phaseDefinitions].items;
            const defaultItems = phaseDefinitions[phaseKey as keyof typeof phaseDefinitions].subphases;
            updatedPhases[phaseKey as keyof typeof phaseDefinitions] = {
              items: defaultItems.map((defaultItem: PhaseItem, index: number) => {
                const existingItem = existingItems[index] || defaultItem;
                return {
                  ...defaultItem,
                  ...existingItem,
                  cost: existingItem.cost || defaultItem.cost,
                  attachment: existingItem.attachment || defaultItem.attachment,
                  status: existingItem.status || defaultItem.status,
                  completion: existingItem.completion || defaultItem.completion,
                  comments: existingItem.comments || defaultItem.comments,
                };
              }),
            };
          }
        });

        setProject({ ...data, phases: updatedPhases } as Project);
      } catch (error) {
        console.error('Error fetching project:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
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

  const phaseKeys = Object.keys(phaseDefinitions) as (keyof typeof phaseDefinitions)[];
  const currentPhaseKey = phaseKeys.find(key => key === currentPhase) || 'landPreConstruction';
  const phaseItems = project.phases?.[currentPhaseKey]?.items || phaseDefinitions[currentPhaseKey].subphases;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Phase Navigation Tabs */}
      <div className="flex space-x-2 mb-4">
        {phaseKeys.map((phaseKey, index) => (
          <button
            key={phaseKey}
            className={`px-4 py-2 rounded-md ${currentPhase === phaseKey ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setCurrentPhase(phaseKey)}
          >
            {index + 1}. {phaseDefinitions[phaseKey].name}
          </button>
        ))}
      </div>

      {/* Project Details Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">View Project: {project.project_name}</h2>

        {/* Project Overview (Read-only) */}
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-700"><strong>Project Name:</strong> {project.project_name}</p>
            </div>
            <div>
              <p className="text-gray-700"><strong>Start Date:</strong> {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-700"><strong>End Date:</strong> {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-700"><strong>Estimated Cost (INR):</strong> {project.estimated_cost ? `₹${project.estimated_cost.toLocaleString()}` : 'N/A'}</p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-medium text-blue-500 mb-2">{phaseDefinitions[currentPhaseKey].name} Phase</h3>

        {/* Subsections for each phase */}
        {currentPhaseKey === 'landPreConstruction' && (
          <h4 className="text-md font-medium text-gray-700 mb-2">1. Land Acquisition & Verification</h4>
        )}
        {currentPhaseKey === 'foundationStructural' && (
          <h4 className="text-md font-medium text-gray-700 mb-2">1. Excavation & Groundwork</h4>
        )}
        {currentPhaseKey === 'superstructure' && (
          <h4 className="text-md font-medium text-gray-700 mb-2">1. Structural Framing (Columns, Beams, Slabs)</h4>
        )}
        {currentPhaseKey === 'internalExternal' && (
          <h4 className="text-md font-medium text-gray-700 mb-2">1. Plumbing & Electrical Rough-In</h4>
        )}
        {currentPhaseKey === 'finalInstallations' && (
          <h4 className="text-md font-medium text-gray-700 mb-2">1. False Ceiling & Decorative Work</h4>
        )}
        {currentPhaseKey === 'testingQuality' && (
          <h4 className="text-md font-medium text-gray-700 mb-2">1. Waterproofing & Leakage Tests</h4>
        )}
        {currentPhaseKey === 'handoverCompletion' && (
          <h4 className="text-md font-medium text-gray-700 mb-2">1. Final Inspection & Walkthrough</h4>
        )}

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black text-white">
              <th className="px-4 py-2">Task</th>
              <th className="px-4 py-2">Cost (INR)</th>
              <th className="px-4 py-2">Attachment</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">% Completion</th>
              <th className="px-4 py-2">Comments</th>
            </tr>
          </thead>
          <tbody>
            {phaseItems.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="px-4 py-2">{index + 1}. {item.item}</td>
                <td className="px-4 py-2">{item.cost ? `₹${item.cost.toLocaleString()}` : 'N/A'}</td>
                <td className="px-4 py-2">
                  {item.attachment ? (
                    <a href={item.attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      View Document
                    </a>
                  ) : 'No file chosen'}
                </td>
                <td className="px-4 py-2">{item.status}</td>
                <td className="px-4 py-2">{item.completion || '0%'}</td>
                <td className="px-4 py-2">{item.comments || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          className="mt-4 w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 cursor-not-allowed"
          disabled
        >
          View Only
        </button>
        {error && <div className="mt-4 text-red-600">{error}</div>}
      </div>
    </div>
  );
};

export default ViewProject;