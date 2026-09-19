// lib/config.ts
export const APP_CONFIG = {
  name: 'MBMChat',
  tagline: 'Your Campus. Your Chaos.',
  subTagline: 'Connect with your MBM people.',
  
  // Configurable university domain list (Can be populated from backend env)
  ALLOWED_COLLEGE_EMAIL_DOMAINS: [
    'mbm.ac.in',
    'student.mbm.ac.in',
    'alumni.mbm.ac.in'
  ],
  
  // Strict regex for initial client format check
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  MBM_BRANCHES: [
    "Mining Engineering",
    "Computer Science and Engineering",
    "Information Technology",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electronics and Communication",
    "Chemical Engineering",
    "Production and Industrial"
  ] as const
};