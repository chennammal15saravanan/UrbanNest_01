import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button, Tabs, Tab } from 'react-bootstrap';
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
  originalFileName: string;
  status: string;
  completion: string;
  comments: string;
}

// Shorten file name function
const shortenFileName = (fileName: string, maxLength = 15) => {
  if (fileName.length <= maxLength) return fileName;
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.slice(0, -extension!.length - 1);
  return `${nameWithoutExt.slice(0, maxLength - 5 - extension!.length)}...${extension}`;
};

const ViewProject: React.FC = () => {
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

      const updatedPhases = { ...phases };
      updatedPhases[phaseName][index].attachment = '';
      updatedPhases[phaseName][index].originalFileName = '';
      setPhases(updatedPhases);

      await supabase
        .from('project_phases')
        .update({
          items: updatedPhases[phaseName].map((detail) => ({
            item: detail.item,
            cost: detail.cost ? parseInt(detail.cost) : null,
            attachment: detail.attachment || null,
            originalFileName: detail.originalFileName || null,
            status: detail.status || 'Pending',
            completion: detail.completion || '0',
            comments: detail.comments || null,
          })),
        })
        .eq('project_id', id)
        .eq('phase_name', phaseNameMapping[phaseName]);

      toast.success('File removed successfully!');
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error(`Failed to remove file: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  const handleDownloadPDF = async () => {
    if (!id) {
      toast.error('Project ID is missing');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('generateProjectPDF', {
        body: { id },
        responseType: 'blob',
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`PDF generation failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from PDF generation');
      }

      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.projectName || 'project'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(`Failed to download PDF: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  if (loading) return <div style={styles.loading}>Loading project...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>View Project: {formData.projectName}</h2>
      <div style={styles.card}>
        <div style={styles.form}>
          <p><strong>Project Name:</strong> {formData.projectName}</p>
          <p><strong>Start Date:</strong> {formData.startDate || 'N/A'}</p>
          <p><strong>End Date:</strong> {formData.endDate || 'N/A'}</p>
          <p><strong>Total Square Feet:</strong> {formData.totalSquareFeet || 'N/A'}</p>
          <p><strong>Construction Type:</strong> {formData.constructionType}</p>
          {formData.constructionType === 'Residential' && (
            <>
              <p><strong>Number of Floors:</strong> {formData.numFloors}</p>
              {formData.floors.map((floor) => (
                <div key={floor.floorNumber} style={styles.floorCard}>
                  <h5>Floor {floor.floorNumber}</h5>
                  <p><strong>Number of Apartments:</strong> {floor.numApartments}</p>
                  <p><strong>Apartment Types:</strong> {floor.apartmentTypes.join(', ') || 'None'}</p>
                </div>
              ))}
            </>
          )}

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
                  onRemoveFile={canEdit ? handleRemoveFile : undefined}
                />
              </Tab>
            ))}
          </Tabs>

          <div style={styles.totalCost}>
            <h4 style={styles.totalCostHeader}>Total Project Cost: ₹{totalCost.toLocaleString()}</h4>
          </div>

          <Button variant="primary" onClick={() => navigate('/builder/dashboard/projects')}>
            Back to Projects
          </Button>
          {canEdit && (
            <Button
              variant="secondary"
              style={{ marginLeft: '10px' }}
              onClick={() => navigate(`/builder/dashboard/projects/edit/${id}`)}
            >
              Edit Project
            </Button>
          )}
          <Button
            variant="success"
            style={{ marginLeft: '10px' }}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

const PhaseTable: React.FC<{
  phaseName: string;
  phaseDetails: PhaseDetail[];
  onRemoveFile?: (phaseName: string, index: number) => void;
}> = ({ phaseName, phaseDetails, onRemoveFile }) => {
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
              <td style={styles.tableCell}>{detail.item}</td>
              <td style={styles.tableCell}>{detail.cost || '0'}</td>
              <td style={styles.tableCell}>
                {detail.attachment ? (
                  <div>
                    <a
                      href={detail.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#007bff', textDecoration: 'underline' }}
                    >
                      {shortenFileName(detail.originalFileName)}
                    </a>
                    {onRemoveFile && (
                      <Button
                        variant="link"
                        style={{ color: 'red', marginLeft: '10px' }}
                        onClick={() => onRemoveFile(phaseName, index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ) : (
                  'No attachment'
                )}
              </td>
              <td style={styles.tableCell}>{detail.status || 'Pending'}</td>
              <td style={styles.tableCell}>{detail.completion || '0'}%</td>
              <td style={styles.tableCell}>{detail.comments || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Inline styles
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
  totalCostHeader: { fontSize: '18px', fontWeight: 500, textAlign: 'left' },
  loading: { padding: '24px', textAlign: 'left' },
  error: { padding: '24px', color: '#dc3545', textAlign: 'left' },
};

export default ViewProject;