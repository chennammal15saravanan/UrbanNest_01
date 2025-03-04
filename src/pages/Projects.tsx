import React, { useState, useEffect } from 'react';
import { 
  FileText,
  Plus 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

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
  phases: Record<string, { items: Array<{ item: string; cost: number | null; attachment: string | null; status: string; completion: string; comments: string }> }> | null;
  created_at: string;
}

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!user || !user.id) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
          .from('project_users')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        setProjects(data || []);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error fetching projects:', error.message);
          setError(`Failed to fetch projects: ${error.message}`);
        } else {
          console.error('Error fetching projects:', error);
          setError('Failed to fetch projects');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  if (loading) {
    return <div className="p-6">Loading projects...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Projects</h2>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center"
          onClick={() => navigate('/builder/dashboard/new-project')}
        >
          <Plus className="w-5 h-5 mr-2" />
          New Project
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{project.project_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {project.estimated_cost ? `₹${project.estimated_cost.toLocaleString()}` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${project.phases?.landPreConstruction?.items?.some(item => item.status === 'Completed') ? 'bg-green-100 text-green-800' : 
                      project.phases?.landPreConstruction?.items?.some(item => item.status === 'In Progress') ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {project.phases?.landPreConstruction?.items?.some(item => item.status === 'Completed') ? 'Completed' : 
                      project.phases?.landPreConstruction?.items?.some(item => item.status === 'In Progress') ? 'In Progress' : 
                      'Planning'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    onClick={() => navigate(`/builder/dashboard/projects/${project.id}/view`)}
                  >
                    View
                  </button>
                  <button 
                    className="text-blue-600 hover:text-blue-900"
                    onClick={() => navigate(`/builder/dashboard/projects/${project.id}/edit`)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Projects;