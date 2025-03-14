import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, Link } from 'react-router-dom';
import { 
  Building2, Search, Bell, User, LogOut, Settings as SettingsIcon, 
  HelpCircle, Plus, Home, BarChart3, FileText, Users, Calendar 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { createClient } from '@supabase/supabase-js';
import ProjectDetails from './ProjectDetails';
import EditProject from './EditProject';
import Finance from './Finance';
import Projects from './Projects';

// Initialize Supabase client
const supabaseUrl = 'https://mddprsymtcgvybenatwg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHByc3ltdGNndnliZW5hdHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwOTY5MzQsImV4cCI6MjA1NjY3MjkzNH0.hawSQGzxjV0bKG7PqP6BmpJtLmW89BSsj8AeButHrGQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// FormData interface
interface FormData {
  projectName: string;
  startDate: string;
  endDate: string;
  totalSqFeet: string;
  constructionType: string;
  numFloors: number;
  floors: { floorNumber: number; numApartments: number; apartmentTypes: string[] }[];
  phases: Record<string, { enabled: boolean; percentage: string }>;
  estimatedCost: string;
}

const BuilderDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

  const [formData, setFormData] = useState<FormData>({
    projectName: '',
    startDate: '',
    endDate: '',
    totalSqFeet: '',
    constructionType: '',
    numFloors: 0,
    floors: [],
    estimatedCost: '',
    phases: {
      LandPreConstruction: { enabled: true, percentage: '0' },
      FoundationStructural: { enabled: true, percentage: '0' },
      Superstructure: { enabled: true, percentage: '0' },
      InternalExternal: { enabled: true, percentage: '0' },
      FinalInstallations: { enabled: true, percentage: '0' },
      TestingQuality: { enabled: true, percentage: '0' },
      HandoverCompletion: { enabled: true, percentage: '0' },
    },
  });

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('project_users')
          .select('*')
          .eq('user_id', user.id);
        if (error) console.error('Error fetching projects:', error);
        else setProjects(data || []);
      }
    };
    fetchProjects();
  }, [user?.id]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
    setFormData({
      projectName: '',
      startDate: '',
      endDate: '',
      totalSqFeet: '',
      constructionType: '',
      numFloors: 0,
      floors: [],
      estimatedCost: '',
      phases: {
        LandPreConstruction: { enabled: true, percentage: '0' },
        FoundationStructural: { enabled: true, percentage: '0' },
        Superstructure: { enabled: true, percentage: '0' },
        InternalExternal: { enabled: true, percentage: '0' },
        FinalInstallations: { enabled: true, percentage: '0' },
        TestingQuality: { enabled: true, percentage: '0' },
        HandoverCompletion: { enabled: true, percentage: '0' },
      },
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const [phase, field] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        phases: {
          ...prev.phases,
          [phase]: {
            ...prev.phases[phase as keyof typeof prev.phases],
            [field]: (e.target as HTMLInputElement).checked,
          },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'numFloors' ? parseInt(value) || 0 : value,
      }));
    }
  };

  const handlePhasePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [phase] = name.split('.');
    setFormData((prev) => ({
      ...prev,
      phases: {
        ...prev.phases,
        [phase]: {
          ...prev.phases[phase as keyof typeof prev.phases],
          percentage: value,
        },
      },
    }));
  };

  const handleFloorInputChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const updatedFloors = [...prev.floors];
      updatedFloors[index] = { ...updatedFloors[index], [field]: value };
      return { ...prev, floors: updatedFloors };
    });
  };

  const handleAddFloor = () => {
    setFormData((prev) => ({
      ...prev,
      floors: [
        ...prev.floors,
        { floorNumber: prev.floors.length + 1, numApartments: 0, apartmentTypes: [] },
      ],
    }));
  };

  const handleApartmentTypeChange = (index: number, type: string) => {
    setFormData((prev) => {
      const updatedFloors = [...prev.floors];
      const floor = updatedFloors[index];
      const types = floor.apartmentTypes.includes(type)
        ? floor.apartmentTypes.filter((t) => t !== type)
        : [...floor.apartmentTypes, type];
      updatedFloors[index] = { ...floor, apartmentTypes: types };
      return { ...prev, floors: updatedFloors };
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveProject = async () => {
    try {
      if (!user || !user.id) throw new Error('User not authenticated or ID missing');
      if (!formData.projectName.trim()) throw new Error('Project name is required');

      if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        throw new Error('End date must be after start date');
      }
      if (formData.totalSqFeet && parseFloat(formData.totalSqFeet) < 0) {
        throw new Error('Total square feet cannot be negative');
      }
      if (formData.numFloors < 0) {
        throw new Error('Number of floors cannot be negative');
      }
      if (formData.estimatedCost && parseFloat(formData.estimatedCost) < 0) {
        throw new Error('Estimated cost cannot be negative');
      }

      const projectData = {
        user_id: user.id,
        project_name: formData.projectName,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        total_sq_feet: formData.totalSqFeet ? parseFloat(formData.totalSqFeet) : null,
        construction_type: formData.constructionType || null,
        num_floors: formData.numFloors || null,
        estimated_cost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
      };

      const { data: project, error: projectError } = await supabase
        .from('project_users')
        .insert([projectData])
        .select()
        .single();

      if (projectError) throw projectError;

      if (!project || !project.id) {
        throw new Error('Project saved but no ID returned');
      }

      if (formData.floors.length > 0) {
        const floorInserts = formData.floors.map((floor) => ({
          project_id: project.id,
          floor_number: floor.floorNumber,
          num_apartments: floor.numApartments,
          apartment_types: floor.apartmentTypes,
        }));

        const { error: floorError } = await supabase
          .from('project_floors')
          .insert(floorInserts);

        if (floorError) throw floorError;
      }

      const phaseInserts = Object.entries(formData.phases).map(([phase, { enabled, percentage }]) => ({
        project_id: project.id,
        phase_name: phase === 'LandPreConstruction' ? 'Land & Pre-Construction' :
                    phase === 'FoundationStructural' ? 'Foundation & Structural Construction' :
                    phase === 'Superstructure' ? 'Superstructure Construction' :
                    phase === 'InternalExternal' ? 'Internal & External' :
                    phase === 'FinalInstallations' ? 'Final Installations' :
                    phase === 'TestingQuality' ? 'Testing & Quality' :
                    'Handover & Completion',
        enabled,
        percentage: percentage ? parseInt(percentage) : 0,
        items: phase === 'LandPreConstruction' ? [
          { item: "Legal Documentation", cost: null, attachment: null, status: "Pending", completion: "", comments: "" },
          { item: "Title Deed Verification", cost: null, attachment: null, status: "Pending", completion: "", comments: "" },
          { item: "Government Approvals & Permits", cost: null, attachment: null, status: "Pending", completion: "", comments: "" }
        ] : [],
      }));

      const { error: phaseError } = await supabase
        .from('project_phases')
        .insert(phaseInserts);

      if (phaseError) throw phaseError;

      console.log('Project, floors, and phases saved:', project);

      // Refresh projects list
      const { data: updatedProjects, error: fetchError } = await supabase
        .from('project_users')
        .select('*')
        .eq('user_id', user.id);
      if (fetchError) {
        console.error('Error fetching updated projects:', fetchError);
        setError(`Failed to fetch updated projects: ${fetchError.message}`);
      } else {
        setProjects(updatedProjects || []);
      }

      handleCloseModal();
      navigate('/builder/dashboard/projects');
    } catch (error) {
      console.error('Error saving project:', error);
      setError(`Failed to save project: ${(error as Error).message || 'An unknown error occurred'}`);
    }
  };

  const getActiveClass = (path: string) => {
    const currentPath = window.location.pathname;
    return currentPath.startsWith(path) ? 'bg-blue-700' : 'hover:bg-blue-700';
  };

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-800 text-white">
        <div className="p-4 flex items-center">
          <Building2 className="h-8 w-8" />
          <span className="ml-2 text-xl font-bold">Builder Portal</span>
        </div>
        <nav className="mt-8">
          <div className="px-4 space-y-1">
            <Link to="/builder/dashboard" className={`flex items-center px-4 py-2 text-white rounded-md ${getActiveClass('/builder/dashboard')}`}>
              <Home className="h-5 w-5 mr-3" />
              Dashboard
            </Link>
            <Link to="/builder/dashboard/projects" className={`flex items-center px-4 py-2 text-white rounded-md ${getActiveClass('/builder/dashboard/projects')}`}>
              <FileText className="h-5 w-5 mr-3" />
              Projects
            </Link>
            <Link to="/builder/dashboard/analytics" className={`flex items-center px-4 py-2 text-white rounded-md ${getActiveClass('/builder/dashboard/analytics')}`}>
              <BarChart3 className="h-5 w-5 mr-3" />
              Analytics
            </Link>
            <Link to="/builder/dashboard/clients" className={`flex items-center px-4 py-2 text-white rounded-md ${getActiveClass('/builder/dashboard/clients')}`}>
              <Users className="h-5 w-5 mr-3" />
              Clients
            </Link>
            <Link to="/builder/dashboard/schedule" className={`flex items-center px-4 py-2 text-white rounded-md ${getActiveClass('/builder/dashboard/schedule')}`}>
              <Calendar className="h-5 w-5 mr-3" />
              Schedule
            </Link>
          </div>
          <div className="px-4 mt-8 pt-6 border-t border-blue-700">
            <Link to="/builder/dashboard/settings" className={`flex items-center px-4 py-2 text-white rounded-md ${getActiveClass('/builder/dashboard/settings')}`}>
              <SettingsIcon className="h-5 w-5 mr-3" />
              Settings
            </Link>
            <Link to="/builder/dashboard/help" className={`flex items-center px-4 py-2 text-white rounded-md ${getActiveClass('/builder/dashboard/help')}`}>
              <HelpCircle className="h-5 w-5 mr-3" />
              Help & Support
            </Link>
            <Link to="/builder/dashboard/finance" className={`flex items-center px-4 py-2 text-white rounded-md ${getActiveClass('/builder/dashboard/finance')}`}>
              <FileText className="h-5 w-5 mr-3" />
              Finance
            </Link>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-2 text-white rounded-md hover:bg-blue-700"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex-1 flex">
              <div className="max-w-lg w-full lg:max-w-xs relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search projects..."
                  type="search"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="#" className="text-gray-600 hover:underline">Home</Link>
              <Link to="#" className="text-gray-600 hover:underline">Docs</Link>
              <Link to="#" className="text-gray-600 hover:underline">Blogs</Link>
              <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Bell className="h-6 w-6" />
              </button>
              <div className="ml-4 relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <User className="h-5 w-5" />
                  </div>
                </button>
                {showProfileMenu && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Link to="/builder/dashboard/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Your Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 flex justify-center">
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center"
              onClick={handleOpenModal}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-100 p-6">
          {error && (
            <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
              {error}
            </div>
          )}
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/projects/edit/:id" element={<EditProject />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<Navigate to="/builder/dashboard" replace />} />
          </Routes>
        </main>

        {/* Modal for New Project */}
        <Modal show={isModalOpen} onHide={handleCloseModal} size="lg" scrollable className="custom-modal">
          <Modal.Header closeButton>
            <Modal.Title>Create a New Project</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
                {error}
              </div>
            )}
            <Form>
              <Form.Group className="mb-3 form-group">
                <Form.Label>Project Name:</Form.Label>
                <Form.Control
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  placeholder="Enter project name"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3 form-group">
                <Form.Label>Start Date:</Form.Label>
                <Form.Control
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </Form.Group>

              <Form.Group className="mb-3 form-group">
                <Form.Label>End Date:</Form.Label>
                <Form.Control
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </Form.Group>

              <Form.Group className="mb-3 form-group">
                <Form.Label>Total Square Feet Planned:</Form.Label>
                <Form.Control
                  type="number"
                  name="totalSqFeet"
                  value={formData.totalSqFeet}
                  onChange={handleInputChange}
                  placeholder="Enter total square feet"
                />
              </Form.Group>

              <Form.Group className="mb-3 form-group">
                <Form.Label>Estimated Cost (INR):</Form.Label>
                <Form.Control
                  type="number"
                  name="estimatedCost"
                  value={formData.estimatedCost}
                  onChange={handleInputChange}
                  placeholder="Enter estimated cost in INR"
                />
              </Form.Group>

              <Form.Group className="mb-3 form-group">
                <Form.Label>Type of Construction:</Form.Label>
                <Form.Select
                  name="constructionType"
                  value={formData.constructionType}
                  onChange={handleInputChange}
                >
                  <option value="">Select Type</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                </Form.Select>
              </Form.Group>

              {formData.constructionType === 'Residential' && (
                <>
                  <Form.Group className="mb-3 form-group">
                    <Form.Label>Number of Floors:</Form.Label>
                    <Form.Control
                      type="number"
                      name="numFloors"
                      value={formData.numFloors}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                  {formData.numFloors > 0 && (
                    <Form.Group className="mb-3 form-group">
                      <Form.Label>Floor Details:</Form.Label>
                      {formData.floors.map((floor, index) => (
                        <div key={index} className="border p-3 mt-2 rounded">
                          <h5 className="font-medium">Floor {floor.floorNumber}</h5>
                          <Form.Label>Number of Apartments:</Form.Label>
                          <Form.Control
                            type="number"
                            value={floor.numApartments}
                            onChange={(e) =>
                              handleFloorInputChange(index, 'numApartments', parseInt(e.target.value) || 0)
                            }
                          />
                          <Form.Label>Apartment Types:</Form.Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {['1BHK', '2BHK', '3BHK'].map((type) => (
                              <Form.Check
                                key={type}
                                type="checkbox"
                                label={type}
                                checked={floor.apartmentTypes.includes(type)}
                                onChange={() => handleApartmentTypeChange(index, type)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                      {formData.floors.length < formData.numFloors && (
                        <Button
                          variant="link"
                          onClick={handleAddFloor}
                          className="mt-2 text-blue-600 hover:underline"
                        >
                          Add Floor
                        </Button>
                      )}
                    </Form.Group>
                  )}
                </>
              )}

              <h4 className="mt-4 font-medium">Phases</h4>
              {Object.entries(formData.phases).map(([phase, { enabled, percentage }]) => (
                <Form.Group className="mb-3 form-group" key={phase}>
                  <Form.Check
                    type="checkbox"
                    label={
                      phase === 'LandPreConstruction' ? 'Land & Pre-construction Phase' :
                      phase === 'FoundationStructural' ? 'Foundation & Structural Construction' :
                      phase === 'Superstructure' ? 'Superstructure Construction' :
                      phase === 'InternalExternal' ? 'Internal & External' :
                      phase === 'FinalInstallations' ? 'Final Installations' :
                      phase === 'TestingQuality' ? 'Testing & Quality' :
                      'Handover & Completion'
                    }
                    checked={enabled}
                    onChange={(e) => handleInputChange(e)}
                    name={`${phase}.enabled`}
                  />
                  <Form.Control
                    type="number"
                    placeholder="%"
                    value={percentage}
                    onChange={handlePhasePercentageChange}
                    name={`${phase}.percentage`}
                    className="mt-2 w-20"
                    disabled={!enabled}
                    min="0"
                    max="100"
                  />
                </Form.Group>
              ))}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveProject}>
              Save Project
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Embedded CSS for Modal Styling */}
        <style>
          {`
            /* Custom styles for BuilderDashboard Modal */
            .custom-modal .modal-content {
              border-radius: 8px;
              box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.2);
            }

            .custom-modal .modal-header {
              border-bottom: 1px solid #e5e5e5;
            }

            .custom-modal .modal-footer {
              border-top: 1px solid #e5e5e5;
              display: flex;
              justify-content: flex-end;
              gap: 10px;
            }

            .custom-modal .modal-title {
              font-size: 1.25rem;
              font-weight: bold;
            }

            .custom-modal .form-group {
              margin-bottom: 15px;
              text-align: left;
            }

            .custom-modal .form-label {
              font-weight: bold;
              margin-bottom: 5px;
              text-align: left;
            }

            .custom-modal .form-control,
            .custom-modal .form-select {
              width: 100%;
              padding: 8px;
              margin-top: 5px;
              border: 1px solid #ccc;
              border-radius: 5px;
            }

            .custom-modal .phase-group {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }

            .custom-modal .phase-checkbox {
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .custom-modal .phase-checkbox input[type="checkbox"] {
              margin: 0;
            }

            .custom-modal .phase-checkbox label {
              margin: 0;
              font-weight: normal;
            }

            .custom-modal .phase-percentage-input {
              width: 60px;
              padding: 6px;
              border: 1px solid #ccc;
              border-radius: 5px;
            }

            .custom-modal .btn-secondary {
              background-color: #6c757d;
              border-color: #6c757d;
              padding: 8px 16px;
              border-radius: 5px;
            }

            .custom-modal .btn-primary {
              background-color: #007bff;
              border-color: #007bff;
              padding: 8px 16px;
              border-radius: 5px;
            }
          `}
        </style>
      </div>
    </div>
  );
};

// Dashboard components
const Overview = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">Active Projects</h3>
        <p className="text-3xl font-bold text-blue-600 mt-2">5</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">Pending Approvals</h3>
        <p className="text-3xl font-bold text-amber-500 mt-2">3</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900">Completed Projects</h3>
        <p className="text-3xl font-bold text-green-600 mt-2">12</p>
      </div>
    </div>
    
    <div className="mt-8 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="border-b pb-3 last:border-0">
            <p className="text-gray-800">Project update for Riverside Apartments</p>
            <p className="text-sm text-gray-500">2 hours ago</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SettingsPage = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
    <div className="bg-white rounded-lg shadow p-6">
      <form className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input 
                type="text" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                defaultValue="John Doe" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name</label>
              <input 
                type="text" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                defaultValue="Doe Construction LLC" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                defaultValue="john@example.com" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input 
                type="tel" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
                defaultValue="+1 (555) 000-0000" 
              />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input 
                type="password" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input 
                type="password" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input 
                type="password" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" 
              />
            </div>
          </div>
        </div>
        
        <div>
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
);

const Help = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-6">Help & Support</h2>
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900">How do I create a new project?</h4>
              <p className="text-gray-600 mt-1">Click on the "New Project" button in the Projects section and fill out the required information.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">How can I invite team members?</h4>
              <p className="text-gray-600 mt-1">Go to the Project details page and click on "Team" tab, then use the "Invite Member" button.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">How do I update project status?</h4>
              <p className="text-gray-600 mt-1">Open the project, go to "Details" tab, and use the status dropdown to change the current status.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Can I export project data?</h4>
              <p className="text-gray-600 mt-1">Yes, on any project page, look for the "Export" button in the top-right corner.</p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Support</h3>
          <p className="text-gray-600 mb-4">Need more help? Our support team is available 24/7.</p>
          <div className="space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
              Email Support
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
              Live Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default BuilderDashboard;