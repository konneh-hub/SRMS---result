// Database Models/Schema Definitions
// This file contains SQL schema definitions for the multi-tenant university system

const universitySchema = `
CREATE TABLE IF NOT EXISTS universities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  established_year INTEGER,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_universities_tenant ON universities(tenant_id);
-- Index for status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_universities_status ON universities(status);
`;

const subscriptionPlansSchema = `
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_months INTEGER NOT NULL,
  max_students INTEGER,
  max_staff INTEGER,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_plans_tenant ON subscription_plans(tenant_id);
-- Index for active plans
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
`;

const universitySubscriptionsSchema = `
CREATE TABLE IF NOT EXISTS university_subscriptions (
  id SERIAL PRIMARY KEY,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  subscription_plan_id INTEGER NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  auto_renew BOOLEAN DEFAULT false,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_university_subscriptions_tenant ON university_subscriptions(tenant_id);
-- Index for university queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_university_subscriptions_university ON university_subscriptions(university_id);
-- Index for status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_university_subscriptions_status ON university_subscriptions(status);
-- Index for end date queries (for expiry checks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_university_subscriptions_end_date ON university_subscriptions(end_date);
`;

const billingRecordsSchema = `
CREATE TABLE IF NOT EXISTS billing_records (
  id SERIAL PRIMARY KEY,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES university_subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  description TEXT,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_records_tenant ON billing_records(tenant_id);
-- Index for university queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_records_university ON billing_records(university_id);
-- Index for status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_records_status ON billing_records(status);
-- Index for due date queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_records_due_date ON billing_records(due_date);
`;

const paymentRecordsSchema = `
CREATE TABLE IF NOT EXISTS payment_records (
  id SERIAL PRIMARY KEY,
  billing_record_id INTEGER NOT NULL REFERENCES billing_records(id) ON DELETE CASCADE,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50), -- 'credit_card', 'bank_transfer', 'paypal', etc.
  transaction_id VARCHAR(255), -- External payment processor transaction ID
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  notes TEXT,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_records_tenant ON payment_records(tenant_id);
-- Index for billing record queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_records_billing ON payment_records(billing_record_id);
-- Index for university queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_records_university ON payment_records(university_id);
-- Index for status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_records_status ON payment_records(status);
`;

const studentSchema = `
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  nationality VARCHAR(100),
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  faculty_id INTEGER REFERENCES faculties(id) ON DELETE SET NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
  enrollment_year INTEGER,
  graduation_year INTEGER,
  current_semester VARCHAR(20),
  academic_status VARCHAR(30) DEFAULT 'active' CHECK (academic_status IN ('active', 'inactive', 'graduated', 'suspended', 'expelled', 'withdrawn')),
  gpa DECIMAL(3,2),
  total_credits INTEGER DEFAULT 0,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(50),
  admission_date DATE,
  profile_picture_url VARCHAR(500),
  documents JSONB, -- Store document URLs/metadata
  is_active BOOLEAN DEFAULT true,
  tenant_id VARCHAR(255) NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_tenant ON students(tenant_id);
-- Index for university queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_university ON students(university_id);
-- Index for faculty queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_faculty ON students(faculty_id);
-- Index for department queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_department ON students(department_id);
-- Index for program queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_program ON students(program_id);
-- Index for student ID lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_student_id ON students(student_id);
-- Index for email lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_email ON students(email);
-- Index for academic status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_status ON students(academic_status);
-- Index for enrollment year
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_enrollment_year ON students(enrollment_year);
`;

