import { useState, useRef } from 'react';
import { Mic, Square, Send, X, Pause, Play } from 'lucide-react';
import { Button } from '@/component/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
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
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

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

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        const mediaRecorder = mediaRecorderRef.current;
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          resolve(audioBlob);
        };
        
        mediaRecorder.stop();
        setIsRecording(false);
        setIsPaused(false);
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

  // Generate waveform bars for visualization
  const waveformBars = Array.from({ length: 20 }, (_, i) => {
    const height = isRecording && !isPaused 
      ? Math.random() * 100 
      : 20;
    return height;
  });

  if (!isRecording) {
    return (
      <div className="flex items-center justify-center p-4">
        <Button 
          onClick={startRecording} 
          size="lg" 
          className="gap-2 rounded-full px-6 bg-primary hover:bg-primary/90"
        >
          <Mic className="w-5 h-5" />
          Start Recording
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
      {/* Waveform Visualization */}
      <div className="flex items-center justify-center gap-[3px] h-16 px-4">
        {waveformBars.map((height, i) => (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-all duration-150",
              isPaused ? "bg-muted-foreground/30" : "bg-primary"
            )}
            style={{ 
              height: `${Math.max(4, height * 0.6)}%`,
              animationDelay: `${i * 50}ms`
            }}
          />
        ))}
      </div>

      {/* Time Display */}
      <div className="flex items-center justify-center gap-3">
        <div className={cn(
          "w-3 h-3 rounded-full",
          isPaused ? "bg-yellow-500" : "bg-destructive animate-pulse"
        )} />
        <span className="text-2xl font-mono font-semibold text-foreground">
          {formatTime(recordingTime)}
        </span>
        <span className="text-sm text-muted-foreground">
          {isPaused ? 'Paused' : 'Recording'}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button 
          onClick={handleCancel} 
          size="icon" 
          variant="outline"
          className="h-12 w-12 rounded-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="w-5 h-5" />
        </Button>

        {isPaused ? (
          <Button 
            onClick={resumeRecording} 
            size="icon" 
            variant="outline"
            className="h-12 w-12 rounded-full"
          >
            <Play className="w-5 h-5" />
          </Button>
        ) : (
          <Button 
            onClick={pauseRecording} 
            size="icon" 
            variant="outline"
            className="h-12 w-12 rounded-full"
          >
            <Pause className="w-5 h-5" />
          </Button>
        )}

        <Button 
          onClick={handleSend} 
          size="icon" 
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
        >
          <Send className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
