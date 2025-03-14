import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase"; // Assuming you have this set up
import "./FinanceEntryPage.css";

interface FinanceEntry {
  project: string;
  phase: string;
  item: string;
  amount: number;
  date: string;
  entryBy: string;
  comments: string;
}

interface Project {
  id: string;
  project_name: string;
}

const Finance = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]); // State to store projects
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const [formData, setFormData] = useState({
    project: "",
    phase: "",
    item: "",
    amount: "",
    date: "",
    entryBy: "",
    comments: "",
  });

  // Define the fixed order of phases (same as EditProject and ViewProject)
  const phaseOrder = [
    "landPreConstruction",
    "foundationStructural",
    "superstructure",
    "internalExternal",
    "finalInstallations",
    "testingQuality",
    "handoverCompletion",
  ];

  // Define phase name mapping (same as EditProject and ViewProject)
  const phaseNameMapping: Record<string, string> = {
    landPreConstruction: "Land & Pre-Construction",
    foundationStructural: "Foundation & Structural Construction",
    superstructure: "Superstructure Construction",
    internalExternal: "Internal & External",
    finalInstallations: "Final Installations",
    testingQuality: "Testing & Quality",
    handoverCompletion: "Handover & Completion",
  };

  // Define default sub-phases (same as EditProject and ViewProject)
  const phaseItems: Record<string, string[]> = {
    "Land & Pre-Construction": [
      "Legal Documentation",
      "Title Deed Verification",
      "Government Approvals & Permits",
      "Geotechnical Soil Report",
      "Site Survey (Topography & Mapping)",
      "Floor Plans & Site Layouts",
      "Structural Engineering Plans",
      "Environmental Clearance",
      "Municipality Approvals (Building Permit)",
      "Fire & Safety Approval",
      "Electricity & Water Supply Sanctions",
      "Project Cost Estimation & Budgeting",
      "Contractor Bidding & Tendering",
      "Material & Labor Cost Estimation",
      "Land Leveling & Clearing",
      "Temporary Site Office Setup",
      "Demolition of Existing Structures",
    ],
    "Foundation & Structural Construction": [
      "Digging & Grading the Site",
      "Soil Treatment for Pests & Waterproofing",
      "Footings & Pile Foundation",
      "Concrete Slabs & Columns",
      "Reinforced Concrete Plinth",
      "Waterproofing & Curing",
    ],
    "Superstructure Construction": [
      "RCC (Reinforced Concrete Columns & Beams)",
      "Slab Construction for Each Floor",
      "Exterior & Interior Wall Masonry",
      "Partition Walls in Apartments",
      "Casting of Roof Slabs",
      "Waterproofing the Roof",
    ],
    "Internal & External": [
      "Underground Plumbing & Drainage",
      "Electrical Wiring & Ducting Installation",
      "Air Conditioning & Ventilation Systems",
      "Fire Safety Sprinklers & Smoke Detectors",
      "Interior Wall Plastering",
      "Exterior Wall Rendering",
      "Main Door, Balcony Doors",
      "Window Fittings",
      "Marble, Tiles, or Wooden Flooring",
      "Bathroom & Kitchen Tiling",
      "Primer & Painting (Interior & Exterior)",
      "Textured Finishing for Facade",
    ],
    "Final Installations": [
      "POP False Ceilings & LED Lighting Setup",
      "Kitchen & Bathroom Cabinets",
      "Wardrobes & Storage Units",
      "Sink, Faucets, Shower, Toilet Installation",
      "Drainage & Sewage Connectivity",
      "Switchboards, Light Fixtures",
      "Smart Home Automation (if applicable)",
    ],
    "Testing & Quality": [
      "Bathroom, Kitchen, and Roof Checks",
      "Load Testing for Electrical Systems",
      "Fire Alarm & Safety Compliance Check",
      "Fixing Minor Issues Before Handover",
    ],
    "Handover & Completion": [
      "Builder Walkthrough with Buyer",
      "Final Approval from Authorities",
      "Keys Given to Buyer",
      "Documentation (Occupancy Certificate, Warranty Papers, etc.)",
      "6-Months to 1-Year Maintenance Period",
    ],
  };

  // Fetch projects from the database when the component mounts
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

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const updateItems = () => {
    return formData.phase ? phaseItems[formData.phase] || [] : [];
  };

  const saveFinanceEntry = () => {
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
      entryBy,
      comments: formData.comments,
    };

    setFinanceEntries((prev) => [...prev, newEntry]);
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
  };

  return (
    <div>
      <h1>Construction Finance Tracking</h1>
      <button className="open-modal-btn" onClick={openModal}>
        Add Finance Entry
      </button>

      {isModalOpen && (
        <div className="modal-overlay" style={{ display: "block" }}>
          <div className="modal-box">
            <button className="close-btn" onClick={closeModal}>
              X
            </button>
            <h2>Finance Entry</h2>

            {loading && <p>Loading projects...</p>}
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
              {phaseOrder.map((phaseKey) => (
                <option key={phaseKey} value={phaseNameMapping[phaseKey]}>
                  {phaseNameMapping[phaseKey]}
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
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={handleInputChange}
            />

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

      {financeEntries.length > 0 && (
        <div id="financeTableContainer" style={{ display: "block" }}>
          <h2>Finance Entries</h2>
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
              {financeEntries.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.project}</td>
                  <td>{entry.phase}</td>
                  <td>{entry.item}</td>
                  <td>{entry.amount}</td>
                  <td>{entry.date}</td>
                  <td>{entry.entryBy}</td>
                  <td>{entry.comments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Finance;