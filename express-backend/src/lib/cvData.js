'use strict'

/**
 * Asmare Belay Ngussie — real CV data (verified 2026-09-23).
 * Single source of truth for content seeding (src/scripts/seed-content.js),
 * mirroring backend/database/seeders/ProfileSeeder.php in the Laravel backend.
 * Skill levels are self-assessed — the CV does not state them.
 */

const PROFILE = {
  first_name: 'Asmare',
  last_name: 'Belay',
  display_name: 'Asmare Belay Ngussie',
  headline: 'Hydrology & Water Resources Engineer | Lecturer & Researcher',
  tagline:
    'Advancing sustainable water resources solutions and climate resilience through hydrological modeling, integrated water management, and geospatial analysis.',
  bio: 'Dedicated Hydrology and Water Resources Engineer and Researcher with over 6 years of academic and applied experience in hydrological modeling, integrated water management, and geospatial analysis. Expertise includes SWAT/SWAT+, HEC-HMS, HEC-RAS, MODFLOW, HydroGeoSphere, GEE, GIS, Remote Sensing, R and Python for climate impact assessment, flood forecasting, water storage evaluation, and watershed management.\n\nProven track record in leading research projects, securing competitive grants, publishing in international journals, and delivering capacity-building training for government and community stakeholders. Strong background in academic instruction, curriculum development, and institutional collaboration, with a passion for sustainable water resources solutions and climate resilience.',
  location: 'Kombolcha, Ethiopia',
  website: 'https://orcid.org/0000-0003-4016-9698',
  email_public: 'asmarebelay@kiot.edu.et',
  phone: '+251-918-600147',
  github: 'https://github.com/SebleMengistu',
  linkedin: 'https://linkedin.com/in/asmare-belay',
  twitter: null,
  whatsapp: null,
  roles: [
    'Hydrology & Water Resources Engineer',
    'Lecturer & Researcher',
    'Hydrological Modeler',
    'GIS & Remote Sensing Specialist',
  ],
  available_for_work: true,
  meta: {
    experience_years: 6,
    students_trained: 150,
    orcid: 'https://orcid.org/0000-0003-4016-9698',
    google_scholar: 'https://scholar.google.com/citations?user=NlBFEmwAAAAJ&hl=en',
    researchgate: null,
    current_organization: 'Kombolcha Institute of Technology, Wollo University',
    current_position: 'Lecturer and Researcher',
  },
}

// [name, category, level] — categories drive the grouped skills display.
const SKILLS = [
  // Hydrological & watershed modeling
  ['SWAT', 'modeling', 92],
  ['SWAT+', 'modeling', 90],
  ['HBV', 'modeling', 80],
  ['WMS (Watershed Modeling System)', 'modeling', 82],
  ['Gwflow', 'modeling', 78],
  ['Flood Forecasting & Analysis', 'modeling', 85],
  ['Watershed Management', 'modeling', 88],
  // Hydraulic & river modeling
  ['HEC-HMS', 'modeling', 88],
  ['HEC-RAS 1D', 'modeling', 88],
  ['HEC-RAS 2D', 'modeling', 85],
  // Groundwater modeling
  ['MODFLOW', 'modeling', 85],
  ['GMS', 'modeling', 82],
  ['HydroGeoSphere', 'modeling', 82],
  // Integrated water resources modeling
  ['SWAT-MODFLOW', 'modeling', 85],
  ['WEAP', 'modeling', 82],
  ['DrinC', 'modeling', 78],
  // Irrigation & water engineering
  ['CROPWAT', 'irrigation', 82],
  ['WaterCAD', 'irrigation', 80],
  ['WaterGEMS', 'irrigation', 78],
  ['EPANET', 'irrigation', 78],
  ['Civil 3D', 'irrigation', 75],
  // Geospatial & GIS
  ['ArcGIS', 'gis', 90],
  ['ArcGIS Pro', 'gis', 88],
  ['QGIS', 'gis', 88],
  ['Arc-Hydro', 'gis', 85],
  ['WhiteboxTools', 'gis', 80],
  // Remote sensing
  ['Google Earth Engine', 'gis', 82],
  ['ERDAS Imagine', 'gis', 80],
  ['TerrSet', 'gis', 78],
  ['Landsat', 'gis', 85],
  ['Sentinel', 'gis', 85],
  ['MODIS', 'gis', 80],
  ['SAR', 'gis', 75],
  // Programming & data analysis
  ['Python', 'programming', 85],
  ['R', 'programming', 82],
  ['RStudio', 'programming', 82],
  ['Minitab', 'programming', 75],
  ['Excel', 'programming', 85],
  ['Data Science', 'programming', 80],
  // Climate analysis
  ['CMIP5', 'research', 80],
  ['CMIP6', 'research', 80],
  ['Climate Impact Assessment', 'research', 88],
  ['Drought Assessment', 'research', 85],
  ['Rainfall Analysis', 'research', 88],
  ['Land Use / Land Cover Change Analysis', 'research', 85],
  ['Surface–Groundwater Interaction', 'research', 85],
  ['Water Quality Analysis', 'research', 82],
  // Teaching & other expertise
  ['Curriculum Development', 'teaching', 90],
  ['Academic Supervision', 'teaching', 90],
  ['Capacity Building & Training', 'teaching', 92],
  ['Research Grant Writing', 'research', 85],
  ['Project Management', 'teaching', 82],
  ['Water Safety & Quality', 'research', 80],
  ['Irrigation & Drainage', 'irrigation', 82],
  ['Groundwater Assessment', 'research', 85],
  ['Git', 'tools', 78],
  ['Linux', 'tools', 75],
]

