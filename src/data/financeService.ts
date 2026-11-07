import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { fetchAllStudents, fetchClasses } from '@/data/studentService';

const FEE_STRUCTURES_COLLECTION = 'feeStructures';
const STUDENT_FEES_COLLECTION = 'studentFees';
const PAYMENTS_COLLECTION = 'payments';

export type FeeItem = {
  name: string;
  description?: string;
  amount: number;
  mandatory: boolean;
};

export type FeeStructure = {
  id: string;
  schoolId: string;
  academicYearId: string;
  termId?: string;
  classId?: string;
  name: string;
  items: FeeItem[];
  totalAmount: number;
  currency: string;
  active: boolean;
};

export type StudentFee = {
  id: string;
  schoolId: string;
  academicYearId: string;
  termId?: string;
  studentId: string;
  classId: string;
  feeStructureId: string;
  totalDue: number;
  discount: number;
  waiver: number;
  amountPaid: number;
  balance: number;
  status: 'unpaid' | 'partiallyPaid' | 'paid' | 'overdue' | 'waived';
};

export type Payment = {
  id: string;
  schoolId: string;
  studentId: string;
  studentFeeId?: string;
  academicYearId?: string;
  termId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  reference: string;
  description?: string;
  paymentDate: string;
  recordedBy: string;
  status: string;
};

function snapshotToFeeStructure(d: DocumentSnapshot<DocumentData>): FeeStructure {
  const data = d.data()!;
  return {
    id: d.id,
    schoolId: data.schoolId ?? '',
    academicYearId: data.academicYearId ?? '',
    termId: data.termId,
    classId: data.classId,
    name: data.name ?? '',
    items: data.items ?? [],
    totalAmount: data.totalAmount ?? 0,
    currency: data.currency ?? 'GHS',
    active: data.active ?? true,
  };
}

function snapshotToStudentFee(d: DocumentSnapshot<DocumentData>): StudentFee {
  const data = d.data()!;
  return {
    id: d.id,
    schoolId: data.schoolId ?? '',
    academicYearId: data.academicYearId ?? '',
    termId: data.termId,
    studentId: data.studentId ?? '',
    classId: data.classId ?? '',
    feeStructureId: data.feeStructureId ?? '',
    totalDue: data.totalDue ?? 0,
    discount: data.discount ?? 0,
    waiver: data.waiver ?? 0,
    amountPaid: data.amountPaid ?? 0,
    balance: data.balance ?? 0,
    status: (data.status as StudentFee['status']) ?? 'unpaid',
  };
}

function snapshotToPayment(d: DocumentSnapshot<DocumentData>): Payment {
  const data = d.data()!;
  return {
    id: d.id,
    schoolId: data.schoolId ?? '',
    studentId: data.studentId ?? '',
    studentFeeId: data.studentFeeId,
    academicYearId: data.academicYearId,
    termId: data.termId,
    amount: data.amount ?? 0,
    currency: data.currency ?? 'GHS',
    paymentMethod: data.paymentMethod ?? 'cash',
    reference: data.reference ?? '',
    description: data.description,
    paymentDate: data.paymentDate ?? '',
    recordedBy: data.recordedBy ?? '',
    status: data.status ?? 'completed',
  };
}

export async function fetchFeeStructures(schoolId: string): Promise<FeeStructure[]> {
  if (!firestore) return [];
  const q = query(collection(firestore, FEE_STRUCTURES_COLLECTION), where('schoolId', '==', schoolId), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => snapshotToFeeStructure(d));
}

