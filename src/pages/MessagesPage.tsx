import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Send, Inbox, ArrowUpRight, MailOpen, MailCheck, Plus, X } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import {
  fetchMessagesForUser,
  fetchUserDirectory,
  sendMessage,
  markMessageRead,
  type Message,
  type UserDirectoryEntry,
} from '@/data/messageService';

type Tab = 'inbox' | 'sent';

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function MessagesPage() {
  const { profile } = useAuth();
  const schoolId = profile?.schoolId ?? '';
  const userId = profile?.uid ?? '';

  const [tab, setTab] = useState<Tab>('inbox');
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [directory, setDirectory] = useState<UserDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const [form, setForm] = useState({
    recipientId: '',
    subject: '',
    body: '',
  });

  const loadData = useCallback(async () => {
    if (!schoolId || !userId) return;
    setLoading(true);
    setError('');
    try {
      const [msgs, dir] = await Promise.all([
        fetchMessagesForUser(schoolId, userId),
        fetchUserDirectory(schoolId),
      ]);
      setInbox(msgs.inbox);
      setSent(msgs.sent);
      setDirectory(dir.filter((u) => u.uid !== userId && u.active));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load messages.');
    } finally {
      setLoading(false);
    }
  }, [schoolId, userId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(''), 3000);
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.recipientId || !form.subject.trim() || !form.body.trim() || !profile) return;
    const recipient = directory.find((u) => u.id === form.recipientId || u.uid === form.recipientId);
    if (!recipient) return;
    try {
      await sendMessage(schoolId, {
        senderId: profile.uid,
        senderName: profile.displayName,
        senderRole: profile.role,
        recipientId: recipient.uid || recipient.id,
        recipientName: recipient.displayName,
        subject: form.subject,
        body: form.body,
      });
      setForm({ recipientId: '', subject: '', body: '' });
      setShowCompose(false);
      showSuccess('Message sent.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    }
  };

  const handleMessageClick = async (msg: Message) => {
    setSelectedMessage(msg);
    if (!msg.read && msg.recipientId === userId) {
      try {
        await markMessageRead(msg.id);
        setInbox((prev) => prev.map((m) => m.id === msg.id ? { ...m, read: true } : m));
      } catch { /* non-critical */ }
    }
  };

  const unreadCount = inbox.filter((m) => !m.read).length;

  return (
    <div className="academics-page">
      <div className="academics-header">
        <div>
          <p className="eyebrow">Internal Communication</p>
          <h1>Messages</h1>
          <p className="welcome-copy">Communicate with staff, parents, and students.</p>
        </div>
        <button className="primary-button" onClick={() => setShowCompose(true)}><Plus size={16} /> Compose</button>
      </div>

      {error && <div className="auth-alert" style={{ marginBottom: '16px' }}>{error}</div>}
      {success && <div className="toast" style={{ position: 'static', marginBottom: '16px' }}>{success}</div>}

      <div className="tab-bar">
        <button className={`tab-item ${tab === 'inbox' ? 'tab-active' : ''}`} onClick={() => setTab('inbox')}>
          <Inbox size={15} /> Inbox {unreadCount > 0 && <em className="nav-badge">{unreadCount}</em>}
        </button>
        <button className={`tab-item ${tab === 'sent' ? 'tab-active' : ''}`} onClick={() => setTab('sent')}>
          <ArrowUpRight size={15} /> Sent
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="empty-spinner" /><p>Loading messages…</p></div>
      ) : (
        <>
          {tab === 'inbox' && (
            inbox.length === 0 ? (
              <div className="empty-state"><Inbox size={32} /><h2>No messages</h2><p>Your inbox is empty.</p></div>
            ) : (
              <div className="message-list">
                {inbox.map((msg) => (
                  <button key={msg.id} className={`message-row ${!msg.read ? 'message-unread' : ''}`} onClick={() => handleMessageClick(msg)}>
                    <div className="message-icon">{!msg.read ? <MailOpen size={18} /> : <MailCheck size={18} />}</div>
                    <div className="message-copy">
                      <div className="message-top"><strong>{msg.senderName}</strong><time>{formatDate(msg.createdAt)}</time></div>
                      <span>{msg.subject}</span>
                      <p>{msg.body.slice(0, 80)}{msg.body.length > 80 ? '…' : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}

          {tab === 'sent' && (
            sent.length === 0 ? (
              <div className="empty-state"><ArrowUpRight size={32} /><h2>No sent messages</h2><p>Messages you send will appear here.</p></div>
            ) : (
              <div className="message-list">
                {sent.map((msg) => (
                  <button key={msg.id} className="message-row" onClick={() => setSelectedMessage(msg)}>
                    <div className="message-icon"><ArrowUpRight size={18} /></div>
                    <div className="message-copy">
                      <div className="message-top"><strong>To: {msg.recipientName}</strong><time>{formatDate(msg.createdAt)}</time></div>
                      <span>{msg.subject}</span>
                      <p>{msg.body.slice(0, 80)}{msg.body.length > 80 ? '…' : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}
        </>
      )}

      {showCompose && (
        <div className="modal-overlay" onClick={() => setShowCompose(false)}>
          <div className="modal-card" style={{ width: 'min(100%, 540px)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>New Message</h2>
              <button className="row-action" onClick={() => setShowCompose(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSend} className="academics-form" style={{ marginTop: '10px' }}>
              <div className="form-field">
                <label htmlFor="msgRecipient">To <span className="req">*</span></label>
                <select id="msgRecipient" className="student-input" value={form.recipientId} onChange={(e) => setForm({ ...form, recipientId: e.target.value })}>
                  <option value="">Select recipient</option>
                  {directory.map((u) => <option key={u.id} value={u.uid || u.id}>{u.displayName} — {u.role}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="msgSubject">Subject <span className="req">*</span></label>
                <input id="msgSubject" className="student-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="form-field">
                <label htmlFor="msgBody">Message <span className="req">*</span></label>
                <textarea id="msgBody" className="student-input" rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <button type="submit" className="primary-button"><Send size={16} /> Send message</button>
            </form>
          </div>
        </div>
      )}

      {selectedMessage && (
        <div className="modal-overlay" onClick={() => setSelectedMessage(null)}>
          <div className="modal-card" style={{ width: 'min(100%, 540px)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div><h2>{selectedMessage.subject}</h2></div>
              <button className="row-action" onClick={() => setSelectedMessage(null)}><X size={18} /></button>
            </div>
            <div style={{ marginTop: '8px' }}>
              <p style={{ margin: '0 0 4px', color: '#344258', fontSize: '13px', fontWeight: 600 }}>
                {tab === 'inbox' ? `From: ${selectedMessage.senderName}` : `To: ${selectedMessage.recipientName}`}
              </p>
              <p style={{ margin: '0 0 14px', color: '#99a5b4', fontSize: '11px' }}>{formatDate(selectedMessage.createdAt)}</p>
              <p style={{ margin: 0, color: '#344258', fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedMessage.body}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
