// src/constants/phases.ts
export const phaseDefinitions = {
    landPreConstruction: {
      name: 'Land & Pre-Construction',
      subphases: [
        { item: 'Legal Documentation', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Title Deed Verification', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Government Approvals & Permits', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Soil Testing & Surveying', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Geotechnical Soil Report', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Site Survey (Topography & Mapping)', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Architectural & Structural Planning', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Floor Plans & Site Layouts', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Structural Engineering Plans', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Government Approvals & Permits', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Environmental Clearance', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Municipality Approvals (Building Permit)', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Fire & Safety Approval', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Electricity & Water Supply Sanctions', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Project Cost Estimation & Budgeting', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Contractor Bidding & Tendering', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Material & Labor Cost Estimation', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Site Preparation & Demolition (if required)', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Land Leveling & Clearing', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Temporary Site Office Setup', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Demolition of Existing Structures', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
      ],
    },
    foundationStructural: {
      name: 'Foundation & Structural',
      subphases: [
        { item: 'Excavation & Groundwork', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Digging & Grading the Site', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Soil Treatment for Pests & Waterproofing', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Foundation Laying', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Footings & Pile Foundation', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Concrete Slabs & Columns', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Plinth Beam & Slab Work', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Reinforced Concrete Plinth', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Waterproofing & Curing', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
      ],
    },
    superstructure: {
      name: 'Superstructure',
      subphases: [
        { item: 'Structural Framing (Columns, Beams, Slabs)', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'RCC (Reinforced Concrete Columns & Beams)', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Slab Construction for Each Floor', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Brickwork & Walls Construction', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Exterior & Interior Wall Masonry', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Partition Walls in Apartments', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Roof Slab Construction', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Casting of Roof Slabs', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Waterproofing the Roof', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
      ],
    },
    internalExternal: {
      name: 'Internal & External Works',
      subphases: [
        { item: 'Plumbing & Electrical Rough-In', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Underground Plumbing & Drainage', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Electrical Wiring & Ducting Installation', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'HVAC & Fire Safety Installation', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Air Conditioning & Ventilation Systems', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Fire Safety Sprinklers & Smoke Detectors', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Plastering & Wall Finishing', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Interior Wall Plastering', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Exterior Wall Rendering', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Windows & Doors Installation', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Main Door, Balcony Doors', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Window Fittings', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Flooring & Tile Work', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Marble, Tiles, or Wooden Flooring', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Bathroom & Kitchen Tiling', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Painting & Exterior Finishing', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Primer & Painting (Interior & Exterior)', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Textured Finishing for Facade', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
      ],
    },
    finalInstallations: {
      name: 'Final Installations',
      subphases: [
        { item: 'False Ceiling & Decorative Work', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'POP False Ceilings & LED Lighting Setup', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Cabinetry & Fixtures Installation', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Kitchen & Bathroom Cabinets', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Wardrobes & Storage Units', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Sanitary Fittings & Plumbing Completion', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Sink, Faucets, Shower, Toilet Installation', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Drainage & Sewage Connectivity', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Final Electrical Fittings', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Switchboards, Light Fixtures', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Smart Home Automation (if applicable)', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
      ],
    },
    testingQuality: {
      name: 'Testing & Quality',
      subphases: [
        { item: 'Waterproofing & Leakage Tests', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Bathroom, Kitchen, and Roof Checks', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Electrical & Fire Safety Testing', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Load Testing for Electrical Systems', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Fire Alarm & Safety Compliance Check', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Snag List & Final Touch-Ups', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Fixing Minor Issues Before Handover', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
      ],
    },
    handoverCompletion: {
      name: 'Handover',
      subphases: [
        { item: 'Final Inspection & Walkthrough', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Builder Walkthrough with Buyer', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Final Approval from Authorities', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Handover of Property', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Keys Given to Buyer', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Documentation (Occupancy Certificate, Warranty Papers, etc.)', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: 'Post-Handover Support & Maintenance', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
        { item: '6-Months to 1-Year Maintenance Period', cost: null, attachment: null, status: 'Pending', completion: '', comments: '' },
      ],
    },
  };