const EXPERIENCES = [
  {
    title: 'Lecturer and Researcher',
    company: 'Kombolcha Institute of Technology (WU-KIoT), Wollo University',
    company_url: null,
    location: 'Kombolcha, Ethiopia',
    start_date: '2020-07-30',
    end_date: null,
    current: true,
    description:
      'Department of Water Resources and Irrigation Engineering — teaching undergraduate students and supporting postgraduate students in water resources and irrigation engineering, civil and hydraulics engineering, including hydrology, groundwater, hydraulics, irrigation, drainage, climate change, GIS, and remote sensing.',
    highlights: [
      'Conducting demand-driven research in climate change impacts, hydrological and hydraulic modeling, land use/land cover change, watershed management, flood and drought analysis, and surface–groundwater interaction',
      'Design hydrograph estimation for small and ungauged basins in Ethiopia, supporting flood estimation, watershed planning, and climate-resilient infrastructure design',
      'Applied R&D projects: Mechella River dam design, HydroGeoSphere integrated modeling for sustainable water development, rural water supply optimization in Afar (Mile & Asayta), IoT-based solid waste management for Kombolcha, and gemstone mining technology innovation',
      'Community service and capacity building in hydrology, groundwater, GIS/remote sensing, R and Python programming, irrigation development, and soil & water conservation',
      'Supervising and consulting undergraduate students on research projects, senior design projects, and academic theses',
      'Serving on academic, research, and administrative committees — curriculum review, laboratory specification, governance, promotion, and scholarship committees',
    ],
    display_order: 1,
  },
  {
    title: 'Hydro-Meteorological Data Collector and Data Analyst',
    company: 'Field Stations & Gauging Sites',
    company_url: null,
    location: 'Kombolcha, Ethiopia',
    start_date: '2019-01-03',
    end_date: '2020-05-04',
    current: false,
    description:
      'Collected, organized, and managed hydro-meteorological data including rainfall, temperature, streamflow, groundwater levels, evaporation, and soil moisture from field stations, gauging sites, and secondary data sources.',
    highlights: [
      'Field measurements for river discharge, water levels, and rainfall using standard hydrometric instruments and established protocols',
      'Data quality control and validation: missing data treatment, outlier detection, consistency checks, and homogeneity testing',
      'Analyzed long-term hydrological and meteorological datasets for flood, drought, and climate variability assessments',
      'Processed data with Python, R, Excel, and hydrological analysis software',
      'Integrated ground observations with satellite and reanalysis datasets (rainfall and climate products) for data-scarce and ungauged basins',
    ],
    display_order: 2,
  },
  {
    title: 'Assistant Lecturer',
    company: 'Kombolcha Institute of Technology (WU-KIoT), Wollo University',
    company_url: null,
    location: 'Kombolcha, Ethiopia',
    start_date: '2016-08-05',
    end_date: '2017-10-03',
    current: false,
    description:
      'Taught undergraduate courses related to water resources and irrigation engineering, including hydrology, hydraulics, groundwater, irrigation systems design, water management, GIS, and remote sensing.',
    highlights: [
      'Prepared and developed course materials, lectures, assignments, and examinations',
      'Advised students on academic planning, research opportunities, and career development',
      'Participated in departmental and university committees, including curriculum development activities',
      'Provided community outreach services and technical support related to water resources and irrigation engineering',
    ],
    display_order: 3,
  },
]

