import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';

const supabaseUrl = 'https://mddprsymtcgvybenatwg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHByc3ltdGNndnliZW5hdHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwOTY5MzQsImV4cCI6MjA1NjY3MjkzNH0.hawSQGzxjV0bKG7PqP6BmpJtLmW89BSsj8AeButHrGQ';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Project {
  id: number;
  user_id: string;
  project_name: string;
  start_date: string | null;
  end_date: string | null;
  total_sq_feet: number | null;
  construction_type: string | null;
  num_floors: number | null;
  floors: Array<{ floorNumber: number; numApartments: number; apartmentTypes: string[] }> | null;
  estimated_cost: number | null;
  phases: Record<string, { enabled: boolean; percentage: string; items: Array<{ item: string; cost: number | null; attachment: string | null; status: string; completion: string; comments: string }> }>;
  created_at: string;
}

const Projects: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!user || !user.id) {
          throw new Error('User not authenticated');
        }

        console.log('Fetching projects for user:', user.id);
        const { data, error } = await supabase
          .from('project_users')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('Projects fetched:', data);
        setProjects(data || []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Fetch projects error:', error);
        setError(`Failed to fetch projects: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  const handleProjectClick = (projectId: number) => {
    console.log('Navigating to project details:', projectId);
    navigate(`/builder/dashboard/projects/${projectId}`);
  };

  const handleEditClick = (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Edit clicked for project:', projectId);
    navigate(`/builder/dashboard/projects/edit/${projectId}`);
  };

  if (loading) {
    return <div className="p-6">Loading projects...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Projects</h2>
      {projects.length === 0 ? (
        <p className="text-gray-600">No projects found. Create a new project to get started!</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Project Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Start Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">End Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Estimated Cost (INR)</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Construction Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Total Sq. Feet</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Number of Floors</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Created At</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <td className="px-4 py-3 text-sm text-gray-900">{project.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <Link 
                      to={`/builder/dashboard/projects/${project.id}`} 
                      className="text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {project.project_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {project.start_date || 'Not set'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {project.end_date || 'Not set'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {project.estimated_cost
                      ? `₹${project.estimated_cost.toLocaleString()}`
                      : 'Not set'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {project.construction_type || 'Not set'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {project.total_sq_feet
                      ? project.total_sq_feet.toLocaleString()
                      : 'Not set'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {project.num_floors || 'Not set'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(project.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <button
                      onClick={(e) => handleEditClick(project.id, e)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Projects;