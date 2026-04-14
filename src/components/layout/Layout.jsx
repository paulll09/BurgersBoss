import { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, ChevronUp } from 'lucide-react';
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
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const onScroll = () => setShowScrollTop(window.scrollY > window.innerHeight * 0.75);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
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
                        background: '#F59E0B',
                        boxShadow: '0 4px 22px rgba(245,158,11,0.55)',
                    }}
                    aria-label="Ver carrito"
                >
                    {/* Ring pulse cuando hay ítems */}
                    {totalItems > 0 && (
                        <span
                            className="absolute inset-0 rounded-full animate-cart-ring pointer-events-none"
                            style={{ background: 'rgba(245,158,11,0.40)' }}
                        />
                    )}
                    <ShoppingCart
                        className={`w-6 h-6 relative ${totalItems > 0 ? 'animate-fab-pulse' : ''}`}
                        style={{ color: '#0a0a0a' }}
                    />
                    {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[10px] font-bold rounded-full animate-fade-in"
                            style={{ color: '#F59E0B', background: '#0a0a0a' }}>
                            {totalItems}
                        </span>
                    )}
                </Link>
            )}

            {/* Scroll-to-top arrow — aparece al hacer scroll */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="sm:hidden fixed left-5 z-50 w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform animate-scroll-top"
                    style={{
                        bottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
                        background: '#0a0a0a',
                        border: '1px solid rgba(245,158,11,0.30)',
                        boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
                    }}
                    aria-label="Volver arriba"
                >
                    <ChevronUp className="w-5 h-5 scroll-top-arrow" style={{ color: '#F59E0B' }} strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
}
