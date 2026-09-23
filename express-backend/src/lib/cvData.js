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
    projects_completed: 6,
    research_publications: 1,
    technologies: 26,
    students_trained: 150,
  },
}

const SKILLS = [
  ['Hydrological Modeling (SWAT/SWAT+)', 'modeling', 92],
  ['HEC-HMS (Hydrology)', 'modeling', 88],
  ['HEC-RAS (Hydraulics)', 'modeling', 88],
  ['MODFLOW (Groundwater)', 'modeling', 85],
  ['HydroGeoSphere (Integrated Modeling)', 'modeling', 82],
  ['SWAT-MODFLOW (Coupled Modeling)', 'modeling', 85],
  ['Flood Forecasting & Analysis', 'modeling', 85],
  ['Groundwater Management', 'modeling', 85],
  ['GIS (ArcGIS / QGIS)', 'gis', 90],
  ['Remote Sensing', 'gis', 88],
  ['Google Earth Engine (GEE)', 'gis', 82],
  ['Python', 'programming', 85],
  ['R', 'programming', 82],
  ['Pandas & Matplotlib', 'programming', 80],
  ['Climate Impact Assessment', 'research', 88],
  ['Land Use / Land Cover Change Analysis', 'research', 85],
  ['Watershed Management', 'research', 88],
  ['Surface–Groundwater Interaction', 'research', 85],
  ['Soil & Water Conservation', 'research', 82],
  ['Curriculum Development', 'teaching', 90],
  ['Academic Supervision', 'teaching', 90],
  ['Capacity Building & Training', 'teaching', 92],
  ['AutoCAD & WaterCAD', 'tools', 75],
  ['Excel & Statistical Tools', 'tools', 85],
  ['Git', 'tools', 80],
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

const CERTIFICATIONS = [
  ['SWAT-MODFLOW Model to Support Integrated Water Storage Assessment', 'International Water Management Institute (IWMI) & CGIAR'],
  ['Introduction to Python Programming and Applications in Water Resources Sector', 'National Water Academy, Pune, India'],
  ['Water Resources Management Softwares (SWAT, HEC-HMS, HEC-RAS)', 'Ethiopia Water Technology Institute (EWTI)'],
  ['GIS and Remote Sensing', 'Ethiopia Water Technology Institute (EWTI)'],
  ['Python Application in Geographical Information Systems (GIS)', 'International Institute of Geospatial Science & Technology (IIGST), India'],
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
    title: 'ASMARE Portfolio Platform',
    slug: 'asmare-portfolio-platform',
    summary: 'A headless CMS + portfolio with a Vue SPA, built on Laravel/Express and PostgreSQL.',
    description:
      'A production-grade portfolio and CMS proving a full-stack architecture with a public API, admin dashboard and SEO meta-shell.',
    category: 'web',
    repo_url: 'https://github.com/SebleMengistu',
    demo_url: null,
    tech_stack: ['Vue', 'Express', 'Laravel', 'PostgreSQL', 'Tailwind'],
    featured: true,
    display_order: 1,
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

module.exports = { PROFILE, SKILLS, EXPERIENCES, EDUCATIONS, CERTIFICATIONS, PUBLICATIONS, PROJECTS, POSTS }
