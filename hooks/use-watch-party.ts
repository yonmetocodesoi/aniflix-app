"use client"

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const SENTINEL_SERVER_URL = process.env.NEXT_PUBLIC_SENTINEL_SERVER_URL || 'http://localhost:3001';

export interface RoomUser {
    id: string;
    userName?: string;
    userPhoto?: string;
    isLeader?: boolean;
}

export interface ChatMessage {
    id: number;
    userId: string;
    userName: string;
    text: string;
    isSystem?: boolean;
}

export function useWatchParty(
    onSync?: (action: any) => void
) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isLeader, setIsLeader] = useState(false);
    const [members, setMembers] = useState<RoomUser[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize Socket
    useEffect(() => {
        const socketInstance = io(SENTINEL_SERVER_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            autoConnect: true
        });

        socketInstance.on('connect', () => {
            console.log('[WatchParty] Connected');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('[WatchParty] Disconnected');
            setIsConnected(false);
            setRoomId(null);
            setIsLeader(false);
            setMembers([]);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('[WatchParty] Connection Error:', err);
            // toast.error('Erro ao conectar ao servidor de Watch Party');
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('room_created', ({ roomId, isLeader, members }) => {
            setRoomId(roomId);
            setIsLeader(isLeader);
            setMembers(members);
            toast.success(`Sala criada! Código: ${roomId}`);
        });

        socket.on('room_joined', (data) => {
            setRoomId(data.roomId);
            setIsLeader(data.isLeader);
            setMembers(data.members);
            setMessages(data.messages || []);
            toast.success(`Entrou na sala ${data.roomId}`);

            // Initial Sync if needed
            if (onSync && data.currentMedia) {
                onSync({ type: 'URL', payload: data.currentMedia });
            }
        });

        socket.on('room_user_joined', ({ userId, user }) => {
            setMembers(prev => {
                if (prev.find(m => m.id === userId)) return prev;
                return [...prev, user];
            });
            toast.info(`${user.userName || 'Usuário'} entrou na sala.`);
        });

        socket.on('room_user_left', ({ userId }) => {
            setMembers(prev => prev.filter(m => m.id !== userId));
        });

        socket.on('room_leader_changed', ({ newLeaderId }) => {
            setMembers(prev => prev.map(m => ({ ...m, isLeader: m.id === newLeaderId })));
            if (socket.id === newLeaderId) {
                setIsLeader(true);
                toast.success("Você agora é o líder da sala!");
            }
        });

        socket.on('you_are_leader', () => {
            setIsLeader(true);
            toast.success("Você agora é o líder da sala!");
        });

        socket.on('sync_update', (action) => {
            if (onSync) onSync(action);
        });

        socket.on('room_message', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        socket.on('error', (msg) => {
            toast.error(msg);
        });

        return () => {
            socket.off('room_created');
            socket.off('room_joined');
            socket.off('room_user_joined');
            socket.off('room_user_left');
            socket.off('room_leader_changed');
            socket.off('you_are_leader');
            socket.off('sync_update');
            socket.off('room_message');
            socket.off('error');
        };
    }, [socket, onSync]);

    const createRoom = useCallback((metadata: any) => {
        if (!socket) return;
        socket.emit('create_room', metadata);
    }, [socket]);

    const joinRoom = useCallback((roomId: string, userMetadata: any) => {
        if (!socket) return;
        socket.emit('join_room', { roomId, userMetadata });
    }, [socket]);

    const leaveRoom = useCallback(() => {
        if (!socket) return;
        socket.emit('leave_room');
        setRoomId(null);
        setIsLeader(false);
        setMembers([]);
        setMessages([]);
    }, [socket]);

    const sendSyncAction = useCallback((action: { type: string, payload: any }) => {
        if (!socket || !roomId) return;
        // Optimistic update could go here, but for now we rely on leader being source of truth
        socket.emit('sync_action', action);
    }, [socket, roomId]);

    const sendChatMessage = useCallback((text: string) => {
        if (!socket || !roomId) return;
        socket.emit('room_chat_message', text);
    }, [socket, roomId]);

    return {
        isConnected,
        roomId,
        isLeader,
        members,
        messages,
        createRoom,
        joinRoom,
        leaveRoom,
        sendSyncAction,
        sendChatMessage
    };
}