export async function createFeeStructure(
  schoolId: string,
  data: { academicYearId: string; termId?: string; classId?: string; name: string; items: FeeItem[]; currency: string },
): Promise<string> {
  if (!firestore) throw new Error('Firebase is not configured.');
  const totalAmount = data.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const docRef = await addDoc(collection(firestore, FEE_STRUCTURES_COLLECTION), {
    schoolId,
    academicYearId: data.academicYearId,
    termId: data.termId ?? null,
    classId: data.classId ?? null,
    name: data.name.trim(),
    items: data.items,
    totalAmount,
    currency: data.currency || 'GHS',
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteFeeStructure(id: string): Promise<void> {
  if (!firestore) throw new Error('Firebase is not configured.');
  await deleteDoc(doc(firestore, FEE_STRUCTURES_COLLECTION, id));
}

export async function fetchStudentFees(schoolId: string): Promise<StudentFee[]> {
  if (!firestore) return [];
  const q = query(collection(firestore, STUDENT_FEES_COLLECTION), where('schoolId', '==', schoolId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => snapshotToStudentFee(d));
}

export async function fetchPayments(schoolId: string): Promise<Payment[]> {
  if (!firestore) return [];
  const q = query(collection(firestore, PAYMENTS_COLLECTION), where('schoolId', '==', schoolId), orderBy('paymentDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => snapshotToPayment(d));
}

export async function recordPayment(
  schoolId: string,
  data: {
    studentId: string;
    studentFeeId?: string;
    academicYearId?: string;
    termId?: string;
    amount: number;
    paymentMethod: string;
    reference: string;
    description?: string;
    paymentDate: string;
    recordedBy: string;
  },
): Promise<string> {
  if (!firestore) throw new Error('Firebase is not configured.');

  const docRef = await addDoc(collection(firestore, PAYMENTS_COLLECTION), {
    schoolId,
    studentId: data.studentId,
    studentFeeId: data.studentFeeId ?? null,
    academicYearId: data.academicYearId ?? null,
    termId: data.termId ?? null,
    amount: data.amount,
    currency: 'GHS',
    paymentMethod: data.paymentMethod,
    reference: data.reference.trim(),
    description: data.description ?? null,
    paymentDate: data.paymentDate,
    recordedBy: data.recordedBy,
    status: 'completed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (data.studentFeeId) {
    const feeRef = doc(firestore, STUDENT_FEES_COLLECTION, data.studentFeeId);
    const feeSnap = await getDoc(feeRef);
    if (feeSnap.exists()) {
      const fee = feeSnap.data();
      const newAmountPaid = (fee.amountPaid ?? 0) + data.amount;
      const totalDue = fee.totalDue ?? 0;
      const discount = fee.discount ?? 0;
      const waiver = fee.waiver ?? 0;
      const netDue = totalDue - discount - waiver;
      const balance = Math.max(0, netDue - newAmountPaid);
      const status = balance <= 0 ? 'paid' : newAmountPaid > 0 ? 'partiallyPaid' : 'unpaid';
      await updateDoc(feeRef, {
        amountPaid: newAmountPaid,
        balance,
        status,
        updatedAt: serverTimestamp(),
      });
    }
  }

  return docRef.id;
}

export type FinanceSummary = {
  totalCollected: number;
  totalOutstanding: number;
  totalExpected: number;
  paymentCount: number;
  collectionRate: number;
};

export async function generateFinanceSummary(schoolId: string): Promise<FinanceSummary> {
  const [studentFees, payments] = await Promise.all([
    fetchStudentFees(schoolId),
    fetchPayments(schoolId),
  ]);

  const totalExpected = studentFees.reduce((sum, f) => sum + (f.totalDue - f.discount - f.waiver), 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = Math.max(0, totalExpected - totalCollected);
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  return {
    totalCollected,
    totalOutstanding,
    totalExpected,
    paymentCount: payments.length,
    collectionRate,
  };
}

export async function generateFinanceReport(schoolId: string): Promise<{
  summary: FinanceSummary;
  payments: Payment[];
  studentFees: StudentFee[];
  studentNames: Map<string, string>;
  classNames: Map<string, string>;
}> {
  const [payments, studentFees, students, classes] = await Promise.all([
    fetchPayments(schoolId),
    fetchStudentFees(schoolId),
    fetchAllStudents(schoolId),
    fetchClasses(schoolId),
  ]);

  const summary = await generateFinanceSummary(schoolId);
  const studentNames = new Map(students.map((s) => [s.id, s.fullName]));
  const classNames = new Map(classes.map((c) => [c.id, c.name]));

  return { summary, payments, studentFees, studentNames, classNames };
}
