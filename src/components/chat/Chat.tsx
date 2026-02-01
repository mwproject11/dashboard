import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useChatStore } from '@/store/useStore';
import { formatDate, getRoleLabel, getRoleColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  MessageSquare, 
  Trash2, 
  Users
} from 'lucide-react';

export function Chat() {
  const { user } = useAuthStore();
  const { messages, addMessage, deleteMessage } = useChatStore();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  // Scroll automatico all'ultimo messaggio
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    addMessage(newMessage, user);
    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo messaggio?')) {
      deleteMessage(id);
    }
  };

  const getInitials = (nome: string) => {
    const parts = nome.split(' ');
    return parts.map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const isOwnMessage = (autoreId: string) => autoreId === user.id;

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Chat Generale
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Spazio di comunicazione per tutto il team del giornalino
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {messages.length} messaggi
          </span>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Nessun messaggio ancora. Sii il primo a scrivere!
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const own = isOwnMessage(message.autoreId);
                const showAvatar = index === 0 || messages[index - 1].autoreId !== message.autoreId;
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${own ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    {showAvatar ? (
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className={`text-sm font-medium ${getRoleColor(message.autoreRuolo)}`}>
                          {getInitials(message.autoreNome)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 flex-shrink-0" />
                    )}

                    {/* Message Bubble */}
                    <div className={`max-w-[70%] ${own ? 'items-end' : 'items-start'} flex flex-col`}>
                      {showAvatar && (
                        <div className={`flex items-center gap-2 mb-1 ${own ? 'flex-row-reverse' : ''}`}>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {message.autoreNome}
                          </span>
                          <Badge variant="secondary" className={`text-xs ${getRoleColor(message.autoreRuolo)}`}>
                            {getRoleLabel(message.autoreRuolo)}
                          </Badge>
                        </div>
                      )}
                      
                      <div
                        className={`relative group px-4 py-2 rounded-2xl ${
                          own
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.contenuto}</p>
                        
                        {/* Timestamp and Actions */}
                        <div className={`flex items-center gap-2 mt-1 text-xs ${
                          own ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <span>{formatDate(message.createdAt)}</span>
                          {(own || user.ruolo === 'admin') && (
                            <button
                              onClick={() => handleDelete(message.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi un messaggio... (Invio per inviare, Shift+Invio per nuova riga)"
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              rows={2}
            />
            <Button 
              onClick={handleSend} 
              className="self-end h-[60px] px-6"
              disabled={!newMessage.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Premi Invio per inviare, Shift+Invio per andare a capo
          </p>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span>Tu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>Verifica</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span>Scrittore</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