const EDUCATIONS = [
  {
    degree: 'Master of Science (MSc) in Hydraulic and Water Resources Engineering',
    field_of_study: 'Engineering Hydrology',
    institution: 'Bahir Dar Institute of Technology (BIT), Bahir Dar University',
    location: 'Bahir Dar, Ethiopia',
    start_date: '2017-10-03',
    end_date: '2020-07-01',
    grade: 'Final Grade: 3.73',
    description:
      'Coursework: Advanced Surface Water Hydrology, Advanced Groundwater Hydrology, Soil Erosion and Sediment Transport, Computational Hydraulics, GIS and Remote Sensing, Water Quality Monitoring and Assessment, Environmental Impact Assessment, Water Resources System Analysis and Planning. Thesis: Evaluating Streamflow Performance Using Satellite Rainfall Products and SWAT+ Modeling in Belles Basin, Ethiopia.',
    display_order: 1,
  },
  {
    degree: 'Bachelor of Science (BSc) in Water Resources and Irrigation Engineering',
    field_of_study: 'Water Resources & Irrigation Engineering',
    institution: 'Kombolcha Institute of Technology, Wollo University',
    location: 'Kombolcha, Ethiopia',
    start_date: '2012-10-05',
    end_date: '2016-06-14',
    grade: 'Final Grade: 3.82',
    description:
      'Coursework: Hydrology (Surface and Groundwater), Irrigation and Drainage Engineering, Hydraulics and Open Channel Flow, Flood and Drought Management, Watershed and River Basin Management, Soil & Water Conservation, Environmental Impact Assessment. Software: SWAT, HEC-HMS, HEC-RAS, WaterCAD, AutoCAD; Programming: Python and R. Thesis: Design of a Groundwater Supply Project for Kombolcha Town, Ethiopia.',
    display_order: 2,
  },
]

// [name, issuer, category]
const CERTIFICATIONS = [
  ['SWAT-MODFLOW Model to Support Integrated Water Storage Assessment', 'International Water Management Institute (IWMI) & CGIAR', 'Hydrology'],
  ['Introduction to Python Programming and Applications in Water Resources Sector', 'National Water Academy, Pune, India', 'Programming'],
  ['Water Resources Management Softwares (SWAT, HEC-HMS, HEC-RAS)', 'Ethiopia Water Technology Institute (EWTI)', 'Water Resources'],
  ['GIS and Remote Sensing', 'Ethiopia Water Technology Institute (EWTI)', 'GIS & Remote Sensing'],
  ['Python Application in Geographical Information Systems (GIS)', 'International Institute of Geospatial Science & Technology (IIGST), India', 'Programming'],
]

const PUBLICATIONS = [
  {
    title:
      'Evaluating Streamflow Performance Using Satellite Rainfall Products and SWAT+ Modeling in Belles Basin, Ethiopia',
    authors: 'Asmare Belay Ngussie',
    venue: 'Bahir Dar Institute of Technology, Bahir Dar University',
    type: 'thesis',
    year: '2020',
    abstract:
      'MSc thesis evaluating the streamflow simulation performance of satellite rainfall products coupled with SWAT+ modeling in the Belles Basin, Ethiopia — providing a basis for reliable hydrological prediction in data-scarce basins.',
    url: 'https://scholar.google.com/citations?user=NlBFEmwAAAAJ&hl=en',
    display_order: 1,
  },
]

