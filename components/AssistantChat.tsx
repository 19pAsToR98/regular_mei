import React, { useState, useRef, useEffect } from 'react';
import { sendAssistantQuery } from '../utils/assistantUtils';
import { showError } from '../utils/toastUtils'; // Importando utilitário de erro
import { ConnectionConfig } from '../types'; // Importando o tipo
import AssistantMessageContent from './AssistantMessageContent'; // NOVO IMPORT

interface AssistantChatProps {
  onClose: () => void;
  onNavigate: (tab: string) => void;
  connectionConfig: ConnectionConfig; // NOVA PROP
}

interface Message {
    sender: 'assistant' | 'user';
    text: string;
    action?: {
        type: 'navigate';
        target: string;
        label: string;
    }
}

// Helper para converter Blob em Base64 (retorna apenas a string Base64 pura)
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            // Remove o prefixo "data:mime/type;base64,"
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const AssistantChat: React.FC<AssistantChatProps> = ({ onClose, onNavigate, connectionConfig }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'assistant', text: 'Olá! Eu sou Dyad, seu assistente virtual. Como posso ajudar com suas finanças ou obrigações MEI hoje?' }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Refs e State para a gravação real
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  
  // Placeholder para a mensagem de áudio que será transcrita
  const TRANSCRIPTION_PLACEHOLDER = "Áudio gravado. Enviando para transcrição...";

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Timer logic for recording
  useEffect(() => {
    if (isRecording) {
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    } else {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const processQuery = async (query: string, isVoice: boolean = false, audioBase64?: string, mimeType?: string) => {
      setIsProcessing(true);
      
      // Adiciona uma mensagem de "processando"
      const processingMessage: Message = { sender: 'assistant', text: isVoice ? 'Ouvindo e processando...' : 'Digitando...' };
      setMessages(prev => [...prev, processingMessage]);
      
      // Passa o mimeType e a URL do webhook
      const response = await sendAssistantQuery(query, connectionConfig.assistantWebhookUrl, audioBase64, mimeType);
      
      // Remove a mensagem de processamento (assumindo que é a última)
      setMessages(prev => prev.slice(0, -1)); 

      if (response) {
          // O formato esperado é um array: [{ resposta: ..., mensagem_transcrita: ..., action: ... }]
          const responseData = Array.isArray(response) && response.length > 0 ? response[0] : null;
          
          if (responseData) {
              const { resposta, mensagem_transcrita, action } = responseData;
              
              // 1. Atualiza a mensagem do usuário com a transcrição, se for áudio
              if (mensagem_transcrita) {
                  setMessages(prev => {
                      const lastUserMessageIndex = prev.findIndex(msg => msg.text.includes(TRANSCRIPTION_PLACEHOLDER));
                      if (lastUserMessageIndex !== -1) {
                          const updatedMessages = [...prev];
                          // Substitui o placeholder pela transcrição real
                          updatedMessages[lastUserMessageIndex] = {
                              ...updatedMessages[lastUserMessageIndex],
                              text: `(Áudio transcrito): ${mensagem_transcrita}`
                          };
                          return updatedMessages;
                      }
                      return prev;
                  });
              }

              // 2. Adiciona a resposta do assistente
              const assistantResponse: Message = { 
                  sender: 'assistant', 
                  text: resposta,
                  action: action
              };
              setMessages(prev => [...prev, assistantResponse]);
          } else {
              showError('Resposta do assistente em formato inesperado.');
              setMessages(prev => [...prev, { sender: 'assistant', text: 'Desculpe, recebi uma resposta inválida do servidor.' }]);
          }
      }
      
      setIsProcessing(false);
  };

  const handleRecordToggle = async () => {
    if (isProcessing) return;

    if (isRecording && mediaRecorder) {
        // 1. STOP RECORDING
        mediaRecorder.stop();
        setIsRecording(false);
        // The onstop handler will take over from here.
        
    } else {
        // 2. START RECORDING
        try {
            // Solicita acesso ao microfone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Prioriza Ogg/Opus, fallback para WebM/Opus, e por último WAV
            let mimeType = 'audio/wav';
            if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                mimeType = 'audio/ogg;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            }
                
            const recorder = new MediaRecorder(stream, { mimeType });
            audioChunks.current = [];

            // Coleta os dados do áudio
            recorder.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            // Processa o áudio quando a gravação para
            recorder.onstop = async () => {
                // Cria o Blob final
                const audioBlob = new Blob(audioChunks.current, { type: mimeType });
                
                // Converte para Base64 pura
                const audioBase64 = await blobToBase64(audioBlob);

                // Texto de exibição local (indicando que o áudio foi capturado)
                const transcriptionPlaceholder = TRANSCRIPTION_PLACEHOLDER;
                
                const voiceMessage: Message = { 
                    sender: 'user', 
                    text: `(Áudio de ${formatTime(recordingTime)} capturado) ${transcriptionPlaceholder}` 
                };
                setMessages(prev => [...prev, voiceMessage]);
                
                // Envia o Base64 real para o webhook, junto com o MIME type
                processQuery(transcriptionPlaceholder, true, audioBase64, mimeType);
                
                // Para as tracks para liberar o microfone
                stream.getTracks().forEach(track => track.stop());
                setRecordingTime(0);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);
        } catch (err) {
            console.error('Microphone access denied or error:', err);
            showError('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
        }
    }
  };


  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const userText = input.trim();
    if (userText === '' || isProcessing) return;

    const newMessage: Message = { sender: 'user', text: userText };
    setMessages(prev => [...prev, newMessage]);
    setInput('');

    // Envia apenas o texto para o webhook
    processQuery(userText);
  };
  
  const handleActionClick = (action: Message['action']) => {
      if (!action) return;
      
      if (action.type === 'navigate') {
          onNavigate(action.target);
          onClose(); // Fecha o chat após a navegação
      }
  };

  return (
    <div 
        className="fixed bottom-[6.5rem] right-6 z-40 w-full max-w-sm h-[80vh] max-h-[600px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300 transition-all ease-in-out"
    >
      
      {/* Balão de fala (Tail) - Aponta para o botão abaixo */}
      <div className="absolute bottom-[-10px] right-4 w-0 h-0 border-x-8 border-x-transparent border-t-[10px] border-t-white dark:border-t-slate-900 shadow-lg"></div>
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-primary rounded-t-xl">
        <div className="flex items-center gap-3">
          <span className="material-icons text-white">smart_toy</span>
          <h3 className="font-bold text-white">Dyad Assistente</h3>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-full transition-colors">
          <span className="material-icons">close</span>
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-xl shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-blue-500 text-white rounded-br-none' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none'
            }`}>
              {msg.sender === 'assistant' ? (
                  <AssistantMessageContent text={msg.text} />
              ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              )}
              
              {msg.action && (
                  <button 
                      onClick={() => handleActionClick(msg.action)}
                      className="mt-2 text-xs font-bold px-3 py-1 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center gap-1"
                  >
                      {msg.action.label} <span className="material-icons text-sm">arrow_forward</span>
                  </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          
          {isRecording ? (
            // Recording UI
            <div className="flex-1 flex items-center justify-between px-4 py-2 border border-red-500 dark:border-red-400 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 animate-pulse">
                <div className="flex items-center gap-2">
                    <span className="material-icons text-lg">mic</span>
                    <span className="font-medium text-sm">Gravando...</span>
                </div>
                <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
            </div>
          ) : isProcessing ? (
            // Processing UI
            <div className="flex-1 flex items-center justify-center px-4 py-2 border border-primary dark:border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400">
                <span className="w-4 h-4 border-2 border-primary dark:border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></span>
                <span className="font-medium text-sm">Processando...</span>
            </div>
          ) : (
            // Text Input UI
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte algo..."
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
              disabled={isProcessing}
            />
          )}

          {/* Action Buttons */}
          {isRecording ? (
            // Stop Recording Button
            <button
              type="button"
              onClick={handleRecordToggle}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
              title="Parar Gravação e Enviar"
              disabled={isProcessing}
            >
              <span className="material-icons">stop</span>
            </button>
          ) : (
            <>
              {/* Send Text Button */}
              <button
                type="submit"
                className="bg-primary hover:bg-blue-600 text-white p-2 rounded-lg transition-colors disabled:bg-slate-400"
                disabled={input.trim() === '' || isProcessing}
                title="Enviar Mensagem"
              >
                <span className="material-icons">send</span>
              </button>
              
              {/* Start Recording Button */}
              <button
                type="button"
                onClick={handleRecordToggle}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors"
                title="Gravar Áudio"
                disabled={isProcessing}
              >
                <span className="material-icons">mic</span>
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default AssistantChat;