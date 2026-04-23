import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    LayoutDashboard, Package, ShoppingBag,
    Tag, Flame, Clock, QrCode, TrendingUp, Receipt, Wallet,
    LogOut, MoreHorizontal, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrdersCount } from '../../hooks/useOrders';

/* ── Design tokens ── */
const SIDEBAR_BG   = '#1a4a1a';
const SIDEBAR_TEXT = 'rgba(255,255,255,0.55)';
const CONTENT_BG   = '#dedad4';

/* ── Navigation items ── */
const NAV_ITEMS = [
    { path: '/admin/dashboard',   label: 'Panel',      icon: LayoutDashboard },
    { path: '/admin/products',    label: 'Productos',  icon: Package },
    { path: '/admin/orders',      label: 'Pedidos',    icon: ShoppingBag, badge: 0 },
    { path: '/admin/categories',  label: 'Categorías', icon: Tag },
    { path: '/admin/extras',      label: 'Extras',     icon: Flame },
    { path: '/admin/ventas',      label: 'Ventas',     icon: TrendingUp },
    { path: '/admin/gastos',      label: 'Gastos',     icon: Receipt },
    { path: '/admin/cierre',      label: 'Cierre',     icon: Wallet },
    { path: '/admin/hours',       label: 'Horarios',   icon: Clock },
    { path: '/admin/qr',          label: 'QR',         icon: QrCode },
];

/* Bottom tabs: first 4 primary + "Más" for the rest */
const BOTTOM_PRIMARY = NAV_ITEMS.slice(0, 4);
const BOTTOM_MORE    = NAV_ITEMS.slice(4);

/* ── Sidebar nav item ── */
function SidebarItem({ item, pathname }) {
    const Icon    = item.icon;
    const isActive = pathname === item.path ||
        (item.path !== '/admin/dashboard' && pathname.startsWith(item.path));

    return (
        <Link
            to={item.path}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all relative select-none"
            style={isActive
                ? { background: 'rgba(255,255,255,0.13)', color: '#ffffff' }
                : { color: SIDEBAR_TEXT }
            }
        >
            {isActive && (
                <span
                    className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full"
                    style={{ background: 'rgba(255,255,255,0.65)' }}
                />
            )}
            <Icon className="w-[18px] h-[18px] shrink-0" />
            <span className="font-body font-semibold text-[13px] flex-1">{item.label}</span>
            {item.badge !== undefined && (
                <span
                    className="text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full"
                    style={{ background: '#F59E0B', color: '#000' }}
                >
                    {item.badge}
                </span>
            )}
        </Link>
    );
}

/* ── Bottom tab item ── */
function BottomTab({ item, pathname, onClick }) {
    const Icon    = item.icon;
    const isActive = pathname === item.path ||
        (item.path !== '/admin/dashboard' && pathname.startsWith(item.path));

    return (
        <Link
            to={item.path}
            onClick={onClick}
            className="flex flex-col items-center gap-0.5 flex-1 py-2 transition-all active:scale-90 relative"
            style={{ color: isActive ? '#2d6a2d' : 'rgba(0,0,0,0.35)' }}
        >
            {item.badge !== undefined && item.badge > 0 && (
                <span
                    className="absolute top-1.5 right-[calc(50%-16px)] text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center px-0.5 rounded-full"
                    style={{ background: '#F59E0B', color: '#000' }}
                >
                    {item.badge}
                </span>
            )}
            <Icon className="w-5 h-5" />
            <span className="font-body text-[10px] font-semibold">{item.label}</span>
        </Link>
    );
}