const PROJECTS = [
  {
    title: 'Ethiopia1Water-TAP Integrated Hydrologic Modeling',
    slug: 'ethiopia1water-tap-integrated-hydrologic-modeling',
    summary: 'Integrated surface–groundwater modeling to support sustainable water resources development and investment planning.',
    description:
      'Applied integrated hydrologic modeling combining SWAT, MODFLOW and WEAP to assess water availability, storage dynamics and the impact of development scenarios at basin scale. Part of a broader integrated water resources assessment and planning effort.',
    category: 'research',
    role: 'Hydrological modeler and researcher',
    organization: 'Kombolcha Institute of Technology, Wollo University',
    status: 'Ongoing',
    tech_stack: ['SWAT', 'MODFLOW', 'WEAP', 'SWAT-MODFLOW', 'GIS'],
    featured: true,
    display_order: 1,
  },
  {
    title: 'Borkena Sub-Watershed Prioritization',
    slug: 'borkena-sub-watershed-prioritization',
    summary: 'GIS-based multi-criteria prioritization of sub-watersheds for soil and water conservation planning.',
    description:
      'Prioritized sub-watersheds of the Borkena catchment using morphometric analysis, land degradation indicators and geospatial multi-criteria evaluation, guiding where conservation interventions should be focused first.',
    category: 'research',
    role: 'Researcher and GIS analyst',
    organization: 'Wollo University',
    status: 'Completed',
    tech_stack: ['ArcGIS', 'QGIS', 'SWAT', 'Remote Sensing'],
    featured: true,
    display_order: 2,
  },
  {
    title: 'Flood Early Warning & Riverbank Overtopping Analysis',
    slug: 'flood-early-warning-riverbank-overtopping',
    summary: 'Hydraulic modeling of flood-prone river reaches to support early warning and flood-risk reduction.',
    description:
      'Applied HEC-RAS 1D/2D hydraulic modeling to assess flood inundation and riverbank overtopping risk for communities along the Borkena river, providing evidence for early warning thresholds and mitigation planning.',
    category: 'research',
    role: 'Hydraulic modeler',
    organization: 'Wollo University',
    status: 'Completed',
    tech_stack: ['HEC-RAS 1D', 'HEC-RAS 2D', 'HEC-HMS', 'ArcGIS'],
    featured: true,
    display_order: 3,
  },
  {
    title: 'SWATplus-MODFLOW-WEAP Climate Impact Assessment',
    slug: 'swatplus-modflow-weap-climate-impact-assessment',
    summary: 'Coupled modeling framework assessing climate change impacts on water resources availability.',
    description:
      'Bias-corrected CMIP5/CMIP6 climate projections drive coupled SWAT+-MODFLOW simulations, with WEAP used to evaluate demand scenarios — quantifying how climate change may reshape surface and groundwater availability in the study basin.',
    category: 'research',
    role: 'Lead modeler',
    organization: 'Kombolcha Institute of Technology, Wollo University',
    status: 'Ongoing',
    tech_stack: ['SWAT+', 'MODFLOW', 'WEAP', 'CMIP5', 'CMIP6', 'Python', 'R'],
    featured: true,
    display_order: 4,
  },
  {
    title: 'Stormwater Drainage Assessment for Kombolcha Town',
    slug: 'stormwater-drainage-assessment-kombolcha',
    summary: 'Design-storm analysis and drainage capacity assessment for urban flood mitigation.',
    description:
      'Estimated design hydrographs for small and ungauged urban catchments and assessed existing stormwater drainage capacity, recommending infrastructure upgrades for Kombolcha town.',
    category: 'engineering',
    role: 'Hydrological engineer',
    organization: 'Wollo University / Kombolcha Town Administration',
    status: 'Completed',
    tech_stack: ['HEC-HMS', 'Civil 3D', 'ArcGIS'],
    featured: false,
    display_order: 5,
  },
  {
    title: 'Landslide Susceptibility Mapping',
    slug: 'landslide-susceptibility-mapping',
    summary: 'GIS and remote sensing based landslide susceptibility assessment for the Ethiopian highlands.',
    description:
      'Combined slope, lithology, land use and rainfall triggers in a GIS multi-criteria framework to map landslide susceptibility and inform settlement and infrastructure planning.',
    category: 'research',
    role: 'GIS analyst and researcher',
    organization: 'Wollo University',
    status: 'Completed',
    tech_stack: ['ArcGIS', 'Remote Sensing', 'Landsat', 'WhiteboxTools'],
    featured: false,
    display_order: 6,
  },
  {
    title: 'Mechella Irrigation Scheme & River Dam Design',
    slug: 'mechella-irrigation-scheme-dam-design',
    summary: 'Hydrological design support for the Mechella river dam and community irrigation scheme.',
    description:
      'Provided hydrological and hydrograph design inputs — design flood estimation, catchment yield analysis and reservoir sizing — for the Mechella river dam and its downstream irrigation scheme.',
    category: 'engineering',
    role: 'Hydrology advisor',
    organization: 'Wollo University community service program',
    status: 'Completed',
    tech_stack: ['HEC-HMS', 'HEC-RAS 1D', 'Civil 3D', 'CROPWAT'],
    featured: true,
    display_order: 7,
  },
  {
    title: 'Rural Water Supply Optimization in Afar (Mile & Asayta)',
    slug: 'rural-water-supply-optimization-afar',
    summary: 'Groundwater-based rural water supply assessment and optimization for dryland communities.',
    description:
      'Assessed groundwater potential and water supply infrastructure in the Mile and Asayta districts of the Afar region, and modeled supply options to improve reliability for pastoralist communities.',
    category: 'engineering',
    role: 'Water resources engineer',
    organization: 'Wollo University',
    status: 'Completed',
    tech_stack: ['MODFLOW', 'GMS', 'WaterGEMS', 'EPANET'],
    featured: false,
    display_order: 8,
  },
  {
    title: 'HydroGeoSphere Integrated Modeling for Sustainable Water Development',
    slug: 'hydrogeosphere-integrated-modeling-water-development',
    summary: 'Integrated surface–subsurface flow modeling to identify sustainable water development options.',
    description:
      'Applied HydroGeoSphere to simulate fully integrated surface–subsurface flow, quantifying groundwater–surface water exchange and identifying sustainable extraction points for community water supply development.',
    category: 'research',
    role: 'Lead modeler',
    organization: 'Kombolcha Institute of Technology, Wollo University',
    status: 'Ongoing',
    tech_stack: ['HydroGeoSphere', 'Gwflow', 'GIS'],
    featured: false,
    display_order: 9,
  },
  {
    title: 'IoT-Based Solid Waste Management for Kombolcha',
    slug: 'iot-based-solid-waste-management-kombolcha',
    summary: 'Smart-bin IoT prototype improving municipal solid waste collection efficiency.',
    description:
      'Co-developed an IoT-based solid waste monitoring prototype for Kombolcha town — fill-level sensing and route optimization — as an applied R&D contribution to urban sanitation.',
    category: 'applied',
    role: 'Project lead (R&D)',
    organization: 'Kombolcha Institute of Technology',
    status: 'Completed',
    tech_stack: ['IoT', 'Data Analysis'],
    featured: false,
    display_order: 10,
  },
  {
    title: 'Gemstone Miners & Lapidarists Technology Innovation',
    slug: 'gemstone-miners-lapidarists-technology-innovation',
    summary: 'Applied technology innovation project supporting artisanal gemstone miners in Tigray & Amhara.',
    description:
      'Participated in a multidisciplinary innovation project improving tools, safety and market access for artisanal gemstone miners and lapidarists, contributing water-use and site assessment expertise.',
    category: 'applied',
    role: 'Contributing researcher',
    organization: 'Multidisciplinary university team',
    status: 'Completed',
    tech_stack: ['Site Assessment'],
    featured: false,
    display_order: 11,
  },
  {
    title: 'Vertical Farming Feasibility Study',
    slug: 'vertical-farming-feasibility-study',
    summary: 'Water-use feasibility analysis for urban vertical farming in water-scarce settings.',
    description:
      'Evaluated water demand, recirculation and source options for vertical farming pilots, connecting irrigation engineering with urban food-system innovation.',
    category: 'applied',
    role: 'Water resources analyst',
    organization: 'Kombolcha Institute of Technology',
    status: 'Completed',
    tech_stack: ['CROPWAT', 'WaterCAD'],
    featured: false,
    display_order: 12,
  },
  {
    title: 'Professional Training & Capacity Building Program',
    slug: 'professional-training-capacity-building-program',
    summary: 'Hydrology, GIS/remote sensing, R and Python training delivered to 150+ professionals and students.',
    description:
      'Designed and delivered capacity-building training for government stakeholders and university communities — covering hydrology, groundwater, GIS/remote sensing, R and Python programming, irrigation development, and soil & water conservation.',
    category: 'training',
    role: 'Trainer and curriculum designer',
    organization: 'Wollo University community service',
    status: 'Ongoing',
    tech_stack: ['ArcGIS', 'QGIS', 'Python', 'R', 'SWAT'],
    featured: false,
    display_order: 13,
  },
  {
    title: 'Institutional MOUs & Research Collaboration',
    slug: 'institutional-mous-research-collaboration',
    summary: 'Inter-institutional collaboration agreements supporting joint research and student exchange.',
    description:
      'Contributed to establishing and operationalizing MOUs between Wollo University and partner institutions, enabling joint supervision, shared laboratory use and collaborative research proposals.',
    category: 'collaboration',
    role: 'Committee member and coordinator',
    organization: 'Wollo University',
    status: 'Ongoing',
    featured: false,
    display_order: 14,
  },
  {
    title: 'University Building Investment Proposal',
    slug: 'university-building-investment-proposal',
    summary: 'Technical input into an infrastructure investment proposal for campus expansion.',
    description:
      'Provided hydrological siting and water infrastructure inputs into a university building investment proposal, including drainage, water supply and sanitation considerations.',
    category: 'engineering',
    role: 'Technical contributor',
    organization: 'Wollo University',
    status: 'Completed',
    featured: false,
    display_order: 15,
  },
  {
    title: 'ASMARE Portfolio Platform',
    slug: 'asmare-portfolio-platform',
    summary: 'A headless CMS + portfolio with a Vue SPA, built on Laravel/Express and PostgreSQL.',
    description:
      'A production-grade portfolio and CMS proving a full-stack architecture with a public API, admin dashboard and SEO meta-shell.',
    category: 'web',
    repo_url: 'https://github.com/SebleMengistu',
    demo_url: null,
    tech_stack: ['Vue', 'Express', 'Laravel', 'PostgreSQL', 'Tailwind'],
    featured: false,
    display_order: 16,
  },
]

