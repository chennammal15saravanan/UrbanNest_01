import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase"; // Assuming you have this set up
import "./FinanceEntryPage.css";

interface FinanceEntry {
  id?: string;
  project: string;
  phase: string;
  item: string;
  amount: number;
  date: string;
  entry_by: string; // Changed to match your database column name
  comments: string;
}

interface Project {
  id: string;
  project_name: string;
}

const Finance: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    project: string;
    phase: string;
    item: string;
    amount: string;
    date: string;
    entryBy: string;
    comments: string;
  }>({
    project: "",
    phase: "",
    item: "",
    amount: "",
    date: "",
    entryBy: "",
    comments: "",
  });

  const phaseItems: { [key: string]: string[] } = {
    "Land & Pre-Construction": [
      "Land Acquisition & Verification",
      "Soil Testing & Surveying",
      "Architectural & Structural Planning",
      "Government Approvals & Permits",
      "Project Cost Estimation & Budgeting",
      "Site Preparation & Demolition",
    ],
    "Foundation & Structural Construction": [
      "Excavation & Groundwork",
      "Foundation Laying",
      "Plinth Beam & Slab Work",
    ],
    "Superstructure Construction": [
      "Structural Framing (Columns, Beams, Slabs)",
      "Brickwork & Walls Construction",
      "Roof Slab Construction",
    ],
    "Internal & External Works": [
      "Plumbing & Electrical Rough-In",
      "HVAC & Fire Safety Installation",
      "Plastering & Wall Finishing",
      "Windows & Doors Installation",
      "Flooring & Tile Work",
      "Painting & Exterior Finishing",
    ],
    "Final Installations & Interior Work": [
      "False Ceiling & Decorative Work",
      "Cabinetry & Fixtures Installation",
      "Sanitary Fittings & Plumbing Completion",
      "Final Electrical Fittings",
    ],
    "Testing & Quality Checks": [
      "Waterproofing & Leakage Tests",
      "Electrical & Fire Safety Testing",
      "Snag List & Final Touch-Ups",
    ],
    "Handover & Completion": [
      "Final Inspection & Walkthrough",
      "Handover of Property",
      "Post-Handover Support & Maintenance",
    ],
  };

  // Fetch projects from the project_users table
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("project_users")
          .select("id, project_name");

        if (error) throw error;

        if (data) {
          setProjects(data);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError("Failed to fetch projects. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch finance entries from the finance_entries table
  useEffect(() => {
    const fetchFinanceEntries = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("finance_entries")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          const mappedEntries: FinanceEntry[] = data.map((entry: any) => ({
            id: entry.id,
            project: entry.project,
            phase: entry.phase,
            item: entry.item,
            amount: entry.amount,
            date: entry.date,
            entry_by: entry.entry_by, // Match the database column name
            comments: entry.comments,
          }));
          setFinanceEntries(mappedEntries);
        }
      } catch (error) {
        console.error("Error fetching finance entries:", error);
        setError("Failed to fetch finance entries. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceEntries();
  }, []);

  const openModal = (): void => setIsModalOpen(true);
  const closeModal = (): void => setIsModalOpen(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const updateItems = (): string[] => {
    return formData.phase ? phaseItems[formData.phase] || [] : [];
  };

  const saveFinanceEntry = async (): Promise<void> => {
    const { project, phase, item, amount, date, entryBy } = formData;
    if (!project || !phase || !item || !amount || !date || !entryBy) {
      alert("Please fill all required fields.");
      return;
    }

    const newEntry: FinanceEntry = {
      project,
      phase,
      item,
      amount: parseFloat(amount),
      date,
      entry_by: entryBy, // Match the database column name
      comments: formData.comments,
    };

    try {
      const { data, error } = await supabase
        .from("finance_entries")
        .insert([
          {
            project: newEntry.project,
            phase: newEntry.phase,
            item: newEntry.item,
            amount: newEntry.amount,
            date: newEntry.date,
            entry_by: newEntry.entry_by,
            comments: newEntry.comments,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        const insertedEntry: FinanceEntry = {
          id: data[0].id,
          project: data[0].project,
          phase: data[0].phase,
          item: data[0].item,
          amount: data[0].amount,
          date: data[0].date,
          entry_by: data[0].entry_by,
          comments: data[0].comments,
        };
        setFinanceEntries((prev) => [insertedEntry, ...prev]);
      }

      setFormData({
        project: "",
        phase: "",
        item: "",
        amount: "",
        date: "",
        entryBy: "",
        comments: "",
      });
      closeModal();
    } catch (error) {
      console.error("Error saving finance entry:", error);
      alert("Failed to save the finance entry. Please try again.");
    }
  };

  return (
    <div className="finance-page">
      <h1>Construction Finance Tracking</h1>
      <button className="open-modal-btn" onClick={openModal}>
        Add Finance Entry
      </button>

      <div id="financeTableContainer" style={{ display: "block" }}>
        <h2>Finance Entries</h2>
        {loading ? (
          <p>Loading finance entries...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <table className="finance-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Phase</th>
                <th>Item</th>
                <th>Amount (INR)</th>
                <th>Date</th>
                <th>Entry By</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {financeEntries.length > 0 ? (
                financeEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.project}</td>
                    <td>{entry.phase}</td>
                    <td>{entry.item}</td>
                    <td>{entry.amount}</td>
                    <td>{entry.date}</td>
                    <td>{entry.entry_by}</td>
                    <td>{entry.comments}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
                    No finance entries available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ display: "block" }}>
          <div className="modal-box">
            <button className="close-btn" onClick={closeModal}>
              X
            </button>
            <h2>Finance Entry</h2>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <label htmlFor="project">Select Project:</label>
            <select
              id="project"
              value={formData.project}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="">-- Select Project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.project_name}>
                  {project.project_name}
                </option>
              ))}
            </select>

            <label htmlFor="phase">Select Project Phase:</label>
            <select
              id="phase"
              value={formData.phase}
              onChange={(e) => {
                handleInputChange(e);
                setFormData((prev) => ({ ...prev, item: "" }));
              }}
            >
              <option value="">-- Select Phase --</option>
              {Object.keys(phaseItems).map((phase) => (
                <option key={phase} value={phase}>
                  {phase}
                </option>
              ))}
            </select>

            <label htmlFor="item">Select Item:</label>
            <select id="item" value={formData.item} onChange={handleInputChange}>
              <option value="">-- Select Item --</option>
              {updateItems().map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label htmlFor="amount">Amount (INR):</label>
            <input
              type="number"
              id="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Enter Amount"
            />

            <label htmlFor="date">Date:</label>
            <input type="date" id="date" value={formData.date} onChange={handleInputChange} />

            <label htmlFor="entryBy">Entry By:</label>
            <input
              type="text"
              id="entryBy"
              value={formData.entryBy}
              onChange={handleInputChange}
              placeholder="Enter Name"
            />

            <label htmlFor="comments">Comments:</label>
            <textarea
              id="comments"
              value={formData.comments}
              onChange={handleInputChange}
              placeholder="Additional Comments"
            />

            <div className="modal-buttons">
              <button className="save-btn" onClick={saveFinanceEntry}>
                Save
              </button>
              <button className="close-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;