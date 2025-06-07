// Canadian provinces and territories
export const CANADIAN_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'YT', name: 'Yukon' },
];

// Address extra types
export const ADDRESS_EXTRA_TYPES = [
  'Unit',
  'Apartment',
  'Basement',
  'Suite',
  'Other',
];

// Service areas and their corresponding service types
export const SERVICE_AREAS = {
  'Finance': [
    'Accounting',
    'Bookkeeping',
    'Payroll Services',
    'Tax Preparation',
    'Financial Consulting',
  ],
  'Legal': [
    'Legal Consulting',
    'Notary Public',
    'Paralegal Services',
  ],
  'Construction & Trades': [
    'General Contracting',
    'Drywall Installation',
    'Electrical Services',
    'Plumbing',
    'Painting',
    'Flooring Installation',
    'Roofing',
    'Landscaping',
    'Handyman Services',
  ],
  'Consulting & Business': [
    'Business Consulting',
    'Marketing Consulting',
    'HR Consulting',
    'Coaching',
  ],
  'Marketing & Design': [
    'Digital Marketing',
    'SEO Services',
    'Social Media Management',
    'Graphic Design',
    'Web Design',
    'Copywriting',
  ],
  'IT & Software': [
    'Software Development',
    'IT Support',
    'Web Development',
    'App Development',
    'Cybersecurity Services',
  ],
  'Health & Personal Care': [
    'Personal Training',
    'Nutrition Coaching',
    'Therapy / Counselling',
    'Massage Therapy',
    'Spa Services',
    'Makeup Artist',
    'Hair Stylist',
    'Aesthetician Services',
  ],
  'Education & Training': [
    'Tutoring',
    'Online Course Creator',
    'Corporate Trainer',
    'Language Instructor',
  ],
  'Creative Services': [
    'Photography',
    'Videography',
    'Content Creation',
    'Voice Over',
    'Music Lessons',
  ],
  'Cleaning Services': [
    'Residential Cleaning',
    'Commercial Cleaning',
    'Post-Construction Cleaning',
    'Window Cleaning',
    'Carpet Cleaning',
  ],
  'Transportation & Logistics': [
    'Moving Services',
    'Courier Services',
    'Delivery Services',
  ],
  'Other': ['Other'],
} as const;

// Get all service area keys
export const SERVICE_AREA_OPTIONS = Object.keys(SERVICE_AREAS);

// Helper function to get service types for a given area
export const getServiceTypesForArea = (area: string): readonly string[] => {
  return SERVICE_AREAS[area as keyof typeof SERVICE_AREAS] || [];
};

// Validation regex for Canadian postal code
export const CANADIAN_POSTAL_CODE_REGEX = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

// Validation regex for Canadian GST number (9 digits + RT + 4 digits)
export const CANADIAN_GST_REGEX = /^\d{9}RT\d{4}$/;

// Helper function to extract business number from GST number
export const extractBusinessNumber = (gstNumber: string): string => {
  if (CANADIAN_GST_REGEX.test(gstNumber)) {
    return gstNumber.substring(0, 9);
  }
  return '';
};
