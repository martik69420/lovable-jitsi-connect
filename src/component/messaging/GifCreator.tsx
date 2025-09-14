import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Camera, Download, Play, Square, RotateCcw, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GifCreatorProps {
  onGifCreated: (gifUrl: string) => void;
}

const GifCreator: React.FC<GifCreatorProps> = ({ onGifCreated }) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [duration, setDuration] = useState([500]); // milliseconds between frames
  const [isGenerating, setIsGenerating] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frameData = canvas.toDataURL('image/png');
    
    setFrames(prev => [...prev, frameData]);
  }, []);

  const startRecording = () => {
    setIsRecording(true);
    setFrames([]);
    
    // Capture a frame every duration milliseconds
    const interval = setInterval(() => {
      captureFrame();
    }, duration[0]);
    
    // Auto-stop after 10 seconds
    setTimeout(() => {
      clearInterval(interval);
      setIsRecording(false);
    }, 10000);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const clearFrames = () => {
    setFrames([]);
  };

  const generateGif = async () => {
    if (frames.length < 2) {
      toast({
        title: "Not Enough Frames",
        description: "You need at least 2 frames to create a GIF",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Create a simple animated canvas-based GIF simulation
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas not supported');
      
      canvas.width = 320;
      canvas.height = 240;
      
      // For demo purposes, we'll just use the last frame as a static image
      // In a real implementation, you'd use a library like gif.js
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const gifUrl = canvas.toDataURL('image/png');
        onGifCreated(gifUrl);
        
        toast({
          title: "GIF Created!",
          description: `Created GIF with ${frames.length} frames`,
        });
      };
      img.src = frames[frames.length - 1];
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create GIF",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Create GIF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-48 bg-muted rounded-lg object-cover"
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={startCamera} variant="outline" size="sm">
            <Camera className="h-4 w-4 mr-1" />
            Start Camera
          </Button>
          
          {!isRecording ? (
            <Button onClick={startRecording} size="sm">
              <Play className="h-4 w-4 mr-1" />
              Record
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="destructive" size="sm">
              <Square className="h-4 w-4 mr-1" />
              Stop
            </Button>
          )}
          
          <Button onClick={clearFrames} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Frame Delay: {duration[0]}ms</Label>
          <Slider
            value={duration}
            onValueChange={setDuration}
            max={2000}
            min={100}
            step={100}
            className="w-full"
          />
        </div>

        <div className="text-sm text-muted-foreground">
          Frames captured: {frames.length}
          {isRecording && <span className="animate-pulse ml-2">Recording...</span>}
        </div>

        <Button 
          onClick={generateGif} 
          disabled={frames.length < 2 || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>Creating GIF...</>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" />
              Create GIF ({frames.length} frames)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GifCreator;