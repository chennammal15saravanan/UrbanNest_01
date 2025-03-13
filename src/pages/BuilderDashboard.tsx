import React, { useState } from 'react';
import { useNavigate, Routes, Route, useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import Projects from './Projects';
import ProjectDetails from './ProjectDetails';
import EditProject from './EditProject';
import Finance from './Finance';

// Initialize Supabase client
const supabaseUrl = 'https://mddprsymtcgvybenatwg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHByc3ltdGNndnliZW5hdHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwOTY5MzQsImV4cCI6MjA1NjY3MjkzNH0.hawSQGzxjV0bKG7PqP6BmpJtLmW89BSsj8AeButHrGQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const BuilderDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    projectName: '',
    startDate: '',
    endDate: '',
    totalSqFeet: '',
    constructionType: '',
    numFloors: 0,
    floors: [] as Array<{ floorNumber: number; numApartments: number; apartmentTypes: string[] }>,
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
        landPreConstruction: { enabled: true, percentage: '0' },
        foundationStructural: { enabled: true, percentage: '0' },
        superstructure: { enabled: true, percentage: '0' },
        internalExternal: { enabled: true, percentage: '0' },
        finalInstallations: { enabled: true, percentage: '0' },
        testingQuality: { enabled: true, percentage: '0' },
        handoverCompletion: { enabled: true, percentage: '0' },
      },
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        phase_name: phase === 'landPreConstruction' ? 'Land & Pre-Construction' :
                    phase === 'foundationStructural' ? 'Foundation & Structural Construction' :
                    phase === 'superstructure' ? 'Superstructure Construction' :
                    phase === 'internalExternal' ? 'Internal & External' :
                    phase === 'finalInstallations' ? 'Final Installations' :
                    phase === 'testingQuality' ? 'Testing & Quality' :
                    'Handover & Completion',
        enabled,
        percentage: percentage ? parseInt(percentage) : 0,
        items: phase === 'landPreConstruction' ? [
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
      handleCloseModal();
      navigate('/builder/dashboard/projects');
    } catch (error) {
      console.error('Error saving project:', error);
      setError(`Failed to save project: ${(error as Error).message || 'An unknown error occurred'}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-6">UrbanNest</h1>
        <ul>
          <li className="mb-4">
            <button onClick={() => navigate('/builder/dashboard')} className="text-lg hover:underline">
              Dashboard
            </button>
          </li>
          <li className="mb-4">
            <button onClick={() => navigate('/builder/dashboard/projects')} className="text-lg hover:underline">
              Projects
            </button>
          </li>
          <li className="mb-4">
            <button onClick={() => navigate('/builder/dashboard/finance')} className="text-lg hover:underline">
              Finance
            </button>
          </li>
          <li className="mb-4">
            <button className="text-lg hover:underline">Analytics</button>
          </li>
          <li className="mb-4">
            <button className="text-lg hover:underline">Clients</button>
          </li>
          <li className="mb-4">
            <button className="text-lg hover:underline">Schedule</button>
          </li>
          <li className="mb-4">
            <button className="text-lg hover:underline">Settings</button>
          </li>
          <li className="mb-4">
            <button className="text-lg hover:underline">Help & Support</button>
          </li>
          <li className="mb-4">
            <button className="text-lg hover:underline">Sign Out</button>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Dashboard Overview</h2>
                  <button
                    onClick={handleOpenModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    + New Project
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium">Active Projects</h3>
                    <p className="text-3xl font-bold">5</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium">Pending Applications</h3>
                    <p className="text-3xl font-bold">3</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium">Completed Projects</h3>
                    <p className="text-3xl font-bold">12</p>
                  </div>
                </div>
                <div className="mt-6 bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium">Recent Activity</h3>
                  <ul className="mt-2">
                    <li className="text-gray-600">Project update for Riverside Apartments - 2 hours ago</li>
                    <li className="text-gray-600">Project update for Riverside Apartments - 2 hours ago</li>
                    <li className="text-gray-600">Project update for Riverside Apartments - 2 hours ago</li>
                    <li className="text-gray-600">Project update for Riverside Apartments - 2 hours ago</li>
                  </ul>
                </div>
              </div>
            }
          />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/projects/edit/:id" element={<EditProject />} />
          <Route path="/finance" element={<Finance />} />
        </Routes>
      </div>

      {/* Modal for New Project */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-6 text-start">Create New Project</h3>
            {error && <p className="text-danger mb-4 text-start">{error}</p>}
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4">
              <div className="mb-3">
                <label className="form-label block text-sm font-medium text-gray-700 text-start">Project Name</label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="form-control mt-1 p-2 w-full border rounded-md"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label block text-sm font-medium text-gray-700 text-start">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="form-control mt-1 p-2 w-full border rounded-md"
                />
              </div>
              <div className="mb-3">
                <label className="form-label block text-sm font-medium text-gray-700 text-start">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="form-control mt-1 p-2 w-full border rounded-md"
                />
              </div>
              <div className="mb-3">
                <label className="form-label block text-sm font-medium text-gray-700 text-start">Total Sq. Feet</label>
                <input
                  type="number"
                  name="totalSqFeet"
                  value={formData.totalSqFeet}
                  onChange={handleInputChange}
                  className="form-control mt-1 p-2 w-full border rounded-md"
                />
              </div>
              <div className="mb-3">
                <label className="form-label block text-sm font-medium text-gray-700 text-start">Construction Type</label>
                <select
                  name="constructionType"
                  value={formData.constructionType}
                  onChange={handleInputChange}
                  className="form-control mt-1 p-2 w-full border rounded-md"
                >
                  <option value="">Select Type</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>
              {formData.constructionType === 'Residential' && (
                <>
                  <div className="mb-3">
                    <label className="form-label block text-sm font-medium text-gray-700 text-start">Number of Floors</label>
                    <input
                      type="number"
                      name="numFloors"
                      value={formData.numFloors}
                      onChange={handleInputChange}
                      className="form-control mt-1 p-2 w-full border rounded-md"
                    />
                  </div>
                  {formData.numFloors > 0 && (
                    <div className="mb-3">
                      <label className="form-label block text-sm font-medium text-gray-700 text-start">Floor Details</label>
                      {formData.floors.map((floor, index) => (
                        <div key={index} className="mb-2 p-2 border rounded-md">
                          <p className="text-start">Floor {floor.floorNumber}</p>
                          <div className="mb-2">
                            <label className="form-label block text-sm font-medium text-gray-700 text-start">Number of Apartments</label>
                            <input
                              type="number"
                              value={floor.numApartments}
                              onChange={(e) => handleFloorInputChange(index, 'numApartments', parseInt(e.target.value) || 0)}
                              className="form-control mt-1 p-2 w-full border rounded-md"
                            />
                          </div>
                          <div>
                            <label className="form-label block text-sm font-medium text-gray-700 text-start">Apartment Types</label>
                            <div className="d-flex gap-2">
                              {['1BHK', '2BHK', '3BHK'].map((type) => (
                                <label key={type} className="d-flex align-items-center">
                                  <input
                                    type="checkbox"
                                    checked={floor.apartmentTypes.includes(type)}
                                    onChange={() => handleApartmentTypeChange(index, type)}
                                    className="me-1"
                                  />
                                  {type}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                      {formData.floors.length < formData.numFloors && (
                        <button
                          onClick={handleAddFloor}
                          className="mt-2 text-blue-600 hover:underline text-start"
                        >
                          Add Floor
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
              <div className="mb-3">
                <label className="form-label block text-sm font-medium text-gray-700 text-start">Estimated Cost (INR)</label>
                <input
                  type="number"
                  name="estimatedCost"
                  value={formData.estimatedCost}
                  onChange={handleInputChange}
                  className="form-control mt-1 p-2 w-full border rounded-md"
                />
              </div>
              <div className="mb-3">
                <label className="form-label block text-sm font-medium text-gray-700 text-start">Phases</label>
                {Object.entries(formData.phases).map(([phase, { enabled, percentage }]) => (
                  <div key={phase} className="d-flex align-items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      name={`${phase}.enabled`}
                      checked={enabled}
                      onChange={handleInputChange}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-start">{phase.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <input
                      type="number"
                      name={`${phase}.percentage`}
                      value={percentage}
                      onChange={handlePhasePercentageChange}
                      className="form-control p-1 w-25 border rounded-md"
                      disabled={!enabled}
                      min="0"
                      max="100"
                    />
                    <span>%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                onClick={handleCloseModal}
                className="btn btn-secondary px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProject}
                className="btn btn-primary px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuilderDashboard;