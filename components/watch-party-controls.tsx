"use client"

import { useState, useRef, useEffect } from "react"
import { Users, LogOut, Send, Copy, Crown, Link as LinkIcon, MessageSquare, Play, Pause, AlertCircle } from "lucide-react"
import { useWatchParty } from "@/hooks/use-watch-party"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface WatchPartyControlsProps {
    className?: string;
    onSyncAction: (action: any) => void;
    currentMedia?: any;
}

export function WatchPartyControls({ className, onSyncAction, currentMedia }: WatchPartyControlsProps) {
    const {
        isConnected,
        roomId,
        isLeader,
        members,
        messages,
        createRoom,
        joinRoom,
        leaveRoom,
        sendChatMessage,
        sendSyncAction
    } = useWatchParty((action) => {
        // Callback for incoming sync actions
        onSyncAction(action);
    });

    const [inviteCode, setInviteCode] = useState("");
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-Broadcast Media Changes (Leader Only)
    useEffect(() => {
        // Only broadcast if we are leader, room is active, and media changed.
        if (isLeader && roomId && currentMedia) {
            // Debounce slightly to avoid rapid fires
            const timer = setTimeout(() => {
                sendSyncAction({ type: 'URL', payload: currentMedia });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentMedia?.server, currentMedia?.season, currentMedia?.episode, isLeader, roomId, sendSyncAction]);

    const handleCreate = () => {
        createRoom(currentMedia);
    };

    const handleJoin = () => {
        if (!inviteCode) return;
        joinRoom(inviteCode, {
            userName: "Convidado",
        });
    };

    const handleSendChat = () => {
        if (!chatInput.trim()) return;
        sendChatMessage(chatInput);
        setChatInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSendChat();
    };

    const copyRoomCode = () => {
        if (roomId) {
            navigator.clipboard.writeText(roomId);
            toast.success("Código copiado!");
        }
    };

    // Manual Sync Controls
    const sendPlay = () => sendSyncAction({ type: 'PLAY', payload: null });
    const sendPause = () => sendSyncAction({ type: 'PAUSE', payload: null });

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button
                    className={`p-2 rounded-full transition-colors flex items-center gap-2 ${roomId ? 'bg-red-600/20 text-red-500 hover:bg-red-600/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'} ${className}`}
                    title="Watch Party"
                >
                    <Users className="h-5 w-5" />
                    {roomId && <span className="text-xs font-bold hidden md:inline">{members.length}</span>}
                </button>
            </SheetTrigger>
            <SheetContent className="w-[400px] bg-zinc-950 border-l border-zinc-800 text-white flex flex-col p-0">
                <SheetHeader className="p-6 border-b border-zinc-900">
                    <SheetTitle className="text-white flex items-center gap-2">
                        <Users className="text-red-600" />
                        Watch Party <Badge variant="outline" className="border-red-600 text-red-500 text-[10px] h-5">BETA</Badge>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 flex flex-col overflow-hidden">
                    {!roomId ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
                            <div className="bg-zinc-900/50 p-6 rounded-full ring-1 ring-white/10">
                                <Users className="h-12 w-12 text-zinc-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold">Assistir Junto</h3>
                                <p className="text-sm text-zinc-400 max-w-[250px] mx-auto">
                                    Crie uma sala e convide amigos para assistir em sincronia perfeita.
                                </p>
                            </div>

                            <div className="w-full space-y-3">
                                <Button
                                    onClick={handleCreate}
                                    className="w-full bg-red-600 hover:bg-red-700 font-bold"
                                    disabled={!isConnected}
                                >
                                    Criar Nova Sala
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-zinc-800" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-zinc-950 px-2 text-zinc-500">Ou entrar</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Código da Sala"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value)}
                                        className="bg-zinc-900 border-zinc-800 focus-visible:ring-red-600"
                                    />
                                    <Button
                                        onClick={handleJoin}
                                        variant="secondary"
                                        className="font-bold"
                                        disabled={!isConnected || !inviteCode}
                                    >
                                        Entrar
                                    </Button>
                                </div>
                            </div>

                            {!isConnected && (
                                <p className="text-amber-500 text-xs mt-4 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                    Conectando ao servidor...
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Room Info */}
                            <div className="p-4 bg-zinc-900/30 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={isLeader ? "default" : "secondary"} className={isLeader ? "bg-red-600" : "bg-zinc-800"}>
                                            {isLeader ? "LÍDER" : "ESPECTADOR"}
                                        </Badge>
                                        {isLeader && (
                                            <div className="flex gap-1 ml-2">
                                                <Button size="icon" variant="outline" className="h-7 w-7 border-zinc-700 bg-black hover:bg-zinc-800 hover:text-green-400" onClick={sendPlay} title="Forçar Play">
                                                    <Play className="h-3 w-3 fill-current" />
                                                </Button>
                                                <Button size="icon" variant="outline" className="h-7 w-7 border-zinc-700 bg-black hover:bg-zinc-800 hover:text-yellow-400" onClick={sendPause} title="Forçar Pause">
                                                    <Pause className="h-3 w-3 fill-current" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={leaveRoom} className="h-8 w-8 text-zinc-400 hover:text-white" title="Sair da Sala">
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5">
                                    <div className="flex-1 font-mono text-center tracking-widest text-lg font-bold text-red-500 select-all cursor-text" onClick={() => navigator.clipboard.writeText(roomId || '')}>
                                        {roomId}
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={copyRoomCode} className="h-8 w-8 hover:bg-white/10">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>

                                {isLeader && (
                                    <Alert className="bg-amber-900/20 border-amber-900/50 py-2 px-3">
                                        <AlertCircle className="h-4 w-4 text-amber-500" />
                                        <AlertTitle className="text-amber-500 text-[10px] font-bold uppercase mb-1">Controle Manual</AlertTitle>
                                        <AlertDescription className="text-[10px] text-amber-200/80 leading-tight">
                                            Como o player é externo, cliques na tela não são detectados. <strong>Use os botões de Play/Pause acima</strong> para controlar o vídeo de todos.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <Separator className="bg-zinc-800" />

                            {/* Members & Chat */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="p-3 overflow-x-auto whitespace-nowrap scrollbar-hide border-b border-zinc-900">
                                    <div className="flex gap-3">
                                        {members.map((member) => (
                                            <div key={member.id} className="inline-flex flex-col items-center gap-1">
                                                <div className="relative">
                                                    <Avatar className="h-10 w-10 border-2 border-zinc-800">
                                                        <AvatarImage src={member.userPhoto} />
                                                        <AvatarFallback className="bg-zinc-800 text-xs text-white">
                                                            {member.userName?.[0] || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {member.isLeader && (
                                                        <div className="absolute -top-1 -right-1 bg-yellow-500 text-black rounded-full p-0.5 shadow-lg shadow-black/50">
                                                            <Crown className="w-3 h-3" strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-zinc-400 max-w-[60px] truncate">
                                                    {member.userName || 'Usuário'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <ScrollArea className="flex-1 p-4 bg-black/20">
                                    <div className="space-y-3 pb-2">
                                        {messages.length === 0 && (
                                            <div className="text-center py-10 text-zinc-700 text-xs italic">
                                                Inicie a conversa...
                                            </div>
                                        )}
                                        {messages.map((msg, idx) => (
                                            <div key={idx} className={`flex flex-col ${msg.userId === (members.find(m => m.id === socket?.id)?.id) ? 'items-end' : 'items-start'}`}>

                                                <div className={`px-3 py-2 text-xs max-w-[85%] break-words shadow-sm ${msg.userId === (members.find(m => m.id === socket?.id)?.id)
                                                        ? 'bg-red-600/90 text-white rounded-2xl rounded-tr-sm'
                                                        : 'bg-zinc-800 text-zinc-200 rounded-2xl rounded-tl-sm'
                                                    }`}>
                                                    <span className={`block text-[8px] font-bold mb-0.5 opacity-70 ${msg.userId === (members.find(m => m.id === socket?.id)?.id) ? 'text-red-100' : 'text-zinc-400'
                                                        }`}>
                                                        {msg.userName}
                                                    </span>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>
                                </ScrollArea>

                                <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2">
                                    <Input
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Digite uma mensagem..."
                                        className="bg-black border-zinc-800 focus-visible:ring-red-600 text-xs"
                                    />
                                    <Button size="icon" onClick={handleSendChat} className="bg-red-600 hover:bg-red-700 shrink-0 h-9 w-9">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
