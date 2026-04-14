import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useProducts } from '../../hooks/useProducts';
import { LogOut, Package, Tags, Clock, QrCode, Megaphone } from 'lucide-react';

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
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="font-display text-4xl font-black text-secondary uppercase tracking-wider mb-1">Panel de Control</h1>
                    <p className="font-body italic text-text-muted text-sm">Gestión del menú de Burgers Boss</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="cursor-pointer flex items-center gap-2 text-text-muted hover:text-primary transition-colors px-4 py-2 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 font-body text-sm"
                >
                    <LogOut className="w-4 h-4" />
                    Salir
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardCard
                    icon={<Package className="w-7 h-7 text-primary" />}
                    title="Productos"
                    description={
                        loading
                            ? 'Cargando...'
                            : `${products.length} productos · ${visibleCount} visibles${hiddenCount > 0 ? ` · ${hiddenCount} ocultos` : ''}`
                    }
                    onClick={() => navigate('/admin/products')}
                />
                <DashboardCard
                    icon={<Tags className="w-7 h-7 text-primary" />}
                    title="Categorías"
                    description="Gestiona las categorías del menú."
                    onClick={() => navigate('/admin/categories')}
                />
                <DashboardCard
                    icon={<Clock className="w-7 h-7 text-primary" />}
                    title="Horarios"
                    description="Configurá los días y horarios de apertura del bar."
                    onClick={() => navigate('/admin/hours')}
                />
                <DashboardCard
                    icon={<Megaphone className="w-7 h-7 text-primary" />}
                    title="Promociones"
                    description="Gestioná promociones por día de la semana."
                    onClick={() => navigate('/admin/promotions')}
                />
                <DashboardCard
                    icon={<QrCode className="w-7 h-7 text-primary" />}
                    title="Código QR"
                    description="Generá e imprimí QR para las mesas del bar."
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
            className="cursor-pointer border border-border p-8 rounded-3xl hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(204,0,0,0.06)] transition-all duration-300 group bg-background"
        >
            <div className="bg-surface-light w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary/5 transition-colors duration-300 border border-border">
                {icon}
            </div>
            <h3 className="font-display text-2xl font-black text-secondary uppercase tracking-wide mb-2">{title}</h3>
            <p className="font-body italic text-text-muted text-sm leading-relaxed">{description}</p>
        </div>
    );
}