/* ════════════════════════════════════════════════
   ADMIN LAYOUT
════════════════════════════════════════════════ */
export default function AdminLayout() {
    const { pathname }  = useLocation();
    const navigate      = useNavigate();
    const [moreOpen, setMoreOpen] = useState(false);
    const ordersCount   = useOrdersCount();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    return (
        <div style={{ background: CONTENT_BG }}>

            {/* ══ SIDEBAR — desktop only ══════════════════════ */}
            <aside
                className="hidden sm:flex flex-col w-60 fixed top-0 left-0 bottom-0 z-20"
                style={{ background: SIDEBAR_BG }}
            >
                {/* Brand */}
                <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <img
                        src="/LogoBurgersBossSinFondo.webp"
                        alt="Burgers Boss"
                        className="w-9 h-9 object-contain shrink-0"
                    />
                    <div>
                        <p className="font-display text-white uppercase leading-none text-lg tracking-wide">
                            Burgers Boss
                        </p>
                        <p className="font-body text-[10px] uppercase tracking-[0.22em] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                            Panel Admin
                        </p>
                    </div>
                </div>

                {/* Nav items */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
                    {NAV_ITEMS.map(item => (
                        <SidebarItem
                            key={item.path}
                            item={item.path === '/admin/orders' ? { ...item, badge: ordersCount } : item}
                            pathname={pathname}
                        />
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-3 pb-5 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <button
                        onClick={handleLogout}
                        className="cursor-pointer flex items-center gap-3 px-4 py-2.5 rounded-xl w-full transition-all"
                        style={{ color: SIDEBAR_TEXT }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = SIDEBAR_TEXT; e.currentTarget.style.background = 'transparent'; }}
                    >
                        <LogOut className="w-[18px] h-[18px] shrink-0" />
                        <span className="font-body font-semibold text-[13px]">Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {/* ══ MAIN CONTENT ════════════════════════════════ */}
            <main className="sm:ml-60 min-w-0 overflow-x-hidden min-h-screen">
                {/* Mobile top bar */}
                <div
                    className="sm:hidden flex items-center justify-between px-4 py-3.5 sticky top-0 z-20"
                    style={{ background: SIDEBAR_BG }}
                >
                    <div className="flex items-center gap-2.5">
                        <img src="/LogoBurgersBossSinFondo.webp" alt="" className="w-7 h-7 object-contain" />
                        <span className="font-display text-white uppercase text-base tracking-wide leading-none">
                            Burgers Boss
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="cursor-pointer flex items-center gap-1.5 font-body text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                        style={{ color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.15)' }}
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Salir
                    </button>
                </div>

                {/* Page content */}
                <div className="px-4 sm:px-8 py-6 pb-28 sm:pb-10">
                    <Outlet />
                </div>
            </main>

            {/* ══ BOTTOM TABS — mobile only ═══════════════════ */}
            <nav
                className="sm:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch bg-white border-t"
                style={{
                    borderColor: 'rgba(0,0,0,0.07)',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                    boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
                }}
            >
                {BOTTOM_PRIMARY.map(item => (
                    <BottomTab
                        key={item.path}
                        item={item.path === '/admin/orders' ? { ...item, badge: ordersCount } : item}
                        pathname={pathname}
                    />
                ))}

                {/* Más button */}
                <button
                    onClick={() => setMoreOpen(true)}
                    className="cursor-pointer flex flex-col items-center gap-0.5 flex-1 py-2 transition-all active:scale-90"
                    style={{ color: BOTTOM_MORE.some(i => pathname.startsWith(i.path)) ? '#2d6a2d' : 'rgba(0,0,0,0.35)' }}
                >
                    <MoreHorizontal className="w-5 h-5" />
                    <span className="font-body text-[10px] font-semibold">Más</span>
                </button>
            </nav>

            {/* ══ MÁS — bottom sheet ══════════════════════════ */}
            <AnimatePresence>
                {moreOpen && (
                    <>
                        <motion.div
                            className="sm:hidden fixed inset-0 z-40"
                            style={{ background: 'rgba(0,0,0,0.45)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setMoreOpen(false)}
                        />
                        <motion.div
                            className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl"
                            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        >
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.12)' }} />
                            </div>

                            <div className="flex items-center justify-between px-5 pb-3">
                                <span className="font-display uppercase text-xl" style={{ color: '#111' }}>Más secciones</span>
                                <button onClick={() => setMoreOpen(false)}
                                    className="cursor-pointer p-2 rounded-xl active:scale-90 transition-all"
                                    style={{ color: 'rgba(0,0,0,0.4)', background: 'rgba(0,0,0,0.05)' }}>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 px-4 pb-6">
                                {BOTTOM_MORE.map(item => {
                                    const Icon = item.icon;
                                    const isActive = pathname.startsWith(item.path);
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setMoreOpen(false)}
                                            className="flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-95"
                                            style={isActive
                                                ? { background: 'rgba(45,106,45,0.10)', color: '#2d6a2d', border: '1.5px solid rgba(45,106,45,0.20)' }
                                                : { background: '#f7f7f5', color: '#333', border: '1.5px solid transparent' }
                                            }
                                        >
                                            <Icon className="w-5 h-5 shrink-0" />
                                            <span className="font-body font-semibold text-sm">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
