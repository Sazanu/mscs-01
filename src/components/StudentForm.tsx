import { useEffect, useState, type FormEvent } from 'react';
import { User, Phone, Mail, MapPin, Calendar, School, AlertCircle } from 'lucide-react';
import {
  GENDERS,
  STUDENT_STATUSES,
  type StudentFormData,
  type AcademicYear,
  type SchoolClass,
  type Student,
} from '@/types/student';

type Props = {
  initialData?: Partial<StudentFormData>;
  academicYears: AcademicYear[];
  classes: SchoolClass[];
  onSubmit: (data: StudentFormData) => Promise<void>;
  submitLabel: string;
  onCancel: () => void;
  studentId?: string;
};

const emptyForm: StudentFormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  gender: 'male',
  dateOfBirth: '',
  nationality: 'Ghanaian',
  admissionNumber: '',
  admissionDate: new Date().toISOString().slice(0, 10),
  academicYearId: '',
  classId: '',
  previousSchool: '',
  status: 'active',
  guardianName: '',
  guardianRelationship: '',
  guardianPhone: '',
  guardianAlternativePhone: '',
  guardianEmail: '',
  guardianAddress: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
};

function studentToForm(student: Student): StudentFormData {
  return {
    firstName: student.firstName,
    middleName: student.middleName ?? '',
    lastName: student.lastName,
    gender: student.gender,
    dateOfBirth: student.dateOfBirth,
    nationality: student.nationality,
    admissionNumber: student.admissionNumber,
    admissionDate: student.admissionDate,
    academicYearId: student.academicYearId,
    classId: student.classId,
    previousSchool: student.previousSchool ?? '',
    status: student.status,
    guardianName: student.guardian?.name ?? '',
    guardianRelationship: student.guardian?.relationship ?? '',
    guardianPhone: student.guardian?.phone ?? '',
    guardianAlternativePhone: student.guardian?.alternativePhone ?? '',
    guardianEmail: student.guardian?.email ?? '',
    guardianAddress: student.guardian?.address ?? '',
    emergencyContactName: student.emergencyContact?.name ?? '',
    emergencyContactPhone: student.emergencyContact?.phone ?? '',
    emergencyContactRelationship: student.emergencyContact?.relationship ?? '',
  };
}

type FieldErrors = Partial<Record<keyof StudentFormData, string>>;

function validate(data: StudentFormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.firstName.trim()) errors.firstName = 'First name is required';
  if (!data.lastName.trim()) errors.lastName = 'Surname is required';
  if (!data.gender) errors.gender = 'Gender is required';
  if (!data.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
  if (!data.nationality.trim()) errors.nationality = 'Nationality is required';
  if (!data.admissionNumber.trim()) errors.admissionNumber = 'Admission number is required';
  if (!data.admissionDate) errors.admissionDate = 'Admission date is required';
  if (!data.academicYearId) errors.academicYearId = 'Academic year is required';
  if (!data.classId) errors.classId = 'Class is required';
  if (!data.guardianName.trim()) errors.guardianName = 'Parent/guardian name is required';
  if (!data.guardianRelationship.trim()) errors.guardianRelationship = 'Relationship is required';
  if (!data.guardianPhone.trim()) errors.guardianPhone = 'Phone number is required';
  if (data.guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guardianEmail))
    errors.guardianEmail = 'Enter a valid email address';
  if (data.emergencyContactName && !data.emergencyContactPhone)
    errors.emergencyContactPhone = 'Emergency contact phone is required when name is provided';
  return errors;
}

