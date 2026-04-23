import { useContext, useRef, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BarCtx } from '../../context/barCtx';

const LOADER_DURATION = 1900;

export default function HeroSection() {
    const { appLoading } = useContext(BarCtx);
    const hadLoader = useRef(appLoading).current;
    const d = (base) => `${hadLoader ? LOADER_DURATION + base : base}ms`;
    const [fixedH, setFixedH] = useState(null);

    useEffect(() => {
        const h = window.visualViewport?.height ?? window.innerHeight;
        setFixedH(h);
    }, []);

    const scrollToMenu = () => {
        document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <section
            className="relative w-full overflow-hidden flex flex-col items-center justify-center"
            style={{
                height: fixedH ? `${fixedH}px` : '100dvh',
                minHeight: fixedH ? `${fixedH}px` : '-webkit-fill-available',
                backgroundColor: '#0a0a0a',
            }}
        >
            {/* Imagen de fondo con zoom suave al entrar */}
            <img
                src="/images/heroBurgers-Boss.webp"
                alt=""
                aria-hidden="true"
                className="animate-hero-bg absolute inset-0 w-full h-full select-none pointer-events-none"
                style={{
                    objectFit: 'cover',
                    objectPosition: 'center',
                    zIndex: 0,
                    animationDelay: d(0),
                }}
                draggable="false"
                loading="eager"
                decoding="async"
            />

            {/* Overlay oscuro para legibilidad */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.22) 40%, rgba(0,0,0,0.42) 70%, rgba(0,0,0,0.62) 100%)',
                    zIndex: 1,
                }}
            />

            {/* Gradiente inferior para realzar logo y botón */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.48) 0%, transparent 50%)',
                    zIndex: 3,
                }}
            />

            {/* Vignette lateral */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.38) 100%)',
                    zIndex: 2,
                }}
            />


            {/* Contenido */}
            <div
                className="relative flex flex-col items-center justify-center px-4 w-full"
                style={{ zIndex: 10 }}
            >
                {/* Logo sin fondo con animación de entrada */}
                <div className="relative animate-hero-logo-drop" style={{ animationDelay: d(120) }}>
                    <img
                        src="/LogoBurgersBossSinFondo.webp"
                        alt="Burgers Boss"
                        className="animate-logo-float-idle select-none relative"
                        style={{
                            width: 'clamp(240px, 68vw, 480px)',
                            height: 'auto',
                            objectFit: 'contain',
                            filter:
                                'drop-shadow(0 8px 32px rgba(0,0,0,0.55)) drop-shadow(0 2px 12px rgba(0,0,0,0.40))',
                        }}
                        draggable="false"
                        loading="eager"
                        decoding="async"
                    />
                </div>

                {/* Botón Ver el Menú */}
                <button
                    onClick={scrollToMenu}
                    className="animate-hero-fade cursor-pointer font-body font-semibold text-sm uppercase tracking-[0.2em] px-10 py-4 rounded-full transition-all duration-200 active:scale-95 hero-menu-btn"
                    style={{
                        animationDelay: d(780),
                        marginTop: '2.5rem',
                        background: '#2d6a2d',
                        color: '#ffffff',
                        boxShadow: '0 4px 28px rgba(45,106,45,0.45), 0 1px 0 rgba(255,255,255,0.15) inset',
                    }}
                >
                    Ver el Menú
                </button>
            </div>

            {/* Flecha flotante */}
            <button
                onClick={scrollToMenu}
                className="absolute left-1/2 -translate-x-1/2 animate-hero-float cursor-pointer"
                style={{ zIndex: 12, opacity: 0.85, bottom: 'clamp(28px, 6vw, 48px)' }}
                aria-label="Ir al menú"
            >
                <ChevronDown className="w-7 h-7 text-white" strokeWidth={2.5} />
            </button>
        </section>
    );
}
