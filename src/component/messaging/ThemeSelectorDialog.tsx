import { X } from 'lucide-react';
import { Button } from '@/component/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/component/ui/dialog';

interface ThemeSelectorProps {
  currentTheme: string;
  currentBackground: string | null;
  onThemeChange: (theme: string) => void;
  onBackgroundChange: (background: string | null) => void;
  onClose: () => void;
}

const themes = [
  { id: 'default', name: 'Default', gradient: 'from-blue-500 to-purple-500' },
  { id: 'ocean', name: 'Ocean', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'sunset', name: 'Sunset', gradient: 'from-orange-500 to-pink-500' },
  { id: 'forest', name: 'Forest', gradient: 'from-green-500 to-emerald-500' },
  { id: 'purple', name: 'Purple Dream', gradient: 'from-purple-500 to-pink-500' },
  { id: 'night', name: 'Night Sky', gradient: 'from-indigo-900 to-purple-900' },
  { id: 'fire', name: 'Fire', gradient: 'from-red-500 to-orange-500' },
  { id: 'mint', name: 'Mint', gradient: 'from-teal-400 to-green-400' },
];

const backgrounds = [
  { id: null, name: 'None', preview: 'bg-muted' },
  { 
    id: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    name: 'Subtle Overlay',
    preview: 'bg-gradient-to-br from-white/10 to-white/5'
  },
  {
    id: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.3), transparent 50%)',
    name: 'Orbs',
    preview: 'bg-gradient-to-br from-purple-500/20 to-blue-500/20'
  },
  {
    id: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)',
    name: 'Stripes',
    preview: 'bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)]'
  },
];

export function ThemeSelector({ 
  currentTheme, 
  currentBackground, 
  onThemeChange, 
  onBackgroundChange, 
  onClose 
}: ThemeSelectorProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chat Theme & Background</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Themes */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Color Theme</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id)}
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    currentTheme === theme.id 
                      ? 'border-primary shadow-lg' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`w-full h-12 rounded-md bg-gradient-to-br ${theme.gradient} mb-2`} />
                  <p className="text-xs font-medium text-center">{theme.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Backgrounds */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Background Pattern</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {backgrounds.map((bg) => (
                <button
                  key={bg.id || 'none'}
                  onClick={() => onBackgroundChange(bg.id)}
                  className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    currentBackground === bg.id 
                      ? 'border-primary shadow-lg' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`w-full h-12 rounded-md ${bg.preview} mb-2`} />
                  <p className="text-xs font-medium text-center">{bg.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
