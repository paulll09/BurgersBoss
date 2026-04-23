import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ADMIN_EMAIL } from '../../lib/config';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';

const G = '#2d6a2d';
const G_DARK = '#1a4a1a';

const ERROR_MAP = {
    'Invalid login credentials': 'Contraseña incorrecta.',
    'Email not confirmed': 'El email no está confirmado. Revisá tu casilla.',
    'Too many requests': 'Demasiados intentos. Esperá unos minutos.',
    'User not found': 'Usuario no encontrado.',
    'Network request failed': 'Error de conexión. Verificá tu internet.',
};

function traducirError(msg) {
    for (const [en, es] of Object.entries(ERROR_MAP)) {
        if (msg.includes(en)) return es;
    }
    return 'Error al iniciar sesión. Intentá de nuevo.';
}

export default function Login() {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const email = ADMIN_EMAIL;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            toast.error(traducirError(error.message));
        } else {
            toast.success('Bienvenido');
            navigate('/admin/dashboard');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div
                className="w-full max-w-sm rounded-3xl p-8"
                style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}
            >
                {/* Logo / Marca */}
                <div className="text-center mb-8">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'rgba(45,106,45,0.09)' }}
                    >
                        <Lock className="w-6 h-6" style={{ color: G }} />
                    </div>
                    <h2 className="font-display uppercase text-3xl leading-none" style={{ color: '#111' }}>
                        Panel <span style={{ color: G }}>Admin</span>
                    </h2>
                    <p className="font-body text-sm mt-1.5" style={{ color: 'rgba(0,0,0,0.45)' }}>
                        Burgers Boss · Gestión del menú
                    </p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="font-body text-[11px] font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'rgba(0,0,0,0.45)' }}>
                            Contraseña
                        </label>
                        <input
                            type="password"
                            required
                            autoFocus
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl px-4 py-3.5 text-base font-body outline-none transition-all"
                            style={{
                                background: '#f7f7f5',
                                border: '1px solid rgba(0,0,0,0.10)',
                                color: '#111',
                                '--tw-ring-color': 'rgba(45,106,45,0.15)',
                            }}
                            onFocus={e => e.target.style.borderColor = G}
                            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.10)'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="cursor-pointer w-full py-3.5 rounded-xl font-body font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
                        style={{ background: G, color: '#fff', boxShadow: '0 4px 16px rgba(45,106,45,0.28)' }}
                    >
                        {loading ? 'Ingresando...' : 'Acceder'}
                    </button>
                </form>
            </div>
        </div>
    );
}
