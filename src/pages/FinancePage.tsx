import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, Download, WalletCards, CircleDollarSign, TrendingUp, Receipt } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { fetchAcademicYears, fetchAllStudents, fetchClasses } from '@/data/studentService';
import { fetchTerms } from '@/data/academicService';
import { exportToCSV } from '@/data/reportService';
import {
  fetchFeeStructures,
  createFeeStructure,
  deleteFeeStructure,
  fetchPayments,
  recordPayment,
  fetchStudentFees,
  generateFinanceSummary,
  type FeeStructure,
  type Payment,
  type StudentFee,
  type FeeItem,
  type FinanceSummary,
} from '@/data/financeService';
import type { AcademicYear, SchoolClass, Student, Term } from '@/types/student';

type Tab = 'overview' | 'structures' | 'payments';

const PAYMENT_METHODS = ['cash', 'mobileMoney', 'bank', 'card', 'other'];

function formatCurrency(amount: number): string {
  return `GH₵ ${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function FinancePage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId ?? '';
  const userId = profile?.uid ?? '';
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const [structureForm, setStructureForm] = useState({
    name: '',
    academicYearId: '',
    classId: '',
    items: [{ name: 'Tuition', amount: 0, mandatory: true }] as FeeItem[],
  });

  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    amount: 0,
    paymentMethod: 'cash',
    reference: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    description: '',
  });

  const loadData = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError('');
    try {
      const [summ, structures, pays, sFees, studs, cls, yrs] = await Promise.all([
        generateFinanceSummary(schoolId),
        fetchFeeStructures(schoolId),
        fetchPayments(schoolId),
        fetchStudentFees(schoolId),
        fetchAllStudents(schoolId),
        fetchClasses(schoolId),
        fetchAcademicYears(schoolId),
      ]);
      setSummary(summ);
      setFeeStructures(structures);
      setPayments(pays);
      setStudentFees(sFees);
      setStudents(studs);
      setClasses(cls);
      setYears(yrs);
      const currentYear = yrs.find((y) => y.isCurrent);
      if (currentYear) {
        setStructureForm((prev) => ({ ...prev, academicYearId: prev.academicYearId || currentYear.id }));
        const t = await fetchTerms(schoolId, currentYear.id);
        setTerms(t);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load finance data.');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(''), 3000);
  };

  const studentName = (id: string) => students.find((s) => s.id === id)?.fullName ?? 'Unknown';
  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? '—';
  const yearName = (id: string) => years.find((y) => y.id === id)?.name ?? '—';

  const handleAddItem = () => {
    setStructureForm((prev) => ({
      ...prev,
      items: [...prev.items, { name: '', amount: 0, mandatory: false }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setStructureForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof FeeItem, value: string | number | boolean) => {
    setStructureForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  const handleCreateStructure = async (e: FormEvent) => {
    e.preventDefault();
    if (!structureForm.name.trim() || !structureForm.academicYearId) return;
    if (structureForm.items.length === 0) return;
    try {
      await createFeeStructure(schoolId, {
        academicYearId: structureForm.academicYearId,
        classId: structureForm.classId || undefined,
        name: structureForm.name,
        items: structureForm.items.filter((i) => i.name.trim()),
        currency: 'GHS',
      });
      setStructureForm({ name: '', academicYearId: structureForm.academicYearId, classId: '', items: [{ name: 'Tuition', amount: 0, mandatory: true }] });
      showSuccess('Fee structure created.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create fee structure.');
    }
  };

  const handleRecordPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!paymentForm.studentId || paymentForm.amount <= 0) return;
    try {
      const matchingFee = studentFees.find((f) => f.studentId === paymentForm.studentId);
      await recordPayment(schoolId, {
        studentId: paymentForm.studentId,
        studentFeeId: matchingFee?.id,
        amount: paymentForm.amount,
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference || `PAY-${Date.now()}`,
        description: paymentForm.description || undefined,
        paymentDate: paymentForm.paymentDate,
        recordedBy: userId,
      });
      setPaymentForm({ studentId: '', amount: 0, paymentMethod: 'cash', reference: '', paymentDate: new Date().toISOString().slice(0, 10), description: '' });
      showSuccess('Payment recorded.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record payment.');
    }
  };

  const handleExportPayments = () => {
    if (payments.length === 0) return;
    exportToCSV('payments.csv',
      ['Student', 'Amount', 'Method', 'Reference', 'Date', 'Status'],
      payments.map((p) => [studentName(p.studentId), p.amount, p.paymentMethod, p.reference, p.paymentDate, p.status]),
    );
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteFeeStructure(confirmDelete.id);
      setConfirmDelete(null);
      showSuccess('Fee structure deleted.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete.');
    }
  };

  return (
    <div className="academics-page">
      <div className="academics-header">
        <div>
          <p className="eyebrow">Finance Management</p>
          <h1>Finance</h1>
          <p className="welcome-copy">Manage fee structures, record payments, and track collections.</p>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-item ${tab === 'overview' ? 'tab-active' : ''}`} onClick={() => setTab('overview')}><TrendingUp size={15} /> Overview</button>
        <button className={`tab-item ${tab === 'structures' ? 'tab-active' : ''}`} onClick={() => setTab('structures')}><WalletCards size={15} /> Fee Structures</button>
        <button className={`tab-item ${tab === 'payments' ? 'tab-active' : ''}`} onClick={() => setTab('payments')}><CircleDollarSign size={15} /> Payments</button>
      </div>

      {error && <div className="auth-alert" style={{ marginBottom: '16px' }}>{error}</div>}
      {success && <div className="toast" style={{ position: 'static', marginBottom: '16px' }}>{success}</div>}

      {loading ? (
        <div className="empty-state"><div className="empty-spinner" /><p>Loading finance data…</p></div>
      ) : (
        <>
          {tab === 'overview' && summary && (
            <div className="academics-grid">
              <section className="panel academics-section">
                <div className="academics-section-heading"><TrendingUp size={18} /><h2>Summary</h2></div>
                <div className="academics-list">
                  <div className="academics-item"><div className="academics-item-copy"><strong>Total collected</strong><span>{formatCurrency(summary.totalCollected)}</span></div></div>
                  <div className="academics-item"><div className="academics-item-copy"><strong>Total outstanding</strong><span>{formatCurrency(summary.totalOutstanding)}</span></div></div>
                  <div className="academics-item"><div className="academics-item-copy"><strong>Total expected</strong><span>{formatCurrency(summary.totalExpected)}</span></div></div>
                  <div className="academics-item"><div className="academics-item-copy"><strong>Collection rate</strong><span>{summary.collectionRate}%</span></div></div>
                  <div className="academics-item"><div className="academics-item-copy"><strong>Payment count</strong><span>{summary.paymentCount}</span></div></div>
                </div>
              </section>

              <section className="panel academics-section">
                <div className="academics-section-heading"><CircleDollarSign size={18} /><h2>Recent Payments</h2><button className="secondary-button" style={{ marginLeft: 'auto' }} onClick={handleExportPayments}><Download size={14} /> CSV</button></div>
                {payments.length === 0 ? (
                  <p className="academics-empty">No payments recorded yet.</p>
                ) : (
                  <div className="academics-list">
                    {payments.slice(0, 10).map((p) => (
                      <div key={p.id} className="academics-item">
                        <div className="academics-item-copy">
                          <strong>{studentName(p.studentId)}</strong>
                          <span>{formatCurrency(p.amount)} · {p.paymentMethod} · {p.paymentDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === 'structures' && (
            <div className="academics-grid">
              <section className="panel academics-section">
                <div className="academics-section-heading"><WalletCards size={18} /><h2>New Fee Structure</h2></div>
                <form onSubmit={handleCreateStructure} className="academics-form">
                  <div className="form-field">
                    <label htmlFor="feeName">Name <span className="req">*</span></label>
                    <input id="feeName" className="student-input" value={structureForm.name} onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })} placeholder="Term 1 Fees" />
                  </div>
                  <div className="form-grid-2">
                    <div className="form-field">
                      <label htmlFor="feeYear">Academic year <span className="req">*</span></label>
                      <select id="feeYear" className="student-input" value={structureForm.academicYearId} onChange={(e) => setStructureForm({ ...structureForm, academicYearId: e.target.value })}>
                        <option value="">Select year</option>
                        {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                      </select>
                    </div>
                    <div className="form-field">
                      <label htmlFor="feeClass">Class (optional)</label>
                      <select id="feeClass" className="student-input" value={structureForm.classId} onChange={(e) => setStructureForm({ ...structureForm, classId: e.target.value })}>
                        <option value="">All classes</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label>Fee items</label>
                    {structureForm.items.map((item, i) => (
                      <div key={i} className="finance-item-row">
                        <input className="student-input" placeholder="Item name" value={item.name} onChange={(e) => handleItemChange(i, 'name', e.target.value)} />
                        <input className="student-input" type="number" placeholder="Amount" value={item.amount || ''} onChange={(e) => handleItemChange(i, 'amount', parseFloat(e.target.value) || 0)} />
                        <label className="checkbox-field"><input type="checkbox" checked={item.mandatory} onChange={(e) => handleItemChange(i, 'mandatory', e.target.checked)} /><span>Mandatory</span></label>
                        <button type="button" className="row-action" title="Remove" onClick={() => handleRemoveItem(i)}><Trash2 size={15} /></button>
                      </div>
                    ))}
                    <button type="button" className="secondary-button" onClick={handleAddItem}><Plus size={14} /> Add item</button>
                  </div>
                  <button type="submit" className="primary-button"><Plus size={16} /> Create fee structure</button>
                </form>
              </section>

              <section className="panel academics-section">
                <div className="academics-section-heading"><WalletCards size={18} /><h2>Existing Structures</h2></div>
                {feeStructures.length === 0 ? (
                  <p className="academics-empty">No fee structures yet.</p>
                ) : (
                  <div className="academics-list">
                    {feeStructures.map((fs) => (
                      <div key={fs.id} className="academics-item">
                        <div className="academics-item-copy">
                          <strong>{fs.name}</strong>
                          <span>{formatCurrency(fs.totalAmount)} · {yearName(fs.academicYearId)}{fs.classId ? ` · ${className(fs.classId)}` : ''} · {fs.items.length} item(s)</span>
                        </div>
                        <button className="row-action" title="Delete" onClick={() => setConfirmDelete({ id: fs.id, name: fs.name })}><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === 'payments' && (
            <div className="academics-grid">
              <section className="panel academics-section">
                <div className="academics-section-heading"><Receipt size={18} /><h2>Record Payment</h2></div>
                <form onSubmit={handleRecordPayment} className="academics-form">
                  <div className="form-field">
                    <label htmlFor="payStudent">Student <span className="req">*</span></label>
                    <select id="payStudent" className="student-input" value={paymentForm.studentId} onChange={(e) => setPaymentForm({ ...paymentForm, studentId: e.target.value })}>
                      <option value="">Select student</option>
                      {students.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                    </select>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-field">
                      <label htmlFor="payAmount">Amount (GHS) <span className="req">*</span></label>
                      <input id="payAmount" type="number" min={0} step="0.01" className="student-input" value={paymentForm.amount || ''} onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="form-field">
                      <label htmlFor="payMethod">Payment method</label>
                      <select id="payMethod" className="student-input" value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}>
                        {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-field">
                      <label htmlFor="payRef">Reference</label>
                      <input id="payRef" className="student-input" value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} placeholder="Auto-generated if blank" />
                    </div>
                    <div className="form-field">
                      <label htmlFor="payDate">Payment date</label>
                      <input id="payDate" type="date" className="student-input" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor="payDesc">Description</label>
                    <input id="payDesc" className="student-input" value={paymentForm.description} onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })} placeholder="Optional note" />
                  </div>
                  <button type="submit" className="primary-button"><Plus size={16} /> Record payment</button>
                </form>
              </section>

              <section className="panel academics-section">
                <div className="academics-section-heading"><Receipt size={18} /><h2>Payment History</h2><button className="secondary-button" style={{ marginLeft: 'auto' }} onClick={handleExportPayments}><Download size={14} /> CSV</button></div>
                {payments.length === 0 ? (
                  <p className="academics-empty">No payments recorded yet.</p>
                ) : (
                  <div className="student-table-wrap">
                    <table className="student-table">
                      <thead><tr><th>Student</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id}><td>{studentName(p.studentId)}</td><td>{formatCurrency(p.amount)}</td><td>{p.paymentMethod}</td><td>{p.paymentDate}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm deletion</h2>
            <p>Delete <strong>{confirmDelete.name}</strong>? This cannot be undone.</p>
            <div className="modal-actions"><div /><div><button className="secondary-button" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="primary-button" onClick={handleDelete} style={{ background: '#dc6b5f' }}>Delete</button></div></div>
          </div>
        </div>
      )}
    </div>
  );
}
