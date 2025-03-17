import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';

const supabaseUrl = 'https://mddprsymtcgvybenatwg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZHByc3ltdGNndnliZW5hdHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwOTY5MzQsImV4cCI6MjA1NjY3MjkzNH0.hawSQGzxjV0bKG7PqP6BmpJtLmW89BSsj8AeButHrGQ';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Phase {
  id: number;
  project_id: number;
  phase_name: string;
  enabled: boolean;
  percentage: number;
  items: Array<{
    item: string;
    cost: number | null;
    attachment: string | null;
    status: string;
    completion: string;
    comments: string;
  }>;
}

interface Floor {
  id: number;
  project_id: number;
  floor_number: number;
  num_apartments: number;
  apartment_types: string[];
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
  created_at: string;
}

interface AuthContextUser {
  id: string;
  // Add other user properties as needed
}

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth() as { user: AuthContextUser | null }; // Ensure proper typing for useAuth
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('Land & Pre-Construction');

  useEffect(() => {
    const fetchProjectAndPhases = async () => {
      try {
        if (!user || !user.id || !id) {
          throw new Error('User not authenticated or project ID missing');
        }

        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('project_users')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (projectError) throw projectError;

        if (!projectData) throw new Error('Project not found');

        setProject(projectData as Project);

        // Fetch phases
        const { data: phasesData, error: phasesError } = await supabase
          .from('project_phases')
          .select('*')
          .eq('project_id', projectData.id);

        if (phasesError) throw phasesError;

        setPhases(phasesData || []);

        // Fetch floors
        const { data: floorsData, error: floorsError } = await supabase
          .from('project_floors')
          .select('*')
          .eq('project_id', projectData.id);

        if (floorsError) throw floorsError;

        setFloors(floorsData || []);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Failed to fetch project: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndPhases();
  }, [user, id]);

  const handlePhaseChange = (phaseName: string): void => {
    setCurrentPhase(phaseName);
  };

  if (loading) {
    return <div style={styles.loading}>Loading project details...</div>;
  }

  if (error || !project) {
    return <div style={styles.error}>{error || 'Project not found'}</div>;
  }

  const currentPhaseData = phases.find((phase) => phase.phase_name === currentPhase);
  const phaseItems = currentPhaseData?.items || [];

  return (
    <div style={styles.container}>
      {/* Project Overview */}
      <div style={styles.card}>
        <h2 style={styles.header}>{project.project_name}</h2>
        <div style={styles.projectDetails}>
          <p style={styles.detailText}><strong>Start Date:</strong> {project.start_date || 'Not set'}</p>
          <p style={styles.detailText}><strong>End Date:</strong> {project.end_date || 'Not set'}</p>
          <p style={styles.detailText}>
            <strong>Estimated Cost:</strong> {project.estimated_cost ? `₹${project.estimated_cost.toLocaleString()}` : 'Not set'}
          </p>
          <p style={styles.detailText}><strong>Construction Type:</strong> {project.construction_type || 'Not set'}</p>
          <p style={styles.detailText}>
            <strong>Total Sq. Feet:</strong> {project.total_sq_feet ? project.total_sq_feet.toLocaleString() : 'Not set'}
          </p>
          <p style={styles.detailText}><strong>Number of Floors:</strong> {project.num_floors || 'Not set'}</p>
        </div>
      </div>

      {/* Floor Details */}
      {floors.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.sectionHeader}>Floor Details</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.tableCell}>Floor Number</th>
                <th style={styles.tableCell}>Number of Apartments</th>
                <th style={styles.tableCell}>Apartment Types</th>
              </tr>
            </thead>
            <tbody>
              {floors.map((floor) => (
                <tr key={floor.id} style={styles.tableRow}>
                  <td style={styles.tableCell}>{floor.floor_number}</td>
                  <td style={styles.tableCell}>{floor.num_apartments || 'Not set'}</td>
                  <td style={styles.tableCell}>{floor.apartment_types?.join(', ') || 'Not set'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Phase Navigation Tabs */}
      <div style={styles.tabs}>
        {phases.map((phase, index) => (
          <button
            key={phase.id}
            style={{
              ...styles.tabButton,
              ...(phase.phase_name === currentPhase ? styles.activeTab : styles.inactiveTab),
            }}
            onClick={() => handlePhaseChange(phase.phase_name)}
          >
            {index + 1}. {phase.phase_name}
          </button>
        ))}
      </div>

      {/* Phase Details */}
      <div style={styles.card}>
        <h2 style={styles.sectionHeader}>
          {phases.findIndex((phase) => phase.phase_name === currentPhase) + 1}. {currentPhase} Phase
        </h2>
        <h3 style={styles.subSectionHeader}>
          {currentPhase === 'Land & Pre-Construction' ? 'a) Land Acquisition & Verification' : 'Details'}
        </h3>

        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.tableCell}>Item</th>
              <th style={styles.tableCell}>Cost (INR)</th>
              <th style={styles.tableCell}>Attachment</th>
              <th style={styles.tableCell}>Status</th>
              <th style={styles.tableCell}>% Completion</th>
              <th style={styles.tableCell}>Comments</th>
            </tr>
          </thead>
          <tbody>
            {phaseItems.map((item, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>{item.item}</td>
                <td style={styles.tableCell}>{item.cost ? `₹${item.cost.toLocaleString()}` : 'N/A'}</td>
                <td style={styles.tableCell}>
                  {item.attachment ? item.attachment : 'No file chosen'}
                </td>
                <td style={styles.tableCell}>{item.status || 'Pending'}</td>
                <td style={styles.tableCell}>{item.completion || '0'}</td>
                <td style={styles.tableCell}>{item.comments || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={styles.buttonGroup}>
          <button
            onClick={() => navigate('/builder/dashboard/projects')}
            style={styles.backButton}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

// Inline styles for left alignment and design consistency
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '24px',
    textAlign: 'left',
    width: '100%',
    margin: '0',
  },
  header: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
    textAlign: 'left',
    color: '#1f2937',
  },
  card: {
    backgroundColor: '#fff',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '24px',
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #dee2e6',
  },
  projectDetails: {
    display: 'block',
  },
  detailText: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '8px',
    textAlign: 'left',
  },
  sectionHeader: {
    fontSize: '20px',
    fontWeight: '500',
    marginBottom: '16px',
    textAlign: 'left',
    color: '#1f2937',
  },
  subSectionHeader: {
    fontSize: '16px',
    fontWeight: '500',
    marginBottom: '12px',
    textAlign: 'left',
    color: '#1f2937',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    color: '#333',
  },
  tableRow: {
    borderBottom: '1px solid #dee2e6',
  },
  tableCell: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#333',
    textAlign: 'left',
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '24px',
    overflowX: 'auto',
  },
  tabButton: {
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
    color: '#fff',
  },
  inactiveTab: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
  },
  buttonGroup: {
    marginTop: '16px',
    display: 'flex',
    gap: '16px',
    justifyContent: 'flex-start',
  },
  backButton: {
    backgroundColor: '#6b7280',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
  },
  loading: {
    padding: '24px',
    textAlign: 'left',
    color: '#6b7280',
  },
  error: {
    padding: '24px',
    color: '#dc3545',
    textAlign: 'left',
  },
};

export default ProjectDetails;