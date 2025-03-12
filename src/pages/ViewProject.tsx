import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Assuming supabase is configured in a separate file
import { useAuth } from '../lib/auth'; // Assuming useAuth is available

interface Floor {
  floor_number: number;
  num_apartments: number | null;
  apartment_types: string[] | null;
}

interface PhaseItem {
  item: string;
  cost: number | null;
  attachment: string | null;
  status: string;
  completion: string;
  comments: string;
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
  phases: Record<string, { items: PhaseItem[]; percentage: number }> | null;
  created_at: string;
}

const ViewProject: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth(); // Assuming useAuth is available
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('landPreConstruction');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0); // State for calculated total cost

  // Define default sub-phases to match EditProject
  const defaultSubPhases = {
    landPreConstruction: [
      'Legal Documentation', 'Title Deed Verification', 'Government Approvals & Permits',
      'Geotechnical Soil Report', 'Site Survey (Topography & Mapping)', 'Floor Plans & Site Layouts',
      'Structural Engineering Plans', 'Environmental Clearance', 'Municipality Approvals (Building Permit)',
      'Fire & Safety Approval', 'Electricity & Water Supply Sanctions', 'Project Cost Estimation & Budgeting',
      'Contractor Bidding & Tendering', 'Material & Labor Cost Estimation', 'Land Leveling & Clearing',
      'Temporary Site Office Setup', 'Demolition of Existing Structures',
    ],
    foundationStructural: [
      'Digging & Grading the Site', 'Soil Treatment for Pests & Waterproofing', 'Footings & Pile Foundation',
      'Concrete Slabs & Columns', 'Reinforced Concrete Plinth', 'Waterproofing & Curing',
    ],
    superstructure: [
      'RCC (Reinforced Concrete Columns & Beams)', 'Slab Construction for Each Floor',
      'Exterior & Interior Wall Masonry', 'Partition Walls in Apartments', 'Casting of Roof Slabs',
      'Waterproofing the Roof',
    ],
    internalExternal: [
      'Underground Plumbing & Drainage', 'Electrical Wiring & Ducting Installation',
      'Air Conditioning & Ventilation Systems', 'Fire Safety Sprinklers & Smoke Detectors',
      'Interior Wall Plastering', 'Exterior Wall Rendering', 'Main Door, Balcony Doors',
      'Window Fittings', 'Marble, Tiles, or Wooden Flooring', 'Bathroom & Kitchen Tiling',
      'Primer & Painting (Interior & Exterior)', 'Textured Finishing for Facade',
    ],
    finalInstallations: [
      'POP False Ceilings & LED Lighting Setup', 'Kitchen & Bathroom Cabinets',
      'Wardrobes & Storage Units', 'Sink, Faucets, Shower, Toilet Installation',
      'Drainage & Sewage Connectivity', 'Switchboards, Light Fixtures',
      'Smart Home Automation (if applicable)',
    ],
    testingQuality: [
      'Bathroom, Kitchen, and Roof Checks', 'Load Testing for Electrical Systems',
      'Fire Alarm & Safety Compliance Check', 'Fixing Minor Issues Before Handover',
    ],
    handoverCompletion: [
      'Builder Walkthrough with Buyer', 'Final Approval from Authorities', 'Keys Given to Buyer',
      'Documentation (Occupancy Certificate, Warranty Papers, etc.)', '6-Months to 1-Year Maintenance Period',
    ],
  };

  const phaseDefinitions = {
    landPreConstruction: { name: 'Land & Pre-Construction', subphases: defaultSubPhases.landPreConstruction },
    foundationStructural: { name: 'Foundation & Structural', subphases: defaultSubPhases.foundationStructural },
    superstructure: { name: 'Superstructure', subphases: defaultSubPhases.superstructure },
    internalExternal: { name: 'Internal & External Works', subphases: defaultSubPhases.internalExternal },
    finalInstallations: { name: 'Final Installations', subphases: defaultSubPhases.finalInstallations },
    testingQuality: { name: 'Testing & Quality', subphases: defaultSubPhases.testingQuality },
    handoverCompletion: { name: 'Handover & Completion', subphases: defaultSubPhases.handoverCompletion },
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!user || !user.id || !id) {
          throw new Error('User not authenticated or project ID missing');
        }

        const { data: projectData, error: projectError } = await supabase
          .from('project_users')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (projectError) throw projectError;
        if (!projectData) throw new Error('Project not found');

        const { data: floorsData, error: floorsError } = await supabase
          .from('project_floors')
          .select('*')
          .eq('project_id', id);

        if (floorsError) throw floorsError;

        const { data: phaseData, error: phaseError } = await supabase
          .from('project_phases')
          .select('*')
          .eq('project_id', id);

        if (phaseError) throw phaseError;

        // Initialize phases with default sub-phases to ensure all are present
        const updatedPhases: Record<string, { items: PhaseItem[]; percentage: number }> = {};
        Object.keys(phaseDefinitions).forEach((phaseKey) => {
          updatedPhases[phaseKey] = {
            items: defaultSubPhases[phaseKey as keyof typeof defaultSubPhases].map((item) => ({
              item,
              cost: null,
              attachment: null,
              status: 'Pending',
              completion: '0',
              comments: '',
            })),
            percentage: 0,
          };
        });

        // Merge with saved phase data
        if (phaseData && phaseData.length > 0) {
          phaseData.forEach((phase: any) => {
            const phaseKey = Object.keys(phaseDefinitions).find(
              (key) => phaseDefinitions[key as keyof typeof phaseDefinitions].name === phase.phase_name
            );
            if (phaseKey && phase.items && phase.items.length > 0) {
              const savedItemsMap = new Map(
                phase.items.map((item: any) => [
                  item.item,
                  {
                    item: item.item || '',
                    cost: item.cost || null,
                    attachment: item.attachment || null,
                    status: item.status || 'Pending',
                    completion: item.completion || '0',
                    comments: item.comments || '',
                  },
                ])
              );
              updatedPhases[phaseKey].items = defaultSubPhases[phaseKey as keyof typeof defaultSubPhases].map(
                (defaultItem) => savedItemsMap.get(defaultItem) || {
                  item: defaultItem,
                  cost: null,
                  attachment: null,
                  status: 'Pending',
                  completion: '0',
                  comments: '',
                }
              );
              updatedPhases[phaseKey].percentage = phase.percentage || 0;
            }
          });
        }

        // Calculate total cost from all phases
        const calculatedTotalCost = Object.values(updatedPhases).reduce((total, phase) => {
          const phaseTotal = phase.items.reduce((sum, item) => {
            const costValue = item.cost ? parseInt(item.cost.toString()) : 0;
            return sum + costValue;
          }, 0);
          return total + phaseTotal;
        }, 0);

        setTotalCost(calculatedTotalCost);

        setProject({
          ...projectData,
          phases: updatedPhases,
        } as Project);

        setFloors(floorsData || []);
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
  const currentPhaseKey = phaseKeys.find((key) => key === currentPhase) || 'landPreConstruction';
  const phaseItems = project.phases?.[currentPhaseKey]?.items || [];

  console.log('Rendering ViewProject with phaseItems:', phaseItems); // Debug log

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Project Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">{project.project_name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-700"><strong>Start Date:</strong> {project.start_date || 'Not set'}</p>
            <p className="text-gray-700"><strong>End Date:</strong> {project.end_date || 'Not set'}</p>
            <p className="text-gray-700"><strong>Estimated Cost (INR):</strong> {project.estimated_cost ? `₹${project.estimated_cost.toLocaleString()}` : 'Not set'}</p>
            <p className="text-gray-700"><strong>Total Cost (INR):</strong> {totalCost ? `₹${totalCost.toLocaleString()}` : 'Not set'}</p>
          </div>
          <div>
            <p className="text-gray-700"><strong>Construction Type:</strong> {project.construction_type || 'Not set'}</p>
            <p className="text-gray-700"><strong>Total Sq. Feet:</strong> {project.total_sq_feet ? project.total_sq_feet.toLocaleString() : 'Not set'}</p>
            <p className="text-gray-700"><strong>Number of Floors:</strong> {project.num_floors || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* Floor Details */}
      {project.construction_type === 'Residential' && floors.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-blue-500 mb-4">Floor Details</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="px-4 py-2 text-left">Floor Number</th>
                <th className="px-4 py-2 text-left">Number of Apartments</th>
                <th className="px-4 py-2 text-left">Apartment Types</th>
              </tr>
            </thead>
            <tbody>
              {floors.map((floor, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2">{floor.floor_number}</td>
                  <td className="px-4 py-2">{floor.num_apartments || '0'}</td>
                  <td className="px-4 py-2">{floor.apartment_types?.join(', ') || 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Phase Navigation Tabs */}
      <div className="flex space-x-2 mb-4 overflow-x-auto">
        {phaseKeys.map((phaseKey, index) => (
          <button
            key={phaseKey}
            className={`px-4 py-2 rounded-md whitespace-nowrap ${
              currentPhase === phaseKey ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setCurrentPhase(phaseKey)}
          >
            {index + 1}. {phaseDefinitions[phaseKey].name}
          </button>
        ))}
      </div>

      {/* Phase Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-blue-500 mb-4">{phaseDefinitions[currentPhaseKey].name} Phase</h3>
        <div className="mb-4">
          <strong>Phase Completion:</strong> {project.phases?.[currentPhaseKey]?.percentage || 0}%
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-700"> {/* Changed from bg-black to bg-gray-200 */}
              <th className="px-4 py-2">Item</th>
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
                <td className="px-4 py-2">{item.item}</td>
                <td className="px-4 py-2">{item.cost ? `₹${item.cost.toLocaleString()}` : 'N/A'}</td>
                <td className="px-4 py-2">
                  {item.attachment ? (
                    <a href={item.attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View
                    </a>
                  ) : 'N/A'}
                </td>
                <td className="px-4 py-2">{item.status || 'N/A'}</td>
                <td className="px-4 py-2">{item.completion || '0'}%</td>
                <td className="px-4 py-2">{item.comments || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex space-x-4">
          <button
            onClick={() => navigate('/builder/dashboard/projects')}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            Back
          </button>
        </div>

        {error && <div className="mt-4 text-red-600">{error}</div>}
      </div>
    </div>
  );
};

export default ViewProject;