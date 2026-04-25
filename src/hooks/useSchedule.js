import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_FEATURES } from '../context/featuresCtx';

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

import { BUSINESS_ID } from '../lib/config';

function isSupabaseConfigured() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    return url && url !== 'https://tu-proyecto.supabase.co';
}

function toMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function dateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* Returns the Date that marks the START of the current business session.
   If the previous day's slot crossed midnight and we're still before closing,
   we're still in yesterday's session — so start = yesterday's opening time. */
export function getBusinessDayStart(schedule) {
    const now = new Date();
    if (!schedule) { const s = new Date(now); s.setHours(0, 0, 0, 0); return s; }

    const todayIdx     = now.getDay();
    const yesterdayIdx = (todayIdx + 6) % 7;
    const nowMinutes   = now.getHours() * 60 + now.getMinutes();
    const ySlot        = schedule[DAY_KEYS[yesterdayIdx]];

    // Si la sesión de ayer cruza la medianoche y todavía no terminó, seguimos en esa sesión
    if (ySlot?.open) {
        const from = toMinutes(ySlot.from);
        const to   = toMinutes(ySlot.to);
        if (to < from && nowMinutes < to) {
            const start = new Date(now);
            start.setDate(start.getDate() - 1);
            start.setHours(Math.floor(from / 60), from % 60, 0, 0);
            return start;
        }
    }

    // En cualquier otro caso: inicio de la sesión de hoy (aunque sea futuro → $0 si no abrió)
    const tSlot = schedule[DAY_KEYS[todayIdx]];
    const start = new Date(now);
    if (tSlot?.open) {
        const from = toMinutes(tSlot.from);
        start.setHours(Math.floor(from / 60), from % 60, 0, 0);
    } else {
        start.setHours(0, 0, 0, 0);
    }
    return start;
}

/* Returns YYYY-MM-DD for the calendar date of the current business session. */
export function getBusinessDayDate(schedule) {
    return dateStr(getBusinessDayStart(schedule));
}

/* One-shot schedule fetch — use inside other hooks to avoid prop-drilling. */
export async function fetchScheduleOnce() {
    try {
        const { data } = await supabase
            .from('settings')
            .select('schedule')
            .eq('business_id', BUSINESS_ID)
            .single();
        return data?.schedule ?? null;
    } catch {
        return null;
    }
}

export function computeIsOpen(schedule) {
    if (import.meta.env.VITE_FORCE_OPEN === 'true') return true;
    if (!schedule) return true;

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
    const [features, setFeatures] = useState(DEFAULT_FEATURES);
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
                .select('schedule, features')
                .eq('business_id', BUSINESS_ID)
                .single();
            if (error) throw error;
            const scheduleData = data?.schedule;
            setSchedule(scheduleData && typeof scheduleData === 'object' ? scheduleData : DUMMY_SCHEDULE);
            setFeatures({ ...DEFAULT_FEATURES, ...(data?.features || {}) });
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
        features,
        loading,
        error,
        isOpen: computeIsOpen(schedule),
        saveSchedule,
        refetch: fetchSchedule,
    };
}
