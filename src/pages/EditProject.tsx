import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Assuming supabase is configured in a separate file
import { Modal, Button, Form, Tabs, Tab } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

interface FormData {
  projectName: string;
  startDate: string;
  endDate: string;
  totalSquareFeet: string;
  constructionType: string;
  numFloors: number;
  floors: { floorNumber: number; numApartments: number; apartmentTypes: string[] }[];
}

interface PhaseDetail {
  id?: string;
  item: string;
  cost: string;
  attachment: string;
  status: string;
  completion: string;
  comments: string;
}

const EditProject = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    projectName: '',
    startDate: '',
    endDate: '',
    totalSquareFeet: '',
    constructionType: 'Residential',
    numFloors: 0,
    floors: [],
  });
  const [phases, setPhases] = useState<Record<string, PhaseDetail[]>>({
    landPreConstruction: [],
    foundationStructural: [],
    superstructure: [],
    internalExternal: [],
    finalInstallations: [],
    testingQuality: [],
    handoverCompletion: [],
  });
  const [totalCost, setTotalCost] = useState<number>(0); // State to track total cost
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const phaseNameMapping: Record<string, string> = {
    landPreConstruction: 'Land & Pre-Construction',
    foundationStructural: 'Foundation & Structural Construction',
    superstructure: 'Superstructure Construction',
    internalExternal: 'Internal & External',
    finalInstallations: 'Final Installations',
    testingQuality: 'Testing & Quality',
    handoverCompletion: 'Handover & Completion',
  };

  useEffect(() => {
    const fetchProject = async () => {
      console.log('Fetching project with ID:', id);
      if (!id) {
        setError('Project ID is missing');
        setLoading(false);
        return;
      }

      try {
        // Fetch project data
        const { data: projectData, error: projectError } = await supabase
          .from('project_users')
          .select('*')
          .eq('id', id)
          .single();

        if (projectError) throw projectError;
        if (!projectData) throw new Error('Project not found');

        // Fetch floors data
        const { data: floorsData, error: floorsError } = await supabase
          .from('project_floors')
          .select('*')
          .eq('project_id', id);

        if (floorsError) throw floorsError;

        // Fetch phase data
        const { data: phaseData, error: phaseError } = await supabase
          .from('project_phases')
          .select('*')
          .eq('project_id', id);

        if (phaseError) throw phaseError;

        // Set basic form data
        setFormData({
          projectName: projectData.project_name || '',
          startDate: projectData.start_date || '',
          endDate: projectData.end_date || '',
          totalSquareFeet: projectData.total_sq_feet ? String(projectData.total_sq_feet) : '',
          constructionType: projectData.construction_type || 'Residential',
          numFloors: projectData.num_floors || 0,
          floors: floorsData?.map((floor: any) => ({
            floorNumber: floor.floor_number,
            numApartments: floor.num_apartments || 0,
            apartmentTypes: floor.apartment_types || [],
          })) || [],
        });

        // Initialize all seven phases with their default sub-phases
        const phaseMap: Record<string, PhaseDetail[]> = {
          landPreConstruction: defaultSubPhases.landPreConstruction.map((item) => ({
            item,
            cost: '',
            attachment: '',
            status: 'Pending',
            completion: '0',
            comments: '',
          })),
          foundationStructural: defaultSubPhases.foundationStructural.map((item) => ({
            item,
            cost: '',
            attachment: '',
            status: 'Pending',
            completion: '0',
            comments: '',
          })),
          superstructure: defaultSubPhases.superstructure.map((item) => ({
            item,
            cost: '',
            attachment: '',
            status: 'Pending',
            completion: '0',
            comments: '',
          })),
          internalExternal: defaultSubPhases.internalExternal.map((item) => ({
            item,
            cost: '',
            attachment: '',
            status: 'Pending',
            completion: '0',
            comments: '',
          })),
          finalInstallations: defaultSubPhases.finalInstallations.map((item) => ({
            item,
            cost: '',
            attachment: '',
            status: 'Pending',
            completion: '0',
            comments: '',
          })),
          testingQuality: defaultSubPhases.testingQuality.map((item) => ({
            item,
            cost: '',
            attachment: '',
            status: 'Pending',
            completion: '0',
            comments: '',
          })),
          handoverCompletion: defaultSubPhases.handoverCompletion.map((item) => ({
            item,
            cost: '',
            attachment: '',
            status: 'Pending',
            completion: '0',
            comments: '',
          })),
        };

        // Merge with fetched phase data, ensuring all sub-phases are preserved
        if (phaseData && phaseData.length > 0) {
          phaseData.forEach((phase: any) => {
            const phaseKey = Object.keys(phaseNameMapping).find(
              (key) => phaseNameMapping[key] === phase.phase_name
            );
            if (phaseKey && phase.items && phase.items.length > 0) {
              const savedItemsMap = new Map(
                phase.items.map((item: any) => [
                  item.item,
                  {
                    id: item.id,
                    item: item.item || '',
                    cost: item.cost ? String(item.cost) : '',
                    attachment: item.attachment || '',
                    status: item.status || 'Pending',
                    completion: item.completion ? String(item.completion) : '0',
                    comments: item.comments || '',
                  },
                ])
              );
              phaseMap[phaseKey] = defaultSubPhases[phaseKey as keyof typeof defaultSubPhases].map(
                (defaultItem) => savedItemsMap.get(defaultItem) || {
                  item: defaultItem,
                  cost: '',
                  attachment: '',
                  status: 'Pending',
                  completion: '0',
                  comments: '',
                }
              );
            }
          });
        }

        // Calculate initial total cost
        const initialTotalCost = calculateTotalCost(phaseMap);
        setTotalCost(initialTotalCost);

        console.log('Initialized Phase Map:', phaseMap); // Debugging
        setPhases(phaseMap);
      } catch (error) {
        console.error('Error fetching project:', error);
        setError(`Failed to fetch project: ${(error as Error).message || 'An unknown error occurred'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // Function to calculate total cost across all phases
  const calculateTotalCost = (phaseData: Record<string, PhaseDetail[]>): number => {
    return Object.values(phaseData).reduce((total, phaseDetails) => {
      const phaseTotal = phaseDetails.reduce((sum, detail) => {
        const costValue = parseInt(detail.cost) || 0;
        return sum + costValue;
      }, 0);
      return total + phaseTotal;
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFloorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numFloors = parseInt(e.target.value) || 0;
    setFormData((prev) => ({
      ...prev,
      numFloors,
      floors: Array.from({ length: numFloors }, (_, i) => ({
        floorNumber: i + 1,
        numApartments: prev.floors[i]?.numApartments || 0,
        apartmentTypes: prev.floors[i]?.apartmentTypes || [],
      })),
    }));
  };

  const handleApartmentChange = (floorIndex: number, field: string, value: any) => {
    setFormData((prev) => {
      const updatedFloors = [...prev.floors];
      if (field === 'apartmentTypes') {
        const currentTypes = updatedFloors[floorIndex].apartmentTypes || [];
        updatedFloors[floorIndex].apartmentTypes = currentTypes.includes(value)
          ? currentTypes.filter((type) => type !== value)
          : [...currentTypes, value];
      } else if (field === 'numApartments') {
        updatedFloors[floorIndex].numApartments = parseInt(value) || 0;
      }
      return { ...prev, floors: updatedFloors };
    });
  };

  const handlePhaseDetailChange = (
    phaseName: string,
    index: number,
    field: keyof PhaseDetail,
    value: string
  ) => {
    setPhases((prev) => {
      const updatedPhase = [...prev[phaseName]];
      updatedPhase[index] = { ...updatedPhase[index], [field]: value };
      const newPhases = { ...prev, [phaseName]: updatedPhase };
      // Recalculate total cost whenever a cost is changed
      if (field === 'cost') {
        const newTotalCost = calculateTotalCost(newPhases);
        setTotalCost(newTotalCost);
      }
      return newPhases;
    });
  };

  const handleSaveProject = async () => {
    try {
      if (!id) throw new Error('Project ID is missing');
      if (!formData.projectName.trim()) throw new Error('Project name is required');

      console.log('Saving project with data:', formData);

      const { error: updateError } = await supabase
        .from('project_users')
        .update({
          project_name: formData.projectName,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          total_sq_feet: formData.totalSquareFeet ? parseInt(formData.totalSquareFeet) : null,
          construction_type: formData.constructionType || null,
          num_floors: formData.numFloors || null,
          estimated_cost: totalCost || null, // Save the total cost to the project
        })
        .eq('id', id);

      if (updateError) throw updateError;

      await supabase.from('project_floors').delete().eq('project_id', id);
      if (formData.floors.length > 0) {
        const floorInserts = formData.floors.map((floor) => ({
          project_id: id,
          floor_number: floor.floorNumber,
          num_apartments: floor.numApartments || null,
          apartment_types: floor.apartmentTypes.length > 0 ? floor.apartmentTypes : null,
        }));
        const { error: floorError } = await supabase.from('project_floors').insert(floorInserts);
        if (floorError) throw floorError;
      }

      // Save all seven phases with their sub-phases
      await supabase.from('project_phases').delete().eq('project_id', id);
      const phaseInserts = Object.entries(phases).map(([phaseName, phaseDetails]) => ({
        project_id: id,
        phase_name: phaseNameMapping[phaseName],
        enabled: true,
        percentage: phaseDetails.length > 0
          ? Math.round(phaseDetails.reduce((acc, detail) => acc + (parseInt(detail.completion) || 0), 0) / phaseDetails.length)
          : 0,
        items: phaseDetails.map((detail) => ({
          item: detail.item,
          cost: detail.cost ? parseInt(detail.cost) : null,
          attachment: detail.attachment || null,
          status: detail.status || 'Pending',
          completion: detail.completion || '0',
          comments: detail.comments || null,
        })),
      }));

      console.log('Phase Inserts:', phaseInserts); // Debugging
      const { error: phaseError } = await supabase.from('project_phases').insert(phaseInserts);
      if (phaseError) {
        console.error('Phase insert error:', phaseError);
        throw phaseError;
      }

      console.log('Project saved successfully');
      navigate('/builder/dashboard/projects');
    } catch (error) {
      console.error('Error saving project:', error);
      setError(`Failed to update project: ${(error as Error).message || 'An unknown error occurred'}`);
    }
  };

  if (loading) return <div className="p-6">Loading project...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Edit Project: {formData.projectName || 'Loading...'}</h2>
      <div className="bg-white p-4 rounded-lg shadow">
        <Form>
          <Form.Group className="mb-3">
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

          <Form.Group className="mb-3">
            <Form.Label>Start Date:</Form.Label>
            <Form.Control
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>End Date:</Form.Label>
            <Form.Control
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Total Square Feet Planned:</Form.Label>
            <Form.Control
              type="number"
              name="totalSquareFeet"
              value={formData.totalSquareFeet}
              onChange={handleInputChange}
              placeholder="Enter total square feet"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Type of Construction:</Form.Label>
            <Form.Select
              name="constructionType"
              value={formData.constructionType}
              onChange={handleInputChange}
            >
              <option value="">Select</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
            </Form.Select>
          </Form.Group>

          {formData.constructionType === "Residential" && (
            <Form.Group className="mb-3">
              <Form.Label>Number of Floors:</Form.Label>
              <Form.Control
                type="number"
                name="numFloors"
                value={formData.numFloors}
                onChange={handleFloorChange}
              />
              {formData.floors.map((floor, index) => (
                <div key={index} className="border p-3 mt-2">
                  <h5>Floor {floor.floorNumber}</h5>
                  <Form.Label>Number of Apartments:</Form.Label>
                  <Form.Control
                    type="number"
                    value={floor.numApartments}
                    onChange={(e) => handleApartmentChange(index, "numApartments", e.target.value)}
                  />
                  <Form.Label>Apartment Types:</Form.Label>
                  <div className="flex flex-wrap gap-2">
                    {['1BHK', '2BHK', '3BHK'].map((type) => (
                      <Form.Check
                        key={type}
                        type="checkbox"
                        label={type}
                        checked={floor.apartmentTypes.includes(type)}
                        onChange={() => handleApartmentChange(index, "apartmentTypes", type)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </Form.Group>
          )}

          <h4 className="mt-4 mb-3">Phase Details</h4>
          <Tabs defaultActiveKey="landPreConstruction" id="phase-tabs" className="mb-3">
            <Tab eventKey="landPreConstruction" title="1. Land & Pre-Construction">
              <PhaseTable
                phaseName="landPreConstruction"
                phaseDetails={phases.landPreConstruction}
                onChange={handlePhaseDetailChange}
              />
            </Tab>
            <Tab eventKey="foundationStructural" title="2. Foundation & Structural">
              <PhaseTable
                phaseName="foundationStructural"
                phaseDetails={phases.foundationStructural}
                onChange={handlePhaseDetailChange}
              />
            </Tab>
            <Tab eventKey="superstructure" title="3. Superstructure">
              <PhaseTable
                phaseName="superstructure"
                phaseDetails={phases.superstructure}
                onChange={handlePhaseDetailChange}
              />
            </Tab>
            <Tab eventKey="internalExternal" title="4. Internal & External Works">
              <PhaseTable
                phaseName="internalExternal"
                phaseDetails={phases.internalExternal}
                onChange={handlePhaseDetailChange}
              />
            </Tab>
            <Tab eventKey="finalInstallations" title="5. Final Installations">
              <PhaseTable
                phaseName="finalInstallations"
                phaseDetails={phases.finalInstallations}
                onChange={handlePhaseDetailChange}
              />
            </Tab>
            <Tab eventKey="testingQuality" title="6. Testing & Quality">
              <PhaseTable
                phaseName="testingQuality"
                phaseDetails={phases.testingQuality}
                onChange={handlePhaseDetailChange}
              />
            </Tab>
            <Tab eventKey="handoverCompletion" title="7. Handover">
              <PhaseTable
                phaseName="handoverCompletion"
                phaseDetails={phases.handoverCompletion}
                onChange={handlePhaseDetailChange}
              />
            </Tab>
          </Tabs>

          {/* Display Total Cost */}
          <div className="mt-4">
            <h4 className="text-lg font-medium">Total Project Cost: ₹{totalCost.toLocaleString()}</h4>
          </div>

          <div className="mt-4 flex space-x-4">
            <Button variant="danger" onClick={() => navigate('/builder/dashboard/projects')}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleSaveProject}>
              Save Changes
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

const PhaseTable: React.FC<{
  phaseName: string;
  phaseDetails: PhaseDetail[];
  onChange: (phaseName: string, index: number, field: keyof PhaseDetail, value: string) => void;
}> = ({ phaseName, phaseDetails, onChange }) => {
  return (
    <div className="table-responsive">
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Item</th>
            <th>Cost (INR)</th>
            <th>Attachment</th>
            <th>Status</th>
            <th>% Completion</th>
            <th>Comments</th>
          </tr>
        </thead>
        <tbody>
          {phaseDetails.map((detail, index) => (
            <tr key={index}>
              <td>{detail.item}</td>
              <td>
                <Form.Control
                  type="number"
                  value={detail.cost}
                  onChange={(e) => onChange(phaseName, index, 'cost', e.target.value)}
                />
              </td>
              <td>
                <Form.Control
                  type="file"
                  onChange={(e: any) => onChange(phaseName, index, 'attachment', e.target.files[0]?.name || '')}
                />
                {detail.attachment && <span>{detail.attachment}</span>}
              </td>
              <td>
                <Form.Select
                  value={detail.status}
                  onChange={(e) => onChange(phaseName, index, 'status', e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </Form.Select>
              </td>
              <td>
                <Form.Control
                  type="number"
                  value={detail.completion}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 100)) {
                      onChange(phaseName, index, 'completion', value);
                    }
                  }}
                  min="0"
                  max="100"
                />
              </td>
              <td>
                <Form.Control
                  as="textarea"
                  value={detail.comments}
                  onChange={(e) => onChange(phaseName, index, 'comments', e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EditProject;