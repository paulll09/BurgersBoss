import { Package, Flame, Clock, QrCode, Tag, ShoppingBag, TrendingUp, Receipt, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminStats } from '../../hooks/useAdminStats';
import { useSchedule } from '../../hooks/useSchedule';
import { useOrdersCount } from '../../hooks/useOrders';

const G = '#2d6a2d';

/* ── Stat card ── */
function StatCard({ label, value, sub, loading }) {
    return (
        <div className="admin-card p-4 flex flex-col gap-1">
            {loading ? (
                <div className="h-8 w-16 rounded-lg bg-gray-200 animate-pulse" />
            ) : (
                <p className="font-display leading-none" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', color: G }}>
                    {value}
                </p>
            )}
            <p className="admin-label">{label}</p>
            {sub && !loading && <p className="admin-sub">{sub}</p>}
        </div>
    );
}

/* ── Nav card ── */
function NavCard({ icon, title, description, badge, loading, onClick }) {
    return (
        <div
            onClick={onClick}
            className="cursor-pointer flex items-center gap-4 p-4 admin-card transition-all hover:shadow-lg active:scale-[0.98] group"
        >
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(45,106,45,0.08)' }}
            >
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-display uppercase text-lg leading-none mb-0.5" style={{ color: '#111' }}>
                    {title}
                </p>
                {loading
                    ? <div className="h-3 w-28 rounded-full bg-gray-200 animate-pulse mt-1" />
                    : <p className="admin-sub leading-snug">{description}</p>
                }
            </div>
            {badge !== undefined && (
                <span
                    className="text-[10px] font-bold min-w-[20px] h-[20px] flex items-center justify-center px-1 rounded-full shrink-0"
                    style={{ background: '#F59E0B', color: '#000' }}
                >
                    {badge}
                </span>
            )}
            <svg className="w-4 h-4 shrink-0 opacity-25 group-hover:opacity-55 group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 18l6-6-6-6" />
            </svg>
        </div>
    );
}

/* ════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════ */
export default function Dashboard() {
    const navigate             = useNavigate();
    const { stats, loading }   = useAdminStats();
    const { isOpen, schedule } = useSchedule();
    const ordersCount          = useOrdersCount();

    const todayKey = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
    const todayHours = schedule?.[todayKey];

    return (
        <div className="max-w-4xl mx-auto animate-fade-up">

            {/* Header */}
            <div className="mb-8">
                <p className="font-body text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: 'rgba(0,0,0,0.35)' }}>
                    Burgers Boss · Panel Admin
                </p>
                <h1 className="font-display uppercase leading-none" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', color: '#111' }}>
                    Panel de <span style={{ color: G }}>Control</span>
                </h1>
            </div>

            {/* Status bar */}
            <div
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl mb-6"
                style={isOpen
                    ? { background: 'rgba(45,106,45,0.07)', border: '1.5px solid rgba(45,106,45,0.18)' }
                    : { background: 'rgba(0,0,0,0.03)', border: '1.5px solid rgba(0,0,0,0.08)' }
                }
            >
                <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: isOpen ? '#2d6a2d' : 'rgba(0,0,0,0.25)', boxShadow: isOpen ? '0 0 0 3px rgba(45,106,45,0.20)' : 'none' }}
                />
                <p className="font-body text-sm font-semibold" style={{ color: isOpen ? G : 'rgba(0,0,0,0.45)' }}>
                    {isOpen ? 'Local abierto ahora' : 'Local cerrado'}
                </p>
                {todayHours?.open && (
                    <p className="font-body text-xs ml-auto" style={{ color: 'rgba(0,0,0,0.38)' }}>
                        {todayHours.from} – {todayHours.to}
                    </p>
                )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <StatCard label="Productos" value={stats?.totalProducts} loading={loading} />
                <StatCard label="Visibles" value={stats?.visibleProducts} loading={loading}
                    sub={stats ? `${stats.hiddenProducts} ocultos` : undefined} />
                <StatCard label="Categorías" value={stats?.totalCategories} loading={loading} />
                <StatCard label="Extras" value={stats?.totalExtras} loading={loading} />
                <StatCard label="Pedidos activos" value={ordersCount} loading={false} />
            </div>

            {/* Section divider */}
            <p className="font-body text-[10px] uppercase tracking-[0.28em] mb-3" style={{ color: 'rgba(0,0,0,0.30)' }}>
                Gestión
            </p>

            {/* Nav cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <NavCard
                    icon={<Package className="w-5 h-5" style={{ color: G }} />}
                    title="Productos"
                    description={`${stats?.totalProducts ?? 0} productos · ${stats?.visibleProducts ?? 0} visibles`}
                    loading={loading}
                    onClick={() => navigate('/admin/products')}
                />
                <NavCard
                    icon={<Tag className="w-5 h-5" style={{ color: G }} />}
                    title="Categorías"
                    description={`${stats?.totalCategories ?? 0} categorías configuradas`}
                    loading={loading}
                    onClick={() => navigate('/admin/categories')}
                />
                <NavCard
                    icon={<Flame className="w-5 h-5" style={{ color: G }} />}
                    title="Extras"
                    description={`${stats?.totalExtras ?? 0} extras disponibles`}
                    loading={loading}
                    onClick={() => navigate('/admin/extras')}
                />
                <NavCard
                    icon={<TrendingUp className="w-5 h-5" style={{ color: G }} />}
                    title="Ventas"
                    description="Facturación, productos y tendencias"
                    onClick={() => navigate('/admin/ventas')}
                />
                <NavCard
                    icon={<Receipt className="w-5 h-5" style={{ color: G }} />}
                    title="Gastos"
                    description="Registrá costos y calculá tu ganancia"
                    onClick={() => navigate('/admin/gastos')}
                />
                <NavCard
                    icon={<Wallet className="w-5 h-5" style={{ color: G }} />}
                    title="Cierre de Caja"
                    description="Cerrá el turno y guardá el registro diario"
                    onClick={() => navigate('/admin/cierre')}
                />
                <NavCard
                    icon={<Clock className="w-5 h-5" style={{ color: G }} />}
                    title="Horarios"
                    description="Configurá días y horarios de apertura"
                    onClick={() => navigate('/admin/hours')}
                />
                <NavCard
                    icon={<QrCode className="w-5 h-5" style={{ color: G }} />}
                    title="Código QR"
                    description="Generá e imprimí el QR del menú"
                    onClick={() => navigate('/admin/qr')}
                />
                <NavCard
                    icon={<ShoppingBag className="w-5 h-5" style={{ color: G }} />}
                    title="Pedidos"
                    description={ordersCount > 0 ? `${ordersCount} pedido${ordersCount > 1 ? 's' : ''} activo${ordersCount > 1 ? 's' : ''}` : 'Sin pedidos activos'}
                    badge={ordersCount > 0 ? ordersCount : undefined}
                    onClick={() => navigate('/admin/orders')}
                />
            </div>
        </div>
    );
}
