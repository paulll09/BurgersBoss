import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useProducts } from '../../hooks/useProducts';
import { LogOut, Package, Tags, Clock, QrCode, Megaphone, ChevronRight } from 'lucide-react';

const G = '#2d6a2d';
const G_DARK = '#1a4a1a';

export default function Dashboard() {
    const navigate = useNavigate();
    const { products, loading } = useProducts(true);
    const visibleCount = products.filter(p => p.visible).length;
    const hiddenCount = products.length - visibleCount;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-up">

            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <p className="font-body text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: 'rgba(0,0,0,0.35)' }}>
                        Burgers Boss · Panel Admin
                    </p>
                    <h1
                        className="font-display uppercase leading-none"
                        style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', color: '#111' }}
                    >
                        Panel de <span style={{ color: G }}>Control</span>
                    </h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="cursor-pointer flex items-center gap-2 font-body text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:opacity-80 active:scale-95"
                    style={{ color: '#111', border: '1px solid rgba(0,0,0,0.12)', background: '#fff' }}
                >
                    <LogOut className="w-4 h-4" />
                    Salir
                </button>
            </div>

            {/* Stats rápidas */}
            {!loading && (
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                        { label: 'Total productos', value: products.length },
                        { label: 'Visibles', value: visibleCount },
                        { label: 'Ocultos', value: hiddenCount },
                    ].map(({ label, value }) => (
                        <div
                            key={label}
                            className="rounded-2xl p-4 text-center"
                            style={{ background: '#f7f7f5', border: '1px solid rgba(0,0,0,0.07)' }}
                        >
                            <p className="font-display text-3xl leading-none" style={{ color: G }}>{value}</p>
                            <p className="font-body text-[11px] uppercase tracking-widest mt-1" style={{ color: 'rgba(0,0,0,0.45)' }}>{label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DashboardCard
                    icon={<Package className="w-6 h-6" style={{ color: G }} />}
                    title="Productos"
                    description={loading ? 'Cargando...' : `${products.length} productos · ${visibleCount} visibles`}
                    onClick={() => navigate('/admin/products')}
                />
                <DashboardCard
                    icon={<Tags className="w-6 h-6" style={{ color: G }} />}
                    title="Categorías"
                    description="Gestioná las categorías del menú"
                    onClick={() => navigate('/admin/categories')}
                />
                <DashboardCard
                    icon={<Clock className="w-6 h-6" style={{ color: G }} />}
                    title="Horarios"
                    description="Configurá días y horarios de apertura"
                    onClick={() => navigate('/admin/hours')}
                />
                <DashboardCard
                    icon={<Megaphone className="w-6 h-6" style={{ color: G }} />}
                    title="Promociones"
                    description="Gestioná promociones del local"
                    onClick={() => navigate('/admin/promotions')}
                />
                <DashboardCard
                    icon={<QrCode className="w-6 h-6" style={{ color: G }} />}
                    title="Código QR"
                    description="Generá e imprimí el QR del menú"
                    onClick={() => navigate('/admin/qr')}
                />
            </div>
        </div>
    );
}

function DashboardCard({ icon, title, description, onClick }) {
    return (
        <div
            onClick={onClick}
            className="cursor-pointer flex items-center gap-4 p-5 rounded-2xl transition-all duration-200 hover:shadow-md active:scale-[0.98] group"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)' }}
        >
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                style={{ background: 'rgba(45,106,45,0.08)' }}
            >
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-display uppercase text-xl leading-none mb-1" style={{ color: '#111' }}>
                    {title}
                </h3>
                <p className="font-body text-sm leading-snug" style={{ color: 'rgba(0,0,0,0.45)' }}>
                    {description}
                </p>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 opacity-30 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all" />
        </div>
    );
}
