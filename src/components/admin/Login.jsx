import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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

        const email = import.meta.env.VITE_ADMIN_EMAIL;
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
        <div className="min-h-[75vh] flex items-center justify-center">
            <div className="border border-border p-8 rounded-3xl w-full max-w-md shadow-[0_8px_40px_rgba(0,0,0,0.06)] bg-background">
                <h2 className="font-display text-4xl font-black text-center text-primary mb-2 uppercase tracking-wider">Panel Admin</h2>
                <p className="font-body italic text-center text-text-muted mb-8 text-sm">Ingresá tu contraseña para gestionar el menú</p>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-body font-medium text-text-muted mb-2">Contraseña</label>
                        <input
                            type="password"
                            required
                            autoFocus
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-surface-light border border-border rounded-xl px-4 py-3 text-secondary font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-text-light"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="cursor-pointer w-full bg-primary hover:bg-primary-dark text-white font-display font-bold py-3.5 rounded-xl uppercase tracking-[0.12em] transition-all active:scale-[0.98] disabled:opacity-50 mt-4 shadow-[0_4px_16px_rgba(204,0,0,0.2)]"
                    >
                        {loading ? 'Ingresando...' : 'Acceder'}
                    </button>
                </form>
            </div>
        </div>
    );
}
