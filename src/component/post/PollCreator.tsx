import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PollData {
  question: string;
  options: string[];
}

interface PollCreatorProps {
  onPollChange: (poll: PollData | null) => void;
  poll: PollData | null;
}

const PollCreator: React.FC<PollCreatorProps> = ({ onPollChange, poll }) => {
  const [isOpen, setIsOpen] = useState(!!poll);

  const handleOpen = () => {
    setIsOpen(true);
    onPollChange({
      question: '',
      options: ['', '']
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    onPollChange(null);
  };

  const updateQuestion = (question: string) => {
    if (poll) {
      onPollChange({ ...poll, question });
    }
  };

  const updateOption = (index: number, value: string) => {
    if (poll) {
      const newOptions = [...poll.options];
      newOptions[index] = value;
      onPollChange({ ...poll, options: newOptions });
    }
  };

  const addOption = () => {
    if (poll && poll.options.length < 4) {
      onPollChange({ ...poll, options: [...poll.options, ''] });
    }
  };

  const removeOption = (index: number) => {
    if (poll && poll.options.length > 2) {
      const newOptions = poll.options.filter((_, i) => i !== index);
      onPollChange({ ...poll, options: newOptions });
    }
  };

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={handleOpen}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Poll
      </Button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="border border-border rounded-lg p-4 space-y-3 bg-muted/30"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Create a Poll</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Input
          placeholder="Ask a question..."
          value={poll?.question || ''}
          onChange={(e) => updateQuestion(e.target.value)}
          className="bg-background"
        />

        <div className="space-y-2">
          {poll?.options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="bg-background"
              />
              {poll.options.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => removeOption(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {poll && poll.options.length < 4 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={addOption}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default PollCreator;
