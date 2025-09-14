import React from 'react';

export interface PrebuiltGif {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
}

export const PREBUILT_GIFS: PrebuiltGif[] = [
  {
    id: 'thumbs_up',
    title: 'Thumbs Up',
    url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/200w.gif'
  },
  {
    id: 'heart_eyes',
    title: 'Heart Eyes',
    url: 'https://media.giphy.com/media/l0MYryZTmQgvHI5TG/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/l0MYryZTmQgvHI5TG/200w.gif'
  },
  {
    id: 'laughing',
    title: 'Laughing',
    url: 'https://media.giphy.com/media/3o7aCSPqXE5C6T8tBC/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/3o7aCSPqXE5C6T8tBC/200w.gif'
  },
  {
    id: 'high_five',
    title: 'High Five',
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200w.gif'
  },
  {
    id: 'dancing',
    title: 'Dancing',
    url: 'https://media.giphy.com/media/l0MYGb8Q5nXQP0bEA/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/l0MYGb8Q5nXQP0bEA/200w.gif'
  },
  {
    id: 'clapping',
    title: 'Clapping',
    url: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/200w.gif'
  },
  {
    id: 'party',
    title: 'Party',
    url: 'https://media.giphy.com/media/3o7TKF1fSIs1R19B8k/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/3o7TKF1fSIs1R19B8k/200w.gif'
  },
  {
    id: 'shocked',
    title: 'Shocked',
    url: 'https://media.giphy.com/media/3o7aD5hvZF7AGQWktG/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/3o7aD5hvZF7AGQWktG/200w.gif'
  },
  {
    id: 'facepalm',
    title: 'Facepalm',
    url: 'https://media.giphy.com/media/XsUtdIeJ0MWMo/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/XsUtdIeJ0MWMo/200w.gif'
  },
  {
    id: 'victory',
    title: 'Victory',
    url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
    thumbnail: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/200w.gif'
  }
];

interface PrebuiltGifsProps {
  onGifSelect: (gifUrl: string) => void;
}

const PrebuiltGifs: React.FC<PrebuiltGifsProps> = ({ onGifSelect }) => {
  return (
    <div className="w-full max-w-md bg-background border rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold">Popular GIFs</h3>
        <p className="text-xs text-muted-foreground">Click to send</p>
      </div>
      
      <div className="p-2 max-h-80 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {PREBUILT_GIFS.map((gif) => (
            <button
              key={gif.id}
              onClick={() => onGifSelect(gif.url)}
              className="relative overflow-hidden rounded-lg hover:opacity-80 transition-opacity group"
            >
              <img
                src={gif.thumbnail}
                alt={gif.title}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium px-2 py-1 bg-black/50 rounded">
                  {gif.title}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrebuiltGifs;