import { useState, useRef } from 'react';
import { Mic, Square, Send, X } from 'lucide-react';
import { Button } from '@/component/ui/button';
import { toast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        const mediaRecorder = mediaRecorderRef.current;
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          // Stop all tracks
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          resolve(audioBlob);
        };
        
        mediaRecorder.stop();
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setRecordingTime(0);
      } else {
        resolve(null);
      }
    });
  };

  const handleSend = async () => {
    const audioBlob = await stopRecording();
    if (audioBlob && audioBlob.size > 0) {
      onSend(audioBlob);
      chunksRef.current = [];
    }
  };

  const handleCancel = async () => {
    await stopRecording();
    setRecordingTime(0);
    chunksRef.current = [];
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
      {!isRecording ? (
        <Button onClick={startRecording} size="sm" variant="default">
          <Mic className="w-4 h-4 mr-2" />
          Start Recording
        </Button>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
          </div>
          <Button onClick={stopRecording} size="sm" variant="outline">
            <Square className="w-4 h-4" />
          </Button>
          <Button onClick={handleSend} size="sm" variant="default">
            <Send className="w-4 h-4" />
          </Button>
          <Button onClick={handleCancel} size="sm" variant="ghost">
            <X className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
}
