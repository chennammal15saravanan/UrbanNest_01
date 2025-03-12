import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const Finance = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
  const [formData, setFormData] = useState({
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

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
    setFormData({ project: "", phase: "", item: "", amount: "", date: "", entryBy: "", comments: "" });
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

            <label htmlFor="project">Select Project:</label>
            <select id="project" value={formData.project} onChange={handleInputChange}>
              <option value="">-- Select Project --</option>
              <option value="Project A">Project A</option>
              <option value="Project B">Project B</option>
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