import { useLocation } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';

export default function Navbar() {
    const totalItems = useCartStore((state) => state.getTotalItems());
    const { pathname } = useLocation();
    const isHome = pathname === '/';

    return (
        <>
            <nav
                className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
                style={{
                    background: 'rgba(10,10,10,0.88)',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: '0 1px 0 rgba(0,0,0,0.3)',
                    paddingTop: 'env(safe-area-inset-top)',
                }}
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <img
                            src="/Logo-BurgersBoss.PNG"
                            alt="Burgers Boss"
                            className="h-9 w-auto object-contain group-hover:scale-105 transition-all duration-300"
                        />
                    </Link>

                    {/* Cart */}
                    <Link
                        to="/cart"
                        className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 group"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.12)',
                        }}
                        aria-label="Ver carrito"
                    >
                        <ShoppingCart
                            className="w-[18px] h-[18px] transition-colors duration-200"
                            style={{ color: 'rgba(255,255,255,0.75)' }}
                        />
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-primary rounded-full animate-spring border-2 border-[#0a0a0a]">
                                {totalItems}
                            </span>
                        )}
                    </Link>
                </div>
            </nav>

            {/* Spacer on non-home pages only */}
            {!isHome && <div style={{ height: 'calc(3.5rem + env(safe-area-inset-top))' }} />}
        </>
    );
}