const userSchema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('system_admin', 'university_admin', 'dean', 'hod', 'exam_officer', 'lecturer', 'student')),
  university_id INTEGER REFERENCES universities(id) ON DELETE SET NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  faculty_id INTEGER REFERENCES faculties(id) ON DELETE SET NULL,
  employee_id VARCHAR(50) UNIQUE,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  qualification VARCHAR(255),
  specialization VARCHAR(255),
  experience_years INTEGER,
  joining_date DATE,
  salary DECIMAL(10,2),
  contract_type VARCHAR(50) CHECK (contract_type IN ('permanent', 'contract', 'part_time', 'visiting')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  profile_picture_url VARCHAR(500),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant ON users(tenant_id);
-- Index for role-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
-- Index for university-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_university ON users(university_id);
-- Index for department-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_department ON users(department_id);
-- Index for faculty-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_faculty ON users(faculty_id);
-- Index for email lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
-- Index for employee ID lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_employee_id ON users(employee_id);
-- Index for active users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(is_active);
`;

const facultySchema = `
CREATE TABLE IF NOT EXISTS faculties (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  description TEXT,
  dean_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_faculties_tenant ON faculties(tenant_id);
-- Index for university queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_faculties_university ON faculties(university_id);
-- Index for status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_faculties_status ON faculties(status);
-- Index for dean queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_faculties_dean ON faculties(dean_id);
`;

const departmentSchema = `
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  description TEXT,
  hod_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  faculty_id INTEGER NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_tenant ON departments(tenant_id);
-- Index for university queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_university ON departments(university_id);
-- Index for faculty queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_faculty ON departments(faculty_id);
-- Index for status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_status ON departments(status);
-- Index for hod queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_departments_hod ON departments(hod_id);
`;

const programSchema = `
CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  degree_level VARCHAR(50) NOT NULL CHECK (degree_level IN ('certificate', 'diploma', 'bachelor', 'master', 'phd', 'postgraduate')),
  duration_years INTEGER NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  faculty_id INTEGER NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_programs_tenant ON programs(tenant_id);
-- Index for university queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_programs_university ON programs(university_id);
-- Index for faculty queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_programs_faculty ON programs(faculty_id);
-- Index for department queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_programs_department ON programs(department_id);
-- Index for status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_programs_status ON programs(status);
-- Index for degree level queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_programs_degree_level ON programs(degree_level);
`;

const courseSchema = `
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL CHECK (credits > 0),
  course_type VARCHAR(50) NOT NULL DEFAULT 'core' CHECK (course_type IN ('core', 'elective', 'optional')),
  semester VARCHAR(20) CHECK (semester IN ('fall', 'spring', 'summer', 'winter')),
  year INTEGER,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  faculty_id INTEGER NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  lecturer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  max_students INTEGER,
  current_students INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  prerequisites TEXT, -- JSON array of prerequisite course codes
  syllabus_url VARCHAR(500),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_tenant ON courses(tenant_id);
-- Index for university queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_university ON courses(university_id);
-- Index for faculty queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_faculty ON courses(faculty_id);
-- Index for department queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_department ON courses(department_id);
-- Index for lecturer queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_lecturer ON courses(lecturer_id);
-- Index for status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_status ON courses(status);
-- Index for course type queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_type ON courses(course_type);
-- Index for semester/year queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_semester_year ON courses(semester, year);
`;

const enrollmentSchema = `
CREATE TABLE IF NOT EXISTS course_enrollments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  semester VARCHAR(20) NOT NULL CHECK (semester IN ('fall', 'spring', 'summer', 'winter')),
  academic_year INTEGER NOT NULL,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped', 'failed', 'withdrawn', 'auditing')),
  grade VARCHAR(2),
  grade_points DECIMAL(3,2),
  attendance_percentage DECIMAL(5,2),
  midterm_score DECIMAL(5,2),
  final_score DECIMAL(5,2),
  total_score DECIMAL(5,2),
  credits_earned DECIMAL(3,1),
  is_completed BOOLEAN DEFAULT false,
  completion_date DATE,
  remarks TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, course_id, semester, academic_year)
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_tenant ON course_enrollments(tenant_id);
-- Index for student queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
-- Index for course queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
-- Index for university queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_university ON course_enrollments(university_id);
-- Index for semester/year queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_semester_year ON course_enrollments(semester, academic_year);
-- Index for status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_status ON course_enrollments(status);
-- Index for student-semester queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_student_semester ON course_enrollments(student_id, semester, academic_year);
-- Index for completion status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_completed ON course_enrollments(is_completed);
`;

const resultSubmissionSchema = `
CREATE TABLE IF NOT EXISTS result_submissions (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  semester VARCHAR(20) NOT NULL CHECK (semester IN ('fall', 'spring', 'summer', 'winter')),
  academic_year INTEGER NOT NULL,
  lecturer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_type VARCHAR(20) DEFAULT 'scores' CHECK (submission_type IN ('scores', 'grades', 'attendance', 'mixed')),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted_to_exam_officer', 'validated_by_exam_officer', 'rejected_by_exam_officer', 'submitted_to_hod', 'approved_by_hod', 'rejected_by_hod', 'submitted_to_dean', 'approved_by_dean', 'rejected_by_dean', 'published', 'recalled')),
  submission_data JSONB,
  total_students INTEGER DEFAULT 0,
  
  -- Lecturer submission
  submitted_to_exam_officer_at TIMESTAMP,
  submitted_by_lecture_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Exam Officer validation
  validated_by_exam_officer_at TIMESTAMP,
  validated_by_exam_officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  exam_officer_remarks TEXT,
  
  -- HOD approval
  submitted_to_hod_at TIMESTAMP,
  submitted_to_hod_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by_hod_at TIMESTAMP,
  approved_by_hod_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  hod_remarks TEXT,
  
  -- Dean approval  
  submitted_to_dean_at TIMESTAMP,
  submitted_to_dean_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by_dean_at TIMESTAMP,
  approved_by_dean_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  dean_remarks TEXT,
  
  -- Rejection tracking (can be rejected at any stage)
  rejected_at TIMESTAMP,
  rejected_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejected_stage VARCHAR(50),
  rejection_reason TEXT,
  rejection_notes TEXT,
  
  -- Publishing
  published_at TIMESTAMP,
  published_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- General tracking
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP,
  locked_for_editing BOOLEAN DEFAULT false,
  submission_rounds INTEGER DEFAULT 1,
  approval_rounds INTEGER DEFAULT 0,
  remarks TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, semester, academic_year)
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_result_submissions_tenant ON result_submissions(tenant_id);
-- Index for course queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_result_submissions_course ON result_submissions(course_id);
-- Index for lecturer queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_result_submissions_lecturer ON result_submissions(lecturer_id);
-- Index for university queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_result_submissions_university ON result_submissions(university_id);
-- Index for semester/year queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_result_submissions_semester_year ON result_submissions(semester, academic_year);
-- Index for status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_result_submissions_status ON result_submissions(status);
-- Index for exam officer validation queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_result_submissions_exam_officer ON result_submissions(status) WHERE status IN ('submitted_to_exam_officer', 'rejected_by_exam_officer');
-- Index for hod approval queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_result_submissions_hod ON result_submissions(status) WHERE status IN ('submitted_to_hod', 'rejected_by_hod');
-- Index for dean approval queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_result_submissions_dean ON result_submissions(status) WHERE status IN ('submitted_to_dean', 'rejected_by_dean');
-- Index for published queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_result_submissions_published ON result_submissions(published_at) WHERE status = 'published';
-- Index for submission date queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_result_submissions_submitted_at ON result_submissions(submitted_to_exam_officer_at);
`;

const gradingScaleSchema = `
CREATE TABLE IF NOT EXISTS grading_scales (
  id SERIAL PRIMARY KEY,
  university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grading_scales_tenant ON grading_scales(tenant_id);
-- Index for university queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grading_scales_university ON grading_scales(university_id);
-- Index for active scales
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grading_scales_active ON grading_scales(is_active);
`;

const gradingScaleDetailsSchema = `
CREATE TABLE IF NOT EXISTS grading_scale_details (
  id SERIAL PRIMARY KEY,
  grading_scale_id INTEGER NOT NULL REFERENCES grading_scales(id) ON DELETE CASCADE,
  grade VARCHAR(5) NOT NULL,
  grade_point DECIMAL(3,2) NOT NULL,
  min_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  description VARCHAR(255),
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(grading_scale_id, grade)
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grading_scale_details_tenant ON grading_scale_details(tenant_id);
-- Index for grading scale queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grading_scale_details_scale ON grading_scale_details(grading_scale_id);
-- Index for score range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grading_scale_details_score ON grading_scale_details(min_score, max_score);
`;

const semesterGPASchema = `
CREATE TABLE IF NOT EXISTS semester_gpas (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  semester VARCHAR(20) NOT NULL CHECK (semester IN ('fall', 'spring', 'summer', 'winter')),
  academic_year INTEGER NOT NULL,
  gpa DECIMAL(4,2) NOT NULL,
  total_credits DECIMAL(5,1) NOT NULL,
  courses_count INTEGER NOT NULL,
  grade_distribution JSONB,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tenant_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, semester, academic_year)
);

-- Index for tenant-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_semester_gpas_tenant ON semester_gpas(tenant_id);
-- Index for student queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_semester_gpas_student ON semester_gpas(student_id);
-- Index for university queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_semester_gpas_university ON semester_gpas(university_id);
-- Index for semester/year queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_semester_gpas_semester_year ON semester_gpas(semester, academic_year);
-- Index for GPA queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_semester_gpas_gpa ON semester_gpas(gpa);
`;

module.exports = {
  universitySchema,
  studentSchema,
  userSchema,
  subscriptionPlansSchema,
  universitySubscriptionsSchema,
  billingRecordsSchema,
  paymentRecordsSchema,
  facultySchema,
  departmentSchema,
  programSchema,
  courseSchema,
  courseEnrollmentSchema,
  resultSubmissionSchema,
  gradingScaleSchema,
  gradingScaleDetailsSchema,
  semesterGPASchema