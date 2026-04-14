import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DUMMY_SCHEDULE = {
    monday:    { open: true,  from: '09:00', to: '00:00' },
    tuesday:   { open: true,  from: '09:00', to: '00:00' },
    wednesday: { open: true,  from: '09:00', to: '00:00' },
    thursday:  { open: true,  from: '09:00', to: '00:00' },
    friday:    { open: true,  from: '09:00', to: '02:00' },
    saturday:  { open: true,  from: '09:00', to: '02:00' },
    sunday:    { open: true,  from: '09:00', to: '00:00' },
};

const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID;

function isSupabaseConfigured() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    return url && url !== 'https://tu-proyecto.supabase.co';
}

function toMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

export function computeIsOpen(schedule) {
    if (!schedule) return true; // sin schedule = siempre abierto (dev/pruebas)

    const now = new Date();
    const todayIndex     = now.getDay();
    const yesterdayIndex = (todayIndex + 6) % 7;
    const nowMinutes     = now.getHours() * 60 + now.getMinutes();
    const todayKey       = DAY_KEYS[todayIndex];
    const yesterdayKey   = DAY_KEYS[yesterdayIndex];

    // Check today's slot
    const todaySlot = schedule[todayKey];
    if (todaySlot?.open) {
        const from = toMinutes(todaySlot.from);
        const to   = toMinutes(todaySlot.to);
        if (to > from) {
            if (nowMinutes >= from && nowMinutes < to) return true;
        } else if (to < from) {
            if (nowMinutes >= from) return true;
        } else {
            return true; // from === to: open 24h
        }
    }

    // Check yesterday's slot crossing into today (e.g. 20:00 → 02:00)
    const ySlot = schedule[yesterdayKey];
    if (ySlot?.open) {
        const from = toMinutes(ySlot.from);
        const to   = toMinutes(ySlot.to);
        if (to < from && nowMinutes < to) return true;
    }

    return false;
}

export function useSchedule() {
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);

    const fetchSchedule = async () => {
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured()) {
            // Sin Supabase: siempre abierto para pruebas locales
            setSchedule(null);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('settings')
                .select('schedule')
                .eq('business_id', BUSINESS_ID)
                .single();
            if (error) throw error;
            const scheduleData = data?.schedule;
            setSchedule(scheduleData && typeof scheduleData === 'object' ? scheduleData : DUMMY_SCHEDULE);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const saveSchedule = async (newSchedule) => {
        const { error } = await supabase
            .from('settings')
            .update({ schedule: newSchedule })
            .eq('business_id', BUSINESS_ID);
        if (error) throw error;
        setSchedule(newSchedule);
    };

    useEffect(() => { fetchSchedule(); }, []);

    return {
        schedule,
        loading,
        error,
        isOpen: computeIsOpen(schedule),
        saveSchedule,
        refetch: fetchSchedule,
    };
}