// Verified achievements — from CV grades and documented outcomes only.
const ACHIEVEMENTS = [
  {
    title: 'BSc with Great Distinction — First Class Honours',
    organization: 'Kombolcha Institute of Technology, Wollo University',
    achieved_at: '2016-06-14',
    description: 'Graduated with a final grade of 3.82/4.00 in Water Resources and Irrigation Engineering, earning Great Distinction and first-class honours recognition.',
    category: 'Academic',
    display_order: 1,
  },
  {
    title: 'Competitive Research Grants Secured',
    organization: 'Wollo University & national funding programs',
    achieved_at: null,
    description: 'Successfully secured competitive research funding for demand-driven projects in hydrological modeling, climate impact assessment and community water resources development.',
    category: 'Professional',
    display_order: 2,
  },
  {
    title: '150+ Professionals & Students Trained',
    organization: 'Wollo University community service program',
    achieved_at: null,
    description: 'Delivered capacity-building training in hydrology, groundwater, GIS/remote sensing, and R & Python programming to more than 150 government professionals and university students.',
    category: 'Community',
    display_order: 3,
  },
  {
    title: 'MSc Thesis Published in Institutional Research Repository',
    organization: 'Bahir Dar Institute of Technology, Bahir Dar University',
    achieved_at: '2020-07-01',
    description: 'MSc thesis on satellite rainfall products and SWAT+ modeling in the Belles Basin completed with a final grade of 3.73 and made publicly available through the university research repository.',
    category: 'Academic',
    display_order: 4,
  },
]

