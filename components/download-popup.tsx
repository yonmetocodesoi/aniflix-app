"use client"

import { useState, useEffect } from "react";
import { X, Download, Smartphone, Zap, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";

export function DownloadPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosed, setIsClosed] = useState(false);

    useEffect(() => {
        // Check if user already saw it in this session to avoid annoyance
        const hasSeen = sessionStorage.getItem("aniflix_download_popup_seen");
        if (hasSeen) return;

        const timer = setTimeout(() => {
            if (!isClosed) setIsVisible(true);
        }, 20000); // 20 seconds delay

        return () => clearTimeout(timer);
    }, [isClosed]);

    const handleClose = () => {
        setIsVisible(false);
        setIsClosed(true);
        sessionStorage.setItem("aniflix_download_popup_seen", "true");
    };

    const handleDownload = () => {
        window.location.href = "/app-debug.apk";
        handleClose();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,1)] flex flex-col items-center text-center p-8 sm:p-12 animate-in zoom-in-95 duration-500">

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors bg-zinc-900/50 p-2 rounded-full"
                >
                    <X size={20} />
                </button>

                {/* Status Badge */}
                <div className="flex items-center gap-2 bg-red-600/10 border border-red-600/30 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-8">
                    <Zap size={12} className="animate-pulse" />
                    Versão Mobile Disponível
                </div>

                {/* Large Preview Image */}
                <div className="w-full aspect-[16/9] rounded-[2rem] overflow-hidden mb-8 shadow-2xl border border-zinc-800 relative group">
                    <img
                        src="https://ideogram.ai/assets/image/balanced/response/XVbJmQvTRGihSoTpGFWyNQ@2k"
                        alt="Mobile App Preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-6 pb-4">
                        <div className="flex items-center gap-3 text-zinc-400">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Proteção Anti-Bot Integrada</span>
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter mb-4 uppercase">
                    Leve a <span className="text-red-600">Yure Flix</span> no Bolso
                </h2>
                <p className="text-zinc-500 text-xs sm:text-sm font-medium leading-relaxed mb-10 max-w-sm">
                    Assista seus filmes e séries favoritos de qualquer lugar, com sincronização em tempo real e notificações de novos lançamentos.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 w-full">
                    <Button
                        onClick={handleDownload}
                        className="w-full bg-red-600 hover:bg-white hover:text-red-700 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-xl shadow-red-900/20 flex items-center justify-center gap-4"
                    >
                        <Download size={18} />
                        BAIXAR APK AGORA
                    </Button>
                    <div className="flex items-center justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2 text-zinc-600">
                            <Smartphone size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-none">Android 10+</span>
                        </div>
                        <div className="w-1 h-1 bg-zinc-800 rounded-full"></div>
                        <div className="flex items-center gap-2 text-zinc-600">
                            <Zap size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-none">7.7 MB</span>
                        </div>
                    </div>
                </div>

                {/* Footer Decor */}
                <div className="mt-8 border-t border-zinc-900 w-full pt-6 flex items-center justify-center gap-4 opacity-30">
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Yure Flix Official App v1.0.4</p>
                </div>

            </div>
        </div>
    );
}
