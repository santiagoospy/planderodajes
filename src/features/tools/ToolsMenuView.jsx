import { Sun, Thermometer, Video, Clapperboard, ChevronRight } from 'lucide-react';

export const ToolsMenuView = ({ onBack, onSelectTool }) => {
  const tools = [
    { key: 'sun-ar', icon: Sun, title: 'Sun AR', desc: 'Trayectoria del sol en tiempo real' },
    { key: 'color-temp', icon: Thermometer, title: 'Color Temperature', desc: 'Temperatura de color en Kelvin' },
    { key: 'viewfinder', icon: Video, title: "Director's Viewfinder", desc: 'Previsualización por sensor + lente' },
    { key: 'claqueta', icon: Clapperboard, title: 'Claqueta', desc: 'Sincronización con sonido' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', padding: '52px 20px 20px' }} className="slide-l">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <button onClick={onBack} className="tap" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>
          ←
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'inherit' }}>Herramientas</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tools.map(tool => {
          const IconComponent = tool.icon;
          return (
            <button
              key={tool.key}
              onClick={() => onSelectTool(tool.key)}
              className="tap"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '18px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 14,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left'
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-card-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconComponent size={22} color="var(--text-primary)" strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{tool.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{tool.desc}</div>
              </div>
              <ChevronRight size={16} color="var(--text-light)" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