// Verified languages from the CV.
const LANGUAGES = [
  { name: 'Amharic', proficiency: 'Mother Tongue', display_order: 1 },
  { name: 'English', proficiency: 'C2 — Full Professional Proficiency', display_order: 2 },
]

// Research themes — all backed by CV expertise and active projects.
const RESEARCH = [
  {
    topic: 'Hydrological Modeling',
    description: 'Rainfall–runoff modeling with SWAT, SWAT+ and HBV for gauged and ungauged basins, including design hydrograph estimation for small Ethiopian catchments.',
    methods: ['SWAT', 'SWAT+', 'HBV', 'WMS'],
    display_order: 1,
  },
  {
    topic: 'Climate Change and Water Resources',
    description: 'Bias-correcting CMIP5/CMIP6 projections and propagating them through hydrologic models to quantify climate impacts on streamflow, evapotranspiration and water availability.',
    methods: ['CMIP5', 'CMIP6', 'SWAT+', 'Python', 'R'],
    display_order: 2,
  },
  {
    topic: 'Flood Forecasting and Flood-Risk Analysis',
    description: 'Hydraulic and hydrologic modeling of flood-prone reaches — inundation mapping, riverbank overtopping and early-warning thresholds for riverine communities.',
    methods: ['HEC-HMS', 'HEC-RAS 1D', 'HEC-RAS 2D'],
    display_order: 3,
  },
  {
    topic: 'Drought Assessment',
    description: 'Meteorological and hydrological drought characterization using reanalysis and observed data, supporting early warning and water-security planning.',
    methods: ['DrinC', 'R', 'Python'],
    display_order: 4,
  },
  {
    topic: 'Groundwater Assessment and Modeling',
    description: 'Numerical groundwater modeling with MODFLOW/GMS and integrated Gwflow analysis for aquifer characterization and sustainable abstraction.',
    methods: ['MODFLOW', 'GMS', 'Gwflow'],
    display_order: 5,
  },
  {
    topic: 'Integrated Hydrologic Modeling',
    description: 'Coupled surface–subsurface frameworks (SWAT-MODFLOW, HydroGeoSphere) to represent surface water–groundwater interaction at watershed scale.',
    methods: ['SWAT-MODFLOW', 'HydroGeoSphere', 'WEAP'],
    display_order: 6,
  },
  {
    topic: 'Watershed Management',
    description: 'Sub-watershed prioritization, soil and water conservation planning, and land-degradation assessment for sustainable catchment management.',
    methods: ['SWAT', 'ArcGIS', 'QGIS'],
    display_order: 7,
  },
  {
    topic: 'Remote Sensing and GIS-based Environmental Analysis',
    description: 'Satellite data (Landsat, Sentinel, MODIS, SAR) and Google Earth Engine for land-use change, drought and water-resources monitoring in data-scarce regions.',
    methods: ['Google Earth Engine', 'Landsat', 'Sentinel', 'MODIS', 'SAR', 'ERDAS'],
    display_order: 8,
  },
  {
    topic: 'Water Quality',
    description: 'Water quality monitoring and assessment for surface water systems, linking land use with water safety and quality outcomes.',
    methods: ['Field Analysis', 'GIS'],
    display_order: 9,
  },
  {
    topic: 'Rainfall Analysis',
    description: 'Evaluation of satellite rainfall products (CHIRPS, ERA5) against ground observations to enable reliable prediction in ungauged basins.',
    methods: ['CHIRPS', 'ERA5', 'SWAT+', 'Python'],
    display_order: 10,
  },
  {
    topic: 'Water Storage and Watershed Management',
    description: 'Assessing surface and subsurface water storage dynamics to identify managed aquifer recharge zones and storage strategies — supported by IWMI/CGIAR SWAT-MODFLOW training.',
    methods: ['SWAT-MODFLOW', 'WEAP', 'Gwflow'],
    display_order: 11,
  },
]

