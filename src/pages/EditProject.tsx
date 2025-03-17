import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button, Tabs, Tab, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

// Interfaces
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
  item: string;
  cost: string;
  attachment: string;
  originalFileName: string; // Original file name as uploaded
  status: string;
  completion: string;
  comments: string;
}

const EditProject: React.FC = () => {
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
  const [totalCost, setTotalCost] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState<boolean>(false);

  const phaseNameMapping: Record<string, string> = {
    landPreConstruction: 'Land & Pre-Construction',
    foundationStructural: 'Foundation & Structural Construction',
    superstructure: 'Superstructure Construction',
    internalExternal: 'Internal & External Works',
    finalInstallations: 'Final Installations',
    testingQuality: 'Testing & Quality',
    handoverCompletion: 'Handover & Completion',
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) {
        setError('Project ID is missing');
        setLoading(false);
        return;
      }

      try {
        const { data: projectData, error: projectError } = await supabase
          .from('project_users')
          .select('*')
          .eq('id', id)
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

        const phaseMap: Record<string, PhaseDetail[]> = {};
        if (phaseData && phaseData.length > 0) {
          phaseData.forEach((phase: any) => {
            const phaseKey = Object.keys(phaseNameMapping).find(
              (key) => phaseNameMapping[key] === phase.phase_name
            );
            if (phaseKey && phase.items) {
              phaseMap[phaseKey] = phase.items.map((item: any) => ({
                item: item.item || '',
                cost: item.cost ? String(item.cost) : '',
                attachment: item.attachment || '',
                originalFileName: item.originalFileName || '',
                status: item.status || 'Pending',
                completion: item.completion ? String(item.completion) : '0',
                comments: item.comments || '',
              }));
            }
          });
        }

        setPhases((prev) => ({ ...prev, ...phaseMap }));
        setTotalCost(calculateTotalCost(phaseMap));

        const { data: { user } } = await supabase.auth.getUser();
        setCanEdit(!!user);
      } catch (error) {
        console.error('Error fetching project:', error);
        setError(`Failed to fetch project: ${(error as Error).message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const calculateTotalCost = (phaseData: Record<string, PhaseDetail[]>): number => {
    return Object.values(phaseData).reduce((total, phaseDetails) => {
      const phaseTotal = phaseDetails.reduce((sum, detail) => {
        const costValue = parseInt(detail.cost) || 0;
        return sum + costValue;
      }, 0);
      return total + phaseTotal;
    }, 0);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFloorChange = (index: number, field: string, value: string | number | string[]) => {
    setFormData((prev) => {
      const updatedFloors = [...prev.floors];
      (updatedFloors[index] as any)[field] = value;
      return { ...prev, floors: updatedFloors };
    });
  };

  const handlePhaseDetailChange = (
    phaseName: string,
    index: number,
    field: string,
    value: string | File | null
  ) => {
    setPhases((prev) => {
      const updatedPhases = { ...prev };
      updatedPhases[phaseName][index] = { ...updatedPhases[phaseName][index], [field]: value };
      return updatedPhases;
    });
    if (field === 'cost') {
      setTotalCost(calculateTotalCost(phases));
    }
  };

  const handleFileUpload = async (
    phaseName: string,
    index: number,
    file: File | null
  ) => {
    if (!file || !id) {
      toast.error('No file selected or project ID missing');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated. Please log in to upload files.');
      }

      if (file.type !== 'application/pdf') {
        throw new Error('Only PDF files are allowed');
      }
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      const uniqueFileName = `${id}/${phaseName}/${Date.now()}_${file.name}`; // Unique file name to avoid conflicts
      console.log('Uploading file to:', uniqueFileName);

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(uniqueFileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data } = supabase.storage.from('project-files').getPublicUrl(uniqueFileName);
      const fileUrl = data.publicUrl;
      console.log('File URL:', fileUrl);

      // Update phase detail with both attachment URL and original file name
      handlePhaseDetailChange(phaseName, index, 'attachment', fileUrl);
      handlePhaseDetailChange(phaseName, index, 'originalFileName', file.name);
      console.log('Updated phase detail:', phases[phaseName][index]); // Debugging log
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Failed to upload file: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  const handleRemoveFile = async (phaseName: string, index: number) => {
    if (!canEdit) {
      toast.error('You do not have permission to remove files');
      return;
    }

    const attachment = phases[phaseName][index].attachment;
    if (!attachment || !id) {
      toast.error('No file to remove or project ID missing');
      return;
    }

    try {
      const filePath = attachment.split('/project-files/')[1];
      const { error: deleteError } = await supabase.storage
        .from('project-files')
        .remove([filePath]);

      if (deleteError) {
        console.error('Remove error:', deleteError);
        throw new Error(`Remove failed: ${deleteError.message}`);
      }

      handlePhaseDetailChange(phaseName, index, 'attachment', '');
      handlePhaseDetailChange(phaseName, index, 'originalFileName', '');
      toast.success('File removed successfully!');
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error(`Failed to remove file: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  const handleSaveProject = async () => {
    try {
      if (!id) throw new Error('Project ID is missing');
      if (!formData.projectName.trim()) throw new Error('Project name is required');

      const { error: updateError } = await supabase
        .from('project_users')
        .update({
          project_name: formData.projectName,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          total_sq_feet: formData.totalSquareFeet ? parseInt(formData.totalSquareFeet) : null,
          construction_type: formData.constructionType || null,
          num_floors: formData.numFloors || null,
          estimated_cost: totalCost || null,
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
          attachment: detail.attachment || null, // Ensure attachment is saved
          originalFileName: detail.originalFileName || null, // Ensure originalFileName is saved
          status: detail.status || 'Pending',
          completion: detail.completion || '0',
          comments: detail.comments || null,
        })),
      }));

      const { error: phaseError } = await supabase.from('project_phases').insert(phaseInserts);
      if (phaseError) throw phaseError;

      toast.success('Project saved successfully!');
      navigate(`/builder/dashboard/projects/view/${id}`); // Navigate to View Project page
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(`Failed to update project: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  if (loading) return <div style={styles.loading}>Loading project...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Edit Project: {formData.projectName}</h2>
      <div style={styles.card}>
        <div style={styles.form}>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group controlId="projectName">
                  <Form.Label>Project Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleFormChange}
                    placeholder="Enter project name"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="startDate">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="endDate">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group controlId="totalSquareFeet">
                  <Form.Label>Total Square Feet</Form.Label>
                  <Form.Control
                    type="number"
                    name="totalSquareFeet"
                    value={formData.totalSquareFeet}
                    onChange={handleFormChange}
                    placeholder="Enter total square feet"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="constructionType">
                  <Form.Label>Construction Type</Form.Label>
                  <Form.Control
                    as="select"
                    name="constructionType"
                    value={formData.constructionType}
                    onChange={handleFormChange}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>
            {formData.constructionType === 'Residential' && (
              <Row>
                <Col md={12}>
                  <Form.Group controlId="numFloors">
                    <Form.Label>Number of Floors</Form.Label>
                    <Form.Control
                      type="number"
                      name="numFloors"
                      value={formData.numFloors}
                      onChange={handleFormChange}
                      min="0"
                    />
                  </Form.Group>
                </Col>
                {Array.from({ length: formData.numFloors }, (_, i) => i + 1).map((floorNum) => {
                  const floor = formData.floors.find((f) => f.floorNumber === floorNum) || {
                    floorNumber: floorNum,
                    numApartments: 0,
                    apartmentTypes: [],
                  };
                  return (
                    <Col md={12} key={floorNum} style={styles.floorCard}>
                      <h5>Floor {floorNum}</h5>
                      <Row>
                        <Col md={6}>
                          <Form.Group controlId={`numApartments-${floorNum}`}>
                            <Form.Label>Number of Apartments</Form.Label>
                            <Form.Control
                              type="number"
                              value={floor.numApartments}
                              onChange={(e) =>
                                handleFloorChange(floorNum - 1, 'numApartments', parseInt(e.target.value) || 0)
                              }
                              min="0"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group controlId={`apartmentTypes-${floorNum}`}>
                            <Form.Label>Apartment Types</Form.Label>
                            <Form.Control
                              type="text"
                              value={floor.apartmentTypes.join(', ')}
                              onChange={(e) =>
                                handleFloorChange(floorNum - 1, 'apartmentTypes', e.target.value.split(',').map((t) => t.trim()))
                              }
                              placeholder="e.g., 1BHK, 2BHK"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Form>

          <h4 style={styles.sectionHeader}>Phase Details</h4>
          <Tabs defaultActiveKey="landPreConstruction" id="phase-tabs" style={styles.tabs}>
            {Object.keys(phases).map((phaseKey) => (
              <Tab
                key={phaseKey}
                eventKey={phaseKey}
                title={`${Object.keys(phaseNameMapping).indexOf(phaseKey) + 1}. ${phaseNameMapping[phaseKey]}`}
              >
                <PhaseTable
                  phaseName={phaseKey}
                  phaseDetails={phases[phaseKey]}
                  onDetailChange={handlePhaseDetailChange}
                  onFileUpload={handleFileUpload}
                  onRemoveFile={canEdit ? handleRemoveFile : undefined}
                />
              </Tab>
            ))}
          </Tabs>

          <div style={styles.totalCost}>
            <h4 style={styles.totalCostHeader}>Total Project Cost: ₹{totalCost.toLocaleString()}</h4>
          </div>

          <Button variant="primary" onClick={handleSaveProject}>
            Save Changes
          </Button>
          <Button
            variant="secondary"
            style={{ marginLeft: '10px' }}
            onClick={() => navigate(`/builder/dashboard/projects/view/${id}`)}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

const PhaseTable: React.FC<{
  phaseName: string;
  phaseDetails: PhaseDetail[];
  onDetailChange: (phaseName: string, index: number, field: string, value: string | File | null) => void;
  onFileUpload: (phaseName: string, index: number, file: File | null) => void;
  onRemoveFile?: (phaseName: string, index: number) => void;
}> = ({ phaseName, phaseDetails, onDetailChange, onFileUpload, onRemoveFile }) => {
  const shortenFileName = (fileName: string, maxLength = 15) => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.slice(0, -extension!.length - 1);
    return `${nameWithoutExt.slice(0, maxLength - 5 - extension!.length)}...${extension}`;
  };

  return (
    <div style={styles.tableContainer}>
      <table className="table table-bordered" style={styles.table}>
        <thead>
          <tr>
            <th style={styles.tableCell}>Task</th>
            <th style={styles.tableCell}>Cost (INR)</th>
            <th style={styles.tableCell}>Attachment</th>
            <th style={styles.tableCell}>Status</th>
            <th style={styles.tableCell}>% Completion</th>
            <th style={styles.tableCell}>Comments</th>
          </tr>
        </thead>
        <tbody>
          {phaseDetails.map((detail, index) => (
            <tr key={index} style={styles.tableRow}>
              <td style={styles.tableCell}>
                <Form.Control
                  type="text"
                  value={detail.item}
                  onChange={(e) => onDetailChange(phaseName, index, 'item', e.target.value)}
                  placeholder="Enter task"
                />
              </td>
              <td style={styles.tableCell}>
                <Form.Control
                  type="number"
                  value={detail.cost || ''}
                  onChange={(e) => onDetailChange(phaseName, index, 'cost', e.target.value)}
                  placeholder="Enter cost"
                />
              </td>
              <td style={styles.tableCell}>
                <Form.Control
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    onFileUpload(phaseName, index, file);
                  }}
                />
                {detail.attachment && (
                  <div>
                    <a
                      href={detail.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#007bff', textDecoration: 'underline', marginRight: '10px' }}
                    >
                      {shortenFileName(detail.originalFileName || 'Unknown File')}
                    </a>
                    {onRemoveFile && (
                      <Button
                        variant="link"
                        style={{ color: 'red' }}
                        onClick={() => onRemoveFile(phaseName, index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                )}
              </td>
              <td style={styles.tableCell}>
                <Form.Control
                  as="select"
                  value={detail.status}
                  onChange={(e) => onDetailChange(phaseName, index, 'status', e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </Form.Control>
              </td>
              <td style={styles.tableCell}>
                <Form.Control
                  type="number"
                  value={detail.completion}
                  onChange={(e) => onDetailChange(phaseName, index, 'completion', e.target.value)}
                  min="0"
                  max="100"
                />
                %
              </td>
              <td style={styles.tableCell}>
                <Form.Control
                  type="text"
                  value={detail.comments || ''}
                  onChange={(e) => onDetailChange(phaseName, index, 'comments', e.target.value)}
                  placeholder="Enter comments"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Inline styles (unchanged)
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '24px', textAlign: 'left', width: '100%', margin: '0' },
  header: { fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'left' },
  card: {
    backgroundColor: '#fff',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #dee2e6',
  },
  form: { textAlign: 'left' },
  floorCard: { border: '1px solid #dee2e6', padding: '12px', marginTop: '8px', borderRadius: '4px', textAlign: 'left', width: '100%' },
  sectionHeader: { marginTop: '16px', marginBottom: '12px', fontSize: '20px', textAlign: 'left' },
  tabs: { marginBottom: '12px', textAlign: 'left', width: '100%' },
  tableContainer: { textAlign: 'left', overflowX: 'auto', width: '100%' },
  table: { width: '100%', textAlign: 'left' },
  tableRow: { borderBottom: '1px solid #dee2e6' },
  tableCell: { padding: '12px 16px', fontSize: '14px', color: '#333', textAlign: 'left' },
  totalCost: { marginTop: '16px', textAlign: 'left' },
  totalCostHeader: { fontSize: '18px', fontWeight: '500', textAlign: 'left' },
  loading: { padding: '24px', textAlign: 'left' },
  error: { padding: '24px', color: '#dc3545', textAlign: 'left' },
};

export default EditProject;