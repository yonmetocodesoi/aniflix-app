"use client"
import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/navbar";

export default function DiagnosticsPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState<{
        camera: PermissionState | 'unknown';
        microphone: PermissionState | 'unknown';
    }>({ camera: 'unknown', microphone: 'unknown' });
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>('');

    // Verifica permissões atuais
    const checkPermissions = async () => {
        try {
            // @ts-ignore
            const cam = await navigator.permissions.query({ name: 'camera' as any });
            // @ts-ignore
            const mic = await navigator.permissions.query({ name: 'microphone' as any });
            setStatus({ camera: cam.state, microphone: mic.state });

            cam.onchange = () => setStatus(s => ({ ...s, camera: cam.state }));
            mic.onchange = () => setStatus(s => ({ ...s, microphone: mic.state }));
        } catch (e) {
            console.error("Erro ao verificar permissões:", e);
        }
    };

    useEffect(() => {
        checkPermissions();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startTest = async () => {
        setError('');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            await checkPermissions(); // Atualiza status
        } catch (err: any) {
            console.error(err);
            setError("Acesso negado ou dispositivo não encontrado: " + err.message);
            await checkPermissions();
        }
    };

    const stopTest = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="pt-24 px-4 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-red-600">Diagnóstico de Dispositivos (Lab)</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Painel de Status */}
                    <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
                        <h2 className="text-xl font-bold mb-4">Status de Permissão</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-zinc-800 p-3 rounded">
                                <span>📷 Câmera</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${status.camera === 'granted' ? 'bg-green-600' :
                                        status.camera === 'denied' ? 'bg-red-600' : 'bg-yellow-600'
                                    }`}>
                                    {status.camera.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-zinc-800 p-3 rounded">
                                <span>🎤 Microfone</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${status.microphone === 'granted' ? 'bg-green-600' :
                                        status.microphone === 'denied' ? 'bg-red-600' : 'bg-yellow-600'
                                    }`}>
                                    {status.microphone.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={stream ? stopTest : startTest}
                                className={`w-full py-3 px-4 rounded font-bold transition-colors ${stream
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                {stream ? 'Parar Teste de Diagnóstico' : 'Iniciar Teste de Mídia'}
                            </button>
                            {error && (
                                <p className="mt-4 text-red-500 text-sm bg-red-950/50 p-2 rounded">
                                    {error}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Visualização Local */}
                    <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 flex flex-col items-center justify-center min-h-[300px]">
                        <h2 className="text-xl font-bold mb-4 self-start">Preview Local</h2>
                        {stream ? (
                            <div className="relative w-full aspect-video bg-black rounded overflow-hidden shadow-lg border border-zinc-700">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover transform scale-x-[-1]" // Espelhado
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" title="Microfone Ativo"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-zinc-600">
                                <div className="w-16 h-16 border-2 border-zinc-700 rounded-full flex items-center justify-center mb-2">
                                    📷
                                </div>
                                <p>Câmera parada</p>
                            </div>
                        )}
                        <p className="mt-4 text-xs text-zinc-500 text-center">
                            Este é um teste local. O vídeo não é enviado para nenhum servidor.
                            Verifique se seu navegador solicitou permissão acima.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