export function StudentForm({ initialData, academicYears, classes, onSubmit, submitLabel, onCancel, studentId }: Props) {
  const [formData, setFormData] = useState<StudentFormData>(() => {
    if (initialData && (initialData as Student).id) {
      return studentToForm(initialData as Student);
    }
    return { ...emptyForm, ...initialData };
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!formData.academicYearId && academicYears.length > 0) {
      const current = academicYears.find((y) => y.isCurrent);
      setFormData((prev) => ({ ...prev, academicYearId: current?.id ?? academicYears[0].id }));
    }
  }, [academicYears, formData.academicYearId]);

  const filteredClasses = formData.academicYearId
    ? classes.filter((c) => c.academicYearId === formData.academicYearId || !c.academicYearId)
    : classes;

  const update = (field: keyof StudentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const foundErrors = validate(formData);
    if (Object.keys(foundErrors).length > 0) {
      setErrors(foundErrors);
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit(formData);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to save student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: keyof StudentFormData) =>
    `student-input ${errors[field] ? 'student-input-error' : ''}`;

  return (
    <form onSubmit={handleSubmit} className="student-form">
      <fieldset className="form-section">
        <legend><User size={16} /> Personal Information</legend>
        <div className="form-grid-3">
          <div className="form-field">
            <label htmlFor="firstName">First name <span className="req">*</span></label>
            <input id="firstName" className={inputClass('firstName')} value={formData.firstName}
              onChange={(e) => update('firstName', e.target.value)} placeholder="Adwoa" />
            {errors.firstName && <span className="field-error"><AlertCircle size={12} /> {errors.firstName}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="middleName">Middle name</label>
            <input id="middleName" className={inputClass('middleName')} value={formData.middleName}
              onChange={(e) => update('middleName', e.target.value)} placeholder="Mensah" />
          </div>
          <div className="form-field">
            <label htmlFor="lastName">Surname <span className="req">*</span></label>
            <input id="lastName" className={inputClass('lastName')} value={formData.lastName}
              onChange={(e) => update('lastName', e.target.value)} placeholder="Owusu" />
            {errors.lastName && <span className="field-error"><AlertCircle size={12} /> {errors.lastName}</span>}
          </div>
        </div>
        <div className="form-grid-3">
          <div className="form-field">
            <label htmlFor="gender">Gender <span className="req">*</span></label>
            <select id="gender" className={inputClass('gender')} value={formData.gender}
              onChange={(e) => update('gender', e.target.value)}>
              {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="dateOfBirth">Date of birth <span className="req">*</span></label>
            <input id="dateOfBirth" type="date" className={inputClass('dateOfBirth')} value={formData.dateOfBirth}
              onChange={(e) => update('dateOfBirth', e.target.value)} />
            {errors.dateOfBirth && <span className="field-error"><AlertCircle size={12} /> {errors.dateOfBirth}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="nationality">Nationality <span className="req">*</span></label>
            <input id="nationality" className={inputClass('nationality')} value={formData.nationality}
              onChange={(e) => update('nationality', e.target.value)} placeholder="Ghanaian" />
            {errors.nationality && <span className="field-error"><AlertCircle size={12} /> {errors.nationality}</span>}
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend><School size={16} /> Academic Information</legend>
        <div className="form-grid-3">
          <div className="form-field">
            <label htmlFor="admissionNumber">Admission number <span className="req">*</span></label>
            <input id="admissionNumber" className={inputClass('admissionNumber')} value={formData.admissionNumber}
              onChange={(e) => update('admissionNumber', e.target.value)} placeholder="MCS/2026/001" />
            {errors.admissionNumber && <span className="field-error"><AlertCircle size={12} /> {errors.admissionNumber}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="admissionDate">Admission date <span className="req">*</span></label>
            <input id="admissionDate" type="date" className={inputClass('admissionDate')} value={formData.admissionDate}
              onChange={(e) => update('admissionDate', e.target.value)} />
            {errors.admissionDate && <span className="field-error"><AlertCircle size={12} /> {errors.admissionDate}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="status">Student status <span className="req">*</span></label>
            <select id="status" className={inputClass('status')} value={formData.status}
              onChange={(e) => update('status', e.target.value)}>
              {STUDENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="academicYearId">Academic year <span className="req">*</span></label>
            <select id="academicYearId" className={inputClass('academicYearId')} value={formData.academicYearId}
              onChange={(e) => update('academicYearId', e.target.value)}>
              <option value="">Select academic year</option>
              {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            {errors.academicYearId && <span className="field-error"><AlertCircle size={12} /> {errors.academicYearId}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="classId">Class <span className="req">*</span></label>
            <select id="classId" className={inputClass('classId')} value={formData.classId}
              onChange={(e) => update('classId', e.target.value)}>
              <option value="">Select class</option>
              {filteredClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.classId && <span className="field-error"><AlertCircle size={12} /> {errors.classId}</span>}
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="previousSchool">Previous school</label>
          <input id="previousSchool" className={inputClass('previousSchool')} value={formData.previousSchool}
            onChange={(e) => update('previousSchool', e.target.value)} placeholder="Optional" />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend><Phone size={16} /> Parent/Guardian Information</legend>
        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="guardianName">Parent/guardian name <span className="req">*</span></label>
            <input id="guardianName" className={inputClass('guardianName')} value={formData.guardianName}
              onChange={(e) => update('guardianName', e.target.value)} placeholder="Kofi Owusu" />
            {errors.guardianName && <span className="field-error"><AlertCircle size={12} /> {errors.guardianName}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="guardianRelationship">Relationship <span className="req">*</span></label>
            <input id="guardianRelationship" className={inputClass('guardianRelationship')} value={formData.guardianRelationship}
              onChange={(e) => update('guardianRelationship', e.target.value)} placeholder="Father" />
            {errors.guardianRelationship && <span className="field-error"><AlertCircle size={12} /> {errors.guardianRelationship}</span>}
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="guardianPhone">Phone number <span className="req">*</span></label>
            <input id="guardianPhone" className={inputClass('guardianPhone')} value={formData.guardianPhone}
              onChange={(e) => update('guardianPhone', e.target.value)} placeholder="024 123 4567" />
            {errors.guardianPhone && <span className="field-error"><AlertCircle size={12} /> {errors.guardianPhone}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="guardianAlternativePhone">Alternative phone</label>
            <input id="guardianAlternativePhone" className={inputClass('guardianAlternativePhone')} value={formData.guardianAlternativePhone}
              onChange={(e) => update('guardianAlternativePhone', e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="guardianEmail"><Mail size={11} /> Email address</label>
            <input id="guardianEmail" type="email" className={inputClass('guardianEmail')} value={formData.guardianEmail}
              onChange={(e) => update('guardianEmail', e.target.value)} placeholder="parent@example.com" />
            {errors.guardianEmail && <span className="field-error"><AlertCircle size={12} /> {errors.guardianEmail}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="guardianAddress"><MapPin size={11} /> Residential address</label>
            <input id="guardianAddress" className={inputClass('guardianAddress')} value={formData.guardianAddress}
              onChange={(e) => update('guardianAddress', e.target.value)} placeholder="Optional" />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend><AlertCircle size={16} /> Emergency Contact</legend>
        <div className="form-grid-3">
          <div className="form-field">
            <label htmlFor="emergencyContactName">Contact name</label>
            <input id="emergencyContactName" className={inputClass('emergencyContactName')} value={formData.emergencyContactName}
              onChange={(e) => update('emergencyContactName', e.target.value)} placeholder="Optional" />
          </div>
          <div className="form-field">
            <label htmlFor="emergencyContactPhone">Contact phone</label>
            <input id="emergencyContactPhone" className={inputClass('emergencyContactPhone')} value={formData.emergencyContactPhone}
              onChange={(e) => update('emergencyContactPhone', e.target.value)} placeholder="Optional" />
            {errors.emergencyContactPhone && <span className="field-error"><AlertCircle size={12} /> {errors.emergencyContactPhone}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="emergencyContactRelationship">Relationship</label>
            <input id="emergencyContactRelationship" className={inputClass('emergencyContactRelationship')} value={formData.emergencyContactRelationship}
              onChange={(e) => update('emergencyContactRelationship', e.target.value)} placeholder="Optional" />
          </div>
        </div>
      </fieldset>

      {submitError && <div className="auth-alert">{submitError}</div>}

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
      {studentId && <p className="form-meta"><Calendar size={11} /> Student ID: {studentId}</p>}
    </form>
  );
}
