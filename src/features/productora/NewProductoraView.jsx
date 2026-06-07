import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { storage } from '../../services/storage';
import { hashPin } from '../../utils/hash';
import { THEMES as WORKSPACE_THEMES } from '../../constants/themes';

const productoraSlug = (text) => {
    return (text || '').toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
};

export const NewProductoraView = ({ onCreated, onCancel }) => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [slugManual, setSlugManual] = useState(false);
    const [slug, setSlug] = useState('');
    const [colorTheme, setColorTheme] = useState('celeste');

    useEffect(() => {
        if (!slugManual) setSlug(productoraSlug(name));
    }, [name, slugManual]);

    const submit = async () => {
        setError('');
        if (!name.trim()) return setError('Nombre obligatorio');
        if (!slug.trim()) return setError('URL obligatoria');
        if (password.length < 4) return setError('La contraseña debe tener al menos 4 caracteres');
        if (password !== password2) return setError('Las contraseñas no coinciden');

        setCreating(true);
        try {
            const existing = await api.getProductora(slug);
            if (existing !== null) {
                setError(`El nombre "${slug}" ya está en uso. Probá otro.`);
                setCreating(false);
                return;
            }
            const passwordHash = await hashPin(password)
            const prod = {
                id: slug,
                name: name.trim(),
                passwordHash,
                colorTheme: colorTheme,
                createdAt: Date.now(),
            };
            await api.saveProductora(slug, prod);
            storage.setProductora(slug, prod);
            try { localStorage.setItem(`prod_pwd_${slug}`, passwordHash); } catch { }
            onCreated(prod);
        } catch (e) {
            setError('Error de conexión: ' + (e.message || ''));
            setCreating(false);
        }
    };

    const baseUrl = window.location.origin + window.location.pathname;

    return (
        <div style={{ minHeight: '100dvh', background: 'linear-gradient(165deg, #084C5A 0%, #0B7285 50%, #2EC4B6 100%)', padding: '0 20px 40px', fontFamily: 'inherit' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>
                <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 13, color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>← Cancelar</button>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.5px' }}>Creá el nombre de la carpeta o productora</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 28, lineHeight: 1.6 }}>
                    Creá un espacio privado para tu trabajo. Solamente quienes tengan la contraseña podrán ver tus proyectos.
                </div>

                <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '22px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 600 }}>TU NOMBRE O TU PRODUCTORA *</div>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Juan García, Mi Productora"
                        style={{ width: '100%', fontFamily: 'inherit', fontSize: 15, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '12px 14px', color: '#fff', outline: 'none', marginBottom: 18, boxSizing: 'border-box' }} />

                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 600 }}>URL GENERAL PARA ENTRAR DIRECTAMENTE *</div>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, overflow: 'hidden', marginBottom: 6 }}>
                        <span style={{ padding: '12px 0 12px 14px', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>?p=</span>
                        <input value={slug} onChange={e => { setSlug(productoraSlug(e.target.value)); setSlugManual(true); }}
                            placeholder="mi-carpeta"
                            style={{ flex: 1, fontFamily: 'inherit', fontSize: 15, fontWeight: 700, background: 'transparent', border: 'none', padding: '12px 14px 12px 0', color: '#fff', outline: 'none' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 18, wordBreak: 'break-all' }}>{baseUrl}?p={slug || '...'}</div>

                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 600 }}>CONTRASEÑA *</div>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 4 caracteres"
                        style={{ width: '100%', fontFamily: 'inherit', fontSize: 15, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '12px 14px', color: '#fff', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />

                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 600 }}>REPETIR CONTRASEÑA *</div>
                    <input type="password" value={password2} onChange={e => setPassword2(e.target.value)} placeholder="Confirmar"
                        onKeyDown={e => { if(e.key === 'Enter') submit(); }}
                        style={{ width: '100%', fontFamily: 'inherit', fontSize: 15, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '12px 14px', color: '#fff', outline: 'none', marginBottom: 6, boxSizing: 'border-box' }} />

                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600, marginTop: 18 }}>COLOR DEL ESPACIO</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                        {Object.entries(WORKSPACE_THEMES).map(([key, theme]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setColorTheme(key)}
                                title={theme.label}
                                style={{
                                    width: colorTheme === key ? 36 : 26,
                                    height: colorTheme === key ? 36 : 26,
                                    borderRadius: '50%',
                                    background: theme.grad,
                                    border: colorTheme === key ? '3px solid #fff' : '2px solid rgba(255,255,255,0.3)',
                                    boxShadow: colorTheme === key ? '0 0 0 2px rgba(0,0,0,0.3)' : 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    flexShrink: 0,
                                    transition: 'all 0.15s',
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 18 }}>{WORKSPACE_THEMES[colorTheme]?.label}</div>

                    <div style={{ fontSize: 11, color: '#F59E0B', background: '#1a1410', padding: '12px 14px', borderRadius: 8, border: '1px solid #3a2a14', marginTop: 0, lineHeight: 1.5 }}>
                        🔒 Guardá esta contraseña: si la perdés no podrás recuperarla. <br />
                        Compartila solo con tu equipo de confianza.
                    </div>

                    {error && <div style={{ fontSize: 12, color: 'rgba(255,200,160,0.9)', marginTop: 12, textAlign: 'center', fontWeight: 600 }}>{error}</div>}

                    <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                        <button onClick={onCancel} disabled={creating}
                            style={{ flex: 1, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '14px', cursor: 'pointer' }}>
                            Cancelar
                        </button>
                        <button onClick={submit} disabled={creating}
                            style={{ flex: 2, fontFamily: 'inherit', fontSize: 15, fontWeight: 700, background: creating ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.95)', color: creating ? 'rgba(255,255,255,0.4)' : '#0B7285', border: 'none', borderRadius: 12, padding: '15px 20px', cursor: creating ? 'wait' : 'pointer', transition: 'all 0.15s' }}>
                            {creating ? 'Creando...' : 'Crear productora'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
