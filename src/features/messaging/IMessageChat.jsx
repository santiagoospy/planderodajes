import { useState, useEffect, useRef } from 'react'
import { Icon } from '../../components/ui/Icon'
import { api } from '../../services/api'

const CHAT_COLORS = ['#0A84FF','#30D158','#FF9F0A','#FF375F','#BF5AF2','#32ADE6','#FF6961','#FFCC00']

const fmtTime = (ts) => new Date(ts).toLocaleTimeString('es-AR',{ hour:'2-digit', minute:'2-digit' })
const fmtDay  = (ts) => new Date(ts).toLocaleDateString('es-AR',{ weekday:'short', day:'numeric', month:'short' })

export default function IMessageChat({ project, isAdmin, projectId }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft]       = useState('')
  const [author, setAuthor]     = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [open, setOpen]         = useState(() => {
    try { return localStorage.getItem('pdr:chat-open') !== 'false' } catch { return true }
  })
  const endRef   = useRef(null)
  const inputRef = useRef(null)

  const toggleOpen = () => setOpen(v => {
    const next = !v
    try { localStorage.setItem('pdr:chat-open', String(next)) } catch {}
    return next
  })

  // Load chat from API
  useEffect(() => {
    if (!projectId) return
    api.getDeptData(projectId, '_global', 'chat')
      .then(data => { if (Array.isArray(data)) setMessages(data) })
      .catch(() => {})
  }, [projectId])

  // Scroll to latest
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  // Participants: depts + produccion fallback
  const participants = [
    { key:'produccion', label:'Producción', icon:'Clapperboard' },
    ...Object.entries(project.depts || {})
      .filter(([k]) => k !== 'produccion')
      .map(([k,m]) => ({ key:k, label:m.label, icon:m.icon || 'User' }))
  ]

  const colorMap = {}
  participants.forEach((p,i) => { colorMap[p.key] = CHAT_COLORS[i % CHAT_COLORS.length] })

  const saveChat = (msgs) => {
    if (!projectId) return
    api.saveDeptData(projectId, '_global', 'chat', msgs).catch(() => {})
  }

  const sendMsg = () => {
    if (!draft.trim() || !author) return
    const p = participants.find(x => x.key === author)
    const newMsg = {
      id: 'cm_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      authorKey: author,
      authorLabel: p?.label || author,
      authorIcon: p?.icon || 'User',
      text: draft.trim(),
      ts: Date.now(),
    }
    const updated = [...messages, newMsg]
    setMessages(updated)
    saveChat(updated)
    setDraft('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const deleteMsg = (id) => {
    const updated = messages.filter(m => m.id !== id)
    setMessages(updated)
    saveChat(updated)
    setDeleteId(null)
  }

  // Group messages by day
  const grouped = []
  let lastDay = ''
  messages.forEach(m => {
    const day = fmtDay(m.ts)
    if (day !== lastDay) { grouped.push({ type:'day', label:day }); lastDay = day }
    grouped.push({ type:'msg', ...m })
  })

  const selectedAuthorObj = participants.find(p => p.key === author)

  return (
    <div style={{ background:'rgba(0,0,0,0.18)', borderRadius:18, overflow:'hidden', marginBottom:16 }}>
      {/* Header — tap to collapse */}
      <button onClick={toggleOpen} className="tap"
        style={{ width:'100%', padding:'10px 14px 10px', borderBottom: open ? '1px solid rgba(255,255,255,0.08)' : 'none', display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer' }}>
        <Icon name="MessageSquare" size={15} color="rgba(255,255,255,0.9)"/>
        <div style={{ flex:1, fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.55)', letterSpacing:'0.1em', textAlign:'left' }}>CHAT DEL EQUIPO</div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:500, marginRight:6 }}>{messages.length} msg</div>
        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={14} color="rgba(255,255,255,0.35)"/>
      </button>

      {open && <div style={{ maxHeight:260, overflowY:'auto', padding:'10px 12px 6px', display:'flex', flexDirection:'column', gap:2 }}>
        {grouped.length === 0 && (
          <div style={{ textAlign:'center', padding:'24px 0', color:'rgba(255,255,255,0.28)', fontSize:12, fontStyle:'italic' }}>
            Nadie habló todavía. ¡Rompan el hielo!
          </div>
        )}
        {grouped.map((item, idx) => {
          if (item.type === 'day') return (
            <div key={`day-${idx}`} style={{ textAlign:'center', margin:'8px 0 4px' }}>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', background:'rgba(0,0,0,0.2)', borderRadius:20, padding:'2px 10px' }}>{item.label}</span>
            </div>
          )

          const color = colorMap[item.authorKey] || '#0A84FF'
          const isMe  = item.authorKey === author
          return (
            <div key={item.id} style={{ display:'flex', flexDirection:isMe?'row-reverse':'row', alignItems:'flex-end', gap:6, marginBottom:2 }}>
              {!isMe && (
                <div style={{ width:26, height:26, borderRadius:'50%', background:`${color}33`, border:`1.5px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginBottom:2 }}>
                  <Icon name={item.authorIcon||'User'} size={13} color={color}/>
                </div>
              )}
              <div style={{ maxWidth:'72%', display:'flex', flexDirection:'column', alignItems:isMe?'flex-end':'flex-start' }}>
                {!isMe && (
                  <div style={{ fontSize:9, color, fontWeight:700, marginBottom:2, paddingLeft:2, letterSpacing:'0.04em' }}>{item.authorLabel}</div>
                )}
                <div
                  onClick={() => (isAdmin || isMe) && setDeleteId(deleteId===item.id ? null : item.id)}
                  style={{ background:isMe?color:'rgba(255,255,255,0.12)', color:isMe?'#fff':'rgba(255,255,255,0.9)', borderRadius:isMe?'18px 18px 4px 18px':'18px 18px 18px 4px', padding:'7px 12px', fontSize:13, lineHeight:1.4, cursor:(isAdmin||isMe)?'pointer':'default', wordBreak:'break-word', boxShadow:isMe?`0 2px 8px ${color}55`:'0 1px 3px rgba(0,0,0,0.2)' }}>
                  {item.text}
                </div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:2, paddingLeft:2, paddingRight:2 }}>{fmtTime(item.ts)}</div>
                {deleteId===item.id && (isAdmin||isMe) && (
                  <button onClick={() => deleteMsg(item.id)}
                    style={{ fontSize:10, color:'#FF375F', background:'rgba(255,55,95,0.12)', border:'1px solid rgba(255,55,95,0.3)', borderRadius:10, padding:'2px 8px', cursor:'pointer', marginTop:2, fontFamily:'inherit', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                    <Icon name="Trash2" size={13} color="currentColor"/> Eliminar
                  </button>
                )}
              </div>
            </div>
          )
        })}
        <div ref={endRef}/>
      </div>}

      {open && <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', padding:'8px 10px 10px' }}>
        {!author ? (
          <div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginBottom:7, letterSpacing:'0.06em', fontWeight:600 }}>¿QUIÉN SOS?</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {participants.map(p => (
                <button key={p.key} onClick={() => setAuthor(p.key)}
                  style={{ fontFamily:'inherit', fontSize:11, fontWeight:600, padding:'5px 12px', borderRadius:20, cursor:'pointer', background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.2)', display:'inline-flex', alignItems:'center', gap:5 }}>
                  <Icon name={p.icon||'User'} size={12} color="rgba(255,255,255,0.8)"/> {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={() => setAuthor('')} title="Cambiar"
              style={{ width:30, height:30, borderRadius:'50%', background:`${colorMap[author]}33`, border:`1.5px solid ${colorMap[author]}`, color:'#fff', cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name={selectedAuthorObj?.icon||'User'} size={14} color={colorMap[author]||'#fff'}/>
            </button>
            <div style={{ flex:1, display:'flex', alignItems:'center', background:'rgba(255,255,255,0.1)', borderRadius:22, border:'1px solid rgba(255,255,255,0.18)', padding:'0 4px 0 12px', gap:4 }}>
              <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
                placeholder="Escribí un mensaje..."
                style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:13, color:'rgba(255,255,255,0.9)', fontFamily:'inherit', padding:'8px 0', minWidth:0 }}/>
              <button onClick={sendMsg} disabled={!draft.trim()}
                style={{ width:30, height:30, borderRadius:'50%', background:draft.trim()?colorMap[author]:'rgba(255,255,255,0.1)', border:'none', cursor:draft.trim()?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.2s' }}>
                <Icon name="ArrowUp" size={16} color={draft.trim()?'#fff':'rgba(255,255,255,0.3)'}/>
              </button>
            </div>
          </div>
        )}
      </div>}
    </div>
  )
}
