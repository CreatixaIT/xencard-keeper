import { createContact } from './repositories/contactRepository';
import type { VisitingCard, Industry } from '../types';

const FIRST_NAMES = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'William', 'Jennifer',
  'James', 'Amanda', 'Christopher', 'Jessica', 'Daniel', 'Ashley', 'Matthew', 'Stephanie', 'Andrew', 'Nicole',
  'Rahim', 'Ahmed', 'Mohammed', 'Fatima', 'Ali', 'Aisha', 'Hassan', 'Zainab', 'Omar', 'Khadija',
  'Yuki', 'Sakura', 'Hiroshi', 'Emi', 'Kenji', 'Yumi', 'Takeshi', 'Riko', 'Satoshi', 'Mai',
  'Wei', 'Li', 'Jing', 'Min', 'Chen', 'Xiu', 'Peng', 'Fang', 'Lei', 'Na',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Ahmed', 'Hassan', 'Khan', 'Rahman', 'Malik', 'Siddiqui', 'Hussain', 'Ali', 'Akhtar', 'Chowdhury',
  'Tanaka', 'Suzuki', 'Yamamoto', 'Watanabe', 'Ito', 'Nakamura', 'Kobayashi', 'Sato', 'Kimura', 'Hayashi',
  'Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou',
];

const COMPANIES = [
  'ABC Motors', 'Tech Solutions Inc', 'Global Finance Corp', 'Health First Medical', 'Prime Real Estate',
  'Digital Innovations', 'Capital Investments', 'Auto Works Ltd', 'MediCare Plus', 'Property Ventures',
  'Smart Systems', 'Bank of Future', 'Car World', 'Health Hub', 'Estate Masters',
  'Cloud Tech', 'Investment Partners', 'Vehicle Services', 'Medical Center', 'Real Estate Group',
  'Tech Dynamics', 'Finance Hub', 'Motor Company', 'Health Systems', 'Property Developers',
];

const JOB_TITLES = [
  'CEO', 'CTO', 'CFO', 'COO', 'Director', 'Managing Director', 'Manager', 'Founder', 'Engineer',
  'Consultant', 'Executive', 'Sales Manager', 'Marketing Manager', 'Product Manager', 'Operations Manager',
  'Software Engineer', 'Financial Analyst', 'Automotive Engineer', 'Doctor', 'Real Estate Agent',
  'Chief Executive', 'Technical Director', 'Finance Director', 'Service Manager', 'Medical Director',
];

const INDUSTRIES: Industry[] = ['Technology', 'Finance', 'Automotive', 'Healthcare', 'Real Estate', 'Other'];

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'business.com'];

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomPhone(): string {
  const formats = [
    '+8801', '01', '+1', '+44', '+91',
  ];
  const prefix = randomItem(formats);
  const digits = Math.floor(Math.random() * 9000000000) + 1000000000;
  return `${prefix}${digits.toString().slice(0, 9)}`;
}

function randomEmail(firstName: string, lastName: string): string {
  const domain = randomItem(EMAIL_DOMAINS);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function randomWebsite(company: string): string {
  const cleanName = company.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  return `https://www.${cleanName}.com`;
}

function randomAddress(): string {
  const streets = ['Main St', 'Oak Ave', 'Park Rd', 'High St', 'Church Ln'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Dhaka', 'Tokyo', 'Shanghai', 'London', 'Singapore'];
  const number = Math.floor(Math.random() * 999) + 1;
  return `${number} ${randomItem(streets)}, ${randomItem(cities)}`;
}

export async function seedContacts(count: number = 1000): Promise<void> {
  console.warn(`Seeding ${count} contacts...`);
  
  for (let i = 0; i < count; i++) {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const company = randomItem(COMPANIES);
    const jobTitle = randomItem(JOB_TITLES);
    const industry = randomItem(INDUSTRIES);
    
    // Some contacts missing phone or email for realism
    const hasPhone = Math.random() > 0.1;
    const hasEmail = Math.random() > 0.1;
    const hasAddress = Math.random() > 0.3;
    const hasWebsite = Math.random() > 0.4;
    
    const contact: Omit<VisitingCard, 'id' | 'createdTimestamp'> = {
      personName: `${firstName} ${lastName}`,
      companyName: company,
      jobTitle,
      email: hasEmail ? randomEmail(firstName, lastName) : undefined,
      phone: hasPhone ? randomPhone() : undefined,
      whatsappNumber: hasPhone ? randomPhone() : undefined,
      address: hasAddress ? randomAddress() : undefined,
      website: hasWebsite ? randomWebsite(company) : undefined,
      industry,
      rawOcrText: `${firstName} ${lastName}\n${company}\n${jobTitle}`,
      cardImageUri: `placeholder_${i}.png`,
    };
    
    await createContact(contact);
    
    if (i % 100 === 0) {
      console.warn(`Seeded ${i} contacts...`);
    }
  }
  
  console.warn(`Completed seeding ${count} contacts`);
}

export async function clearAllContacts(): Promise<void> {
  const { db } = await import('./client');
  const { contacts } = await import('./schema');
  await db.delete(contacts);
  console.warn('Cleared all contacts');
}
