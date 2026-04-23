import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const IDLE_TIMEOUT = 15 * 60 * 1000;
import { BUSINESS_ID } from '../lib/config';
const IDLE_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

export function useAdminSession() {
    const [status, setStatus] = useState('checking');
    const navigate = useNavigate();
    const idleTimer = useRef(null);

    useEffect(() => {
        let cancelled = false;

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                if (!cancelled) { setStatus('denied'); navigate('/admin'); }
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            const metaBid = user?.user_metadata?.business_id;
            if (metaBid !== undefined && metaBid !== BUSINESS_ID) {
                await supabase.auth.signOut();
                if (!cancelled) { setStatus('denied'); navigate('/admin'); }
                return;
            }

            if (!cancelled) setStatus('ok');
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                setStatus('denied');
                navigate('/admin');
            }
        });

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (status !== 'ok') return;

        const handleIdle = async () => {
            await supabase.auth.signOut();
            toast.error('Sesión cerrada por inactividad.');
            navigate('/admin');
        };

        const reset = () => {
            clearTimeout(idleTimer.current);
            idleTimer.current = setTimeout(handleIdle, IDLE_TIMEOUT);
        };

        reset();
        IDLE_EVENTS.forEach(e => window.addEventListener(e, reset, { passive: true }));

        return () => {
            clearTimeout(idleTimer.current);
            IDLE_EVENTS.forEach(e => window.removeEventListener(e, reset));
        };
    }, [status]);

    return status;
}
