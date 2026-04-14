import { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import Footer from './Footer';
import { useCartStore } from '../../store/cartStore';
import { OverlayCtx } from '../../context/overlayCtx';
import { BarCtx } from '../../context/barCtx';

export default function Layout({ children }) {
    const totalItems = useCartStore((state) => state.getTotalItems());
    const { pathname } = useLocation();
    const { active: overlayActive } = useContext(OverlayCtx);
    const { isOpen } = useContext(BarCtx);
    const showFab = pathname !== '/cart' && pathname !== '/reserva' && !pathname.startsWith('/admin') && !overlayActive && isOpen;
    const isLightPage = pathname.startsWith('/admin') || pathname === '/reserva';
    const isAdmin = pathname.startsWith('/admin');
    const needsSafeAreaBottom = isLightPage && pathname !== '/cart';

    return (
        <div
            className={`relative min-h-screen flex flex-col text-text selection:bg-primary/20 selection:text-secondary ${isLightPage ? 'bg-white' : ''}`}
            style={needsSafeAreaBottom ? { paddingBottom: 'env(safe-area-inset-bottom)' } : undefined}
        >
            {/* Navbar removed */}
            <div className="relative z-10 flex flex-col min-h-screen">
                <main className="flex-grow w-full">
                    {children}
                </main>
                {!pathname.startsWith('/admin') && pathname !== '/cart' && pathname !== '/reserva' && <Footer />}
            </div>

            {/* Floating Cart Button — mobile only */}
            {showFab && (
                <Link
                    to="/cart"
                    className="sm:hidden fixed right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    style={{
                        bottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
                        background: '#2d6a2d',
                        boxShadow: '0 4px 22px rgba(45,106,45,0.55)',
                    }}
                    aria-label="Ver carrito"
                >
                    {/* Ring pulse cuando hay ítems */}
                    {totalItems > 0 && (
                        <span
                            className="absolute inset-0 rounded-full animate-cart-ring pointer-events-none"
                            style={{ background: 'rgba(45,106,45,0.40)' }}
                        />
                    )}
                    <ShoppingCart
                        className={`w-6 h-6 relative ${totalItems > 0 ? 'animate-fab-pulse' : ''}`}
                        style={{ color: '#ffffff' }}
                    />
                    {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[10px] font-bold rounded-full animate-fade-in"
                            style={{ color: '#2d6a2d', background: '#ffffff' }}>
                            {totalItems}
                        </span>
                    )}
                </Link>
            )}

        </div>
    );
}
