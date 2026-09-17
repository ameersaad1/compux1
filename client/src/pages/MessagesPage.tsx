import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messagesApi, type ConversationSummary } from '../api/messages.api';
import { E2EEService } from '../utils/crypto';
import { Avatar, EmptyState, Spinner } from '../components/primitives';
import type { DirectMessage } from '../types';

interface DecryptedMessage extends DirectMessage {
  plainText: string;
}

export function MessagesPage() {
  const { username } = useParams<{ username?: string }>();
  const { t } = useApp();
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);

  useEffect(() => {
    messagesApi.listConversations().then((r) => setConversations(r.conversations));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
      <aside className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h2 className="px-4 py-3 font-bold text-sm" style={{ borderBottom: '1px solid var(--border)', color: 'var(--foreground)' }}>
          {t.dmTitle}
        </h2>
        {conversations === null && <div className="p-4"><Spinner /></div>}
        {conversations?.length === 0 && <div className="p-6"><EmptyState emoji="💬" title="لا توجد محادثات بعد" /></div>}
        {conversations?.map((c) => (
          <Link
            key={c.partnerId}
            to={`/messages/${c.partner.username}`}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              borderBottom: '1px solid var(--border)',
              background: username === c.partner.username ? 'var(--muted)' : undefined,
            }}
          >
            <Avatar src={c.partner.avatarUrl} name={c.partner.fullName} size={40} />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>{c.partner.fullName}</p>
              <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>@{c.partner.username}</p>
            </div>
          </Link>
        ))}
      </aside>

      <section className="rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)', minHeight: 420 }}>
        {username ? <ConversationView username={username} /> : (
          <div className="h-full flex items-center justify-center p-10">
            <EmptyState emoji="✉️" title="اختر محادثة" sub="أو ابدأ محادثة جديدة من صفحة أي مستخدم." />
          </div>
        )}
      </section>
    </div>
  );
}

function ConversationView({ username }: { username: string }) {
  const { t } = useApp();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<{ id: string; fullName: string; avatarUrl: string | null; identityPublicKey: string | null } | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const decryptAll = useCallback(async (raw: DirectMessage[], otherKey: string | null) => {
    if (!otherKey) return raw.map((m) => ({ ...m, plainText: '[تعذر فك التشفير: لا يوجد مفتاح للطرف الآخر]' }));
    return Promise.all(
      raw.map(async (m) => {
        try {
          const plainText = await E2EEService.decrypt(m.encryptedContent, m.iv, otherKey);
          return { ...m, plainText };
        } catch {
          return { ...m, plainText: '[رسالة غير قابلة للفك]' };
        }
      })
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setError(null);

    messagesApi
      .getHistory(username)
      .then(async ({ partner: p, messages: raw }) => {
        if (cancelled) return;
        setPartner(p);
        const decrypted = await decryptAll(raw, p.identityPublicKey);
        if (!cancelled) setMessages(decrypted);
      })
      .catch(() => setError('تعذر فتح هذه المحادثة.'));

    return () => {
      cancelled = true;
    };
  }, [username, decryptAll]);

  useEffect(() => {
    if (!socket || !partner) return;
    socket.emit('conversation:join', partner.id);

    async function onNewMessage(raw: DirectMessage) {
      if (![raw.senderId, raw.recipientId].includes(partner!.id)) return;
      const [decrypted] = await decryptAll([raw], partner!.identityPublicKey);
      setMessages((prev) => [...prev, decrypted]);
    }

    socket.on('message:new', onNewMessage);
    return () => {
      socket.off('message:new', onNewMessage);
    };
  }, [socket, partner, decryptAll]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send() {
    if (!text.trim() || !socket || !partner) return;
    if (!partner.identityPublicKey) {
      setError('هذا المستخدم لم يفعّل الرسائل المشفرة بعد.');
      return;
    }
    const { encryptedContent, iv } = await E2EEService.encrypt(text.trim(), partner.identityPublicKey);
    socket.emit('message:send', { toUserId: partner.id, encryptedContent, iv }, (res: { error?: string }) => {
      if (res?.error) setError(res.error);
    });
    setText('');
  }

  if (error && !partner) {
    return <div className="p-6"><EmptyState emoji="⚠️" title={error} /></div>;
  }
  if (!partner) return <div className="p-6"><Spinner /></div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => navigate('/messages')} className="md:hidden">←</button>
        <Avatar src={partner.avatarUrl} name={partner.fullName} size={36} />
        <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{partner.fullName}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ maxHeight: 420 }}>
        {messages.map((m) => (
          <div key={m.id} className="flex" style={{ justifyContent: m.senderId === user?.id ? 'flex-end' : 'flex-start' }}>
            <div
              className="max-w-[70%] px-3 py-2 rounded-2xl text-sm"
              style={
                m.senderId === user?.id
                  ? { background: 'linear-gradient(135deg,#6d5ef5,#a855f7)', color: '#fff' }
                  : { background: 'var(--muted)', color: 'var(--foreground)' }
              }
            >
              {m.plainText}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 text-xs" style={{ color: '#ef4444' }}>{error}</p>}

      <div className="flex items-center gap-2 p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={t.typeMessage}
          className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
          style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
        />
        <button onClick={send} className="px-4 py-2 rounded-full text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}>
          {t.send}
        </button>
      </div>
    </div>
  );
}
