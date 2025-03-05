import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Form } from 'react-bootstrap';
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

const EditProject: React.FC = () => {
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
            const existingItems = Array.isArray(updatedPhases[phaseKey as keyof typeof phaseDefinitions].items) ? updatedPhases[phaseKey as keyof typeof phaseDefinitions].items : [];
            const defaultItems = phaseDefinitions[phaseKey as keyof typeof phaseDefinitions].subphases;
  
            updatedPhases[phaseKey as keyof typeof phaseDefinitions] = {
              items: defaultItems.map((defaultItem: PhaseItem, index: number) => {
                const existingItem = existingItems[index] || defaultItem;
                // Ensure all properties exist, even if undefined
                return {
                  item: defaultItem.item, // Always use the default item name to maintain consistency
                  cost: existingItem.cost !== undefined ? existingItem.cost : defaultItem.cost,
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
        //console.error('Error fetching project:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
  
    fetchProject();
  }, [user, id]);

  const handleSave = async () => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from('project_users')
        .update({
          project_name: project.project_name,
          start_date: project.start_date,
          end_date: project.end_date,
          estimated_cost: project.estimated_cost,
          phases: project.phases, // Save the updated phases structure
        })
        .eq('id', project.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      navigate('/builder/dashboard/projects');
    } catch (error) {
      //console.error('Error updating project:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleChange = (field: string, value: any) => {
    setProject((prev) => prev ? { ...prev, [field]: value } : null);
  };

  const handlePhaseChange = (phase: string, itemIndex: number, field: string, value: any) => {
    setProject((prev) => {
      if (!prev || !prev.phases) return null;
      const updatedPhases = { ...prev.phases };
      updatedPhases[phase] = {
        ...updatedPhases[phase],
        items: updatedPhases[phase].items.map((item, index) =>
          index === itemIndex ? { ...item, [field]: value } : item
        ),
      };
      return { ...prev, phases: updatedPhases };
    });
  };

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
        <h2 className="text-2xl font-bold text-blue-600 mb-4">Edit Project: {project.project_name}</h2>

        {/* Project Overview */}
        <div className="mb-4">
          <Form.Group>
            <Form.Label>Project Name</Form.Label>
            <Form.Control
              type="text"
              value={project.project_name}
              onChange={(e) => handleChange('project_name', e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mt-2">
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="date"
              value={project.start_date || ''}
              onChange={(e) => handleChange('start_date', e.target.value || null)}
            />
          </Form.Group>
          <Form.Group className="mt-2">
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              value={project.end_date || ''}
              onChange={(e) => handleChange('end_date', e.target.value || null)}
            />
          </Form.Group>
          <Form.Group className="mt-2">
            <Form.Label>Estimated Cost (INR)</Form.Label>
            <Form.Control
              type="number"
              value={project.estimated_cost || ''}
              onChange={(e) => handleChange('estimated_cost', parseFloat(e.target.value) || null)}
            />
          </Form.Group>
        </div>

        <h3 className="text-lg font-medium text-blue-500 mb-2">{phaseDefinitions[currentPhaseKey].name} Phase</h3>

        {/* Subsections for each phase */}
        {currentPhaseKey === 'landPreConstruction' && (
          <h4 className="text-md font-medium text-gray-700 mb-2">a) Land Acquisition & Verification</h4>
        )}
        {currentPhaseKey === 'foundationStructural' && (
          <h4 className="text-md font-medium text-gray-700 mb-2">a) Excavation & Groundwork</h4>
        )}
        {currentPhaseKey === 'superstructure' && (
          <h4 className="text-md font-medium text-gray-700 mb-2">a) Structural Framing (Columns, Beams, Slabs)</h4>
        )}
        {currentPhaseKey === 'internalExternal' && (
          <h4 className="text-md font-medium text-gray-700 mb-2">a) Plumbing & Electrical Rough-In</h4>
        )}
        {currentPhaseKey === 'finalInstallations' && (
          <h4 className="text-md font-medium text-gray-700 mb-2">a) False Ceiling & Decorative Work</h4>
        )}
        {currentPhaseKey === 'testingQuality' && (
          <h4 className="text-md font-medium text-gray-700 mb-2">a) Waterproofing & Leakage Tests</h4>
        )}
        {currentPhaseKey === 'handoverCompletion' && (
          <h4 className="text-md font-medium text-gray-700 mb-2">a) Final Inspection & Walkthrough</h4>
        )}

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
                    onChange={(e) => handlePhaseChange(currentPhase, index, 'cost', parseFloat(e.target.value) || null)}
                    className="w-full p-1 border rounded"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="file"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          // Upload file to Supabase Storage
                          const fileName = `${Date.now()}_${file.name}`;
                          const { data, error } = await supabase.storage
                            .from('project_attachments') // Replace with your bucket name
                            .upload(`public/${fileName}`, file);

                          if (error) throw error;

                          const attachmentUrl = `https://ddxaptcwkmwcbwovdrlr.supabase.co/storage/v1/object/public/project_attachments/${fileName}`;
                          handlePhaseChange(currentPhase, index, 'attachment', attachmentUrl);
                        } catch (error) {
                          //console.error('Error uploading file:', error);
                          setError('Failed to upload file: ' + (error instanceof Error ? error.message : 'Unknown error'));
                        }
                      }
                    }}
                    className="w-full p-1 border rounded"
                  />
                  {item.attachment ? 'File attached' : 'No file chosen'}
                </td>
                <td className="px-4 py-2">
                  <select
                    value={item.status}
                    onChange={(e) => handlePhaseChange(currentPhase, index, 'status', e.target.value)}
                    className="w-full p-1 border rounded"
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
                    onChange={(e) => handlePhaseChange(currentPhase, index, 'completion', e.target.value)}
                    className="w-full p-1 border rounded"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={item.comments || ''}
                    onChange={(e) => handlePhaseChange(currentPhase, index, 'comments', e.target.value)}
                    className="w-full p-1 border rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          className="mt-4 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600"
          onClick={handleSave}
        >
          Save Changes
        </button>
        {error && <div className="mt-4 text-red-600">{error}</div>}
      </div>
    </div>
  );
};

export default EditProject;