const POSTS = [
  {
    title: 'Satellite Rainfall Products for Ungauged Basins',
    slug: 'satellite-rainfall-products-for-ungauged-basins',
    excerpt:
      'What I learned evaluating satellite precipitation products against ground data in the Belles Basin.',
    body:
      'In this article I walk through the workflow I use to bias-correct and evaluate satellite rainfall products (CHIRPS, ERA5) against gauged observations, and how that feeds reliable SWAT+ streamflow simulation in data-scarce basins.',
    tags: ['Hydrology', 'SWAT+', 'Remote Sensing'],
    published_at: '2024-05-12T09:00:00Z',
  },
  {
    title: 'Coupled SWAT-MODFLOW Modelling for Water Storage Assessment',
    slug: 'coupled-swat-modflow-modelling-for-water-storage-assessment',
    excerpt: 'Practical lessons from quantifying surface–groundwater storage dynamics at watershed scale.',
    body:
      'From the IWMI/CGIAR training to applied basin studies — here is how coupled SWAT-MODFLOW modelling helps identify zones for managed aquifer recharge and sustainable storage strategies.',
    tags: ['Groundwater', 'SWAT-MODFLOW'],
    published_at: '2024-04-28T09:00:00Z',
  },
  {
    title: 'Python for Hydrological Data Analysis',
    slug: 'python-for-hydrological-data-analysis',
    excerpt: 'Automating time-series processing of rainfall, discharge and reservoir data with pandas and matplotlib.',
    body:
      'Python has become an essential tool in my hydrology workflow. Here I share the scripts and patterns I use for missing-data treatment, consistency checks, trend analysis and automated reporting.',
    tags: ['Python', 'Data Analysis'],
    published_at: '2024-04-10T09:00:00Z',
  },
]

module.exports = {
  PROFILE,
  SKILLS,
  EXPERIENCES,
  EDUCATIONS,
  CERTIFICATIONS,
  PUBLICATIONS,
  PROJECTS,
  POSTS,
  ACHIEVEMENTS,
  LANGUAGES,
  RESEARCH,
}
