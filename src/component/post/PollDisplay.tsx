import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { motion } from 'framer-motion';

interface Poll {
  id: string;
  question: string;
  options: string[];
  ends_at?: string;
}

interface PollVote {
  option_index: number;
  user_id: string;
}

interface PollDisplayProps {
  poll: Poll;
  postId: string;
}

const PollDisplay: React.FC<PollDisplayProps> = ({ poll, postId }) => {
  const { user } = useAuth();
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchVotes();
  }, [poll.id]);

  const fetchVotes = async () => {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('option_index, user_id')
      .eq('poll_id', poll.id);

    if (!error && data) {
      setVotes(data);
      if (user) {
        const myVote = data.find(v => v.user_id === user.id);
        if (myVote) {
          setUserVote(myVote.option_index);
          setShowResults(true);
        }
      }
    }
  };

  const handleVote = async (optionIndex: number) => {
    if (!user || isVoting) return;

    setIsVoting(true);
    try {
      // If user already voted, remove old vote
      if (userVote !== null) {
        await supabase
          .from('poll_votes')
          .delete()
          .eq('poll_id', poll.id)
          .eq('user_id', user.id);
      }

      // If clicking same option, just remove vote (toggle off)
      if (userVote === optionIndex) {
        setUserVote(null);
        setVotes(votes.filter(v => v.user_id !== user.id));
        setShowResults(false);
      } else {
        // Add new vote
        const { error } = await supabase
          .from('poll_votes')
          .insert({
            poll_id: poll.id,
            user_id: user.id,
            option_index: optionIndex
          });

        if (!error) {
          setUserVote(optionIndex);
          setVotes([...votes.filter(v => v.user_id !== user.id), { option_index: optionIndex, user_id: user.id }]);
          setShowResults(true);
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const getVoteCount = (optionIndex: number) => {
    return votes.filter(v => v.option_index === optionIndex).length;
  };

  const getVotePercentage = (optionIndex: number) => {
    if (votes.length === 0) return 0;
    return Math.round((getVoteCount(optionIndex) / votes.length) * 100);
  };

  const totalVotes = votes.length;

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 mt-3 bg-muted/20">
      <div className="flex items-center gap-2 text-sm font-medium">
        <BarChart3 className="h-4 w-4 text-primary" />
        {poll.question}
      </div>

      <div className="space-y-2">
        {poll.options.map((option, index) => {
          const percentage = getVotePercentage(index);
          const isSelected = userVote === index;
          const voteCount = getVoteCount(index);

          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleVote(index)}
              disabled={!user || isVoting}
              className={`w-full text-left rounded-lg border transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 bg-background'
              } ${!user ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {showResults && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`absolute inset-y-0 left-0 ${
                    isSelected ? 'bg-primary/20' : 'bg-muted'
                  }`}
                />
              )}
              <div className="relative flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                  <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
                    {option}
                  </span>
                </div>
                {showResults && (
                  <span className="text-sm text-muted-foreground">
                    {percentage}%
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        {userVote !== null && (
          <button
            onClick={() => setShowResults(!showResults)}
            className="hover:text-primary transition-colors"
          >
            {showResults ? 'Hide results' : 'Show results'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PollDisplay;
