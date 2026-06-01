import { useState, useEffect } from 'react';
import { Mail, MailOpen, ThumbsUp, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

const MessagesView = ({ project, projectId, isAdmin, onBack }) => {
  const [archive, setArchive] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    api.getMsgArchive(projectId).then(data => setArchive(Array.isArray(data) ? data : [])).catch(() => {});
  }, [projectId]);

  const deleteMsg = async (id) => {
    const updated = archive.filter(m => m.id !== id);
    setArchive(updated);
    setDeletingId(null);
    try {
      if (updated.length === 0) {
        await api.deleteDeptData(projectId, '_global', 'msg_archive');
      } else {
        await api.saveDeptData(projectId, '_global', 'msg_archive', updated);
      }
    } catch {}
  };

  const fmt = (ts) => new Date(ts).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }} className="slide-r">
      <div className="theme-surface" style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 20px 18px', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} className="tap pwa-back-top" style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-tertiary)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8, padding: 0 }}>
          ‹ Volver
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Mail size={24} color="var(--text-primary)" />
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'inherit' }}>Mensajes</div>
        </div>
        <div style={{ fontSize: 12, color: '#aaa', fontFamily: 'inherit', marginTop: 2 }}>
          {archive.length} mensaje{archive.length !== 1 ? 's' : ''} archivado{archive.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="has-bottom-bar" style={{ flex: 1, padding: '20px 16px 32px' }}>
        {archive.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ccc', fontFamily: 'inherit' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <MailOpen size={40} color="#ccc" />
            </div>
            <div style={{ fontSize: 14 }}>No hay mensajes archivados todavía.</div>
          </div>
        )}
        {[...archive].reverse().map((m, i) => (
          <div key={m.id || i} style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 16, marginBottom: 12, border: '1px solid var(--border-light)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: '#d48c0e', letterSpacing: '0.08em', fontFamily: 'inherit', fontWeight: 600 }}>MENSAJE GENERAL</div>
              {isAdmin && (
                deletingId === (m.id || i) ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setDeletingId(null)}
                      style={{ fontSize: 10, fontFamily: 'inherit', background: 'var(--bg-card-dark)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '3px 10px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      Cancelar
                    </button>
                    <button onClick={() => deleteMsg(m.id || i)}
                      style={{ fontSize: 10, fontFamily: 'inherit', fontWeight: 700, background: '#FF375F', border: 'none', borderRadius: 8, padding: '3px 10px', cursor: 'pointer', color: '#fff' }}>
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeletingId(m.id || i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)' }}>
                    <Trash2 size={14} />
                  </button>
                )
              )}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit', lineHeight: 1.6, marginBottom: 8 }}>{m.text}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'inherit', marginBottom: 10 }}>{fmt(m.ts)}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {m.acks?.map(k => {
                const d = project.depts[k];
                return d ? (
                  <span key={k} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: '#e8f8f0', color: 'var(--color-success)', fontFamily: 'inherit', border: '1px solid #0fa87e33', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {d.label} <ThumbsUp size={10} color="var(--color-success)" />
                  </span>
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pwa-bottom-bar-wrap no-print">
        <div className="pwa-bottom-bar">
          <button onClick={onBack} className="tap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 20px', borderRadius: 12, color: 'var(--text-secondary)', fontFamily: 'inherit', minWidth: 72 }}>
            <span style={{ fontSize: 22 }}>⌂</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>INICIO</span>
          </button>
          <div style={{ width: 1, height: 36, background: 'var(--border-light)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 20px', color: '#555', fontFamily: 'inherit', minWidth: 72 }}>
            <Mail size={20} color="var(--text-primary)" />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>MENSAJES</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesView;
