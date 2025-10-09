import { Check, Palette } from 'lucide-react';
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
  { id: 'default', name: 'Default', gradient: 'from-blue-500 via-blue-600 to-purple-600' },
  { id: 'ocean', name: 'Ocean', gradient: 'from-cyan-400 via-blue-500 to-blue-600' },
  { id: 'sunset', name: 'Sunset', gradient: 'from-orange-400 via-pink-500 to-purple-600' },
  { id: 'forest', name: 'Forest', gradient: 'from-emerald-400 via-green-500 to-teal-600' },
  { id: 'purple', name: 'Purple Dream', gradient: 'from-purple-400 via-purple-500 to-pink-500' },
  { id: 'night', name: 'Night Sky', gradient: 'from-indigo-900 via-purple-900 to-slate-900' },
  { id: 'fire', name: 'Fire', gradient: 'from-red-500 via-orange-500 to-yellow-500' },
  { id: 'mint', name: 'Mint', gradient: 'from-teal-300 via-emerald-400 to-green-500' },
  { id: 'rose', name: 'Rose Gold', gradient: 'from-pink-300 via-rose-400 to-orange-400' },
  { id: 'aurora', name: 'Aurora', gradient: 'from-green-400 via-cyan-500 to-blue-600' },
  { id: 'cosmic', name: 'Cosmic', gradient: 'from-violet-600 via-purple-600 to-indigo-700' },
  { id: 'cherry', name: 'Cherry Blossom', gradient: 'from-pink-400 via-pink-500 to-rose-500' },
];

const backgrounds = [
  { id: null, name: 'None', preview: 'bg-muted' },
  { 
    id: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    name: 'Subtle Light',
    preview: 'bg-gradient-to-br from-white/10 to-white/5'
  },
  {
    id: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.3), transparent 50%)',
    name: 'Floating Orbs',
    preview: 'bg-gradient-to-br from-purple-500/20 to-blue-500/20'
  },
  {
    id: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)',
    name: 'Diagonal Stripes',
    preview: 'bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)]'
  },
  {
    id: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)',
    name: 'Soft Glow',
    preview: 'bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,transparent_50%)]'
  },
  {
    id: 'linear-gradient(0deg, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
    name: 'Grid',
    preview: 'bg-[linear-gradient(0deg,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)]'
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
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Customize Chat Appearance</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Themes */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Message Bubble Theme
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id)}
                  className={`group relative p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    currentTheme === theme.id 
                      ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`w-full h-14 rounded-lg bg-gradient-to-br ${theme.gradient} mb-2 shadow-md group-hover:shadow-lg transition-shadow`} />
                  <p className="text-xs font-medium text-center">{theme.name}</p>
                  {currentTheme === theme.id && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Backgrounds */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Chat Background Pattern</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {backgrounds.map((bg) => (
                <button
                  key={bg.id || 'none'}
                  onClick={() => onBackgroundChange(bg.id)}
                  className={`group relative p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    currentBackground === bg.id 
                      ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`w-full h-14 rounded-lg ${bg.preview} mb-2 border border-border/50`} />
                  <p className="text-xs font-medium text-center">{bg.name}</p>
                  {currentBackground === bg.id && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
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
