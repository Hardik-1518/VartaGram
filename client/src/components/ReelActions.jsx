import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

const ReelActions = ({ liked, likeCount, commentCount, shareCount, saved, onLike, onComment, onShare, onSave, className = '' }) => {
  return (
    <div className={`flex flex-col items-center gap-4 z-30 ${className}`}>
      <div className='flex flex-col items-center'>
        <button
          onClick={onLike}
          className={`rounded-full p-3 flex items-center justify-center transition ${liked ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-100 hover:bg-white/20'}`}
          aria-label='Like'
        >
          <Heart className='h-6 w-6' />
        </button>
        <span className='text-xs text-slate-200 mt-1'>{likeCount}</span>
      </div>

      <div className='flex flex-col items-center'>
        <button onClick={onComment} className='rounded-full p-3 bg-white/10 text-slate-100 hover:bg-white/20' aria-label='Comments'>
          <MessageCircle className='h-6 w-6' />
        </button>
        <span className='text-xs text-slate-200 mt-1'>{commentCount}</span>
      </div>

      <div className='flex flex-col items-center'>
        <button onClick={onShare} className='rounded-full p-3 bg-white/10 text-slate-100 hover:bg-white/20' aria-label='Share'>
          <Share2 className='h-6 w-6' />
        </button>
        <span className='text-xs text-slate-200 mt-1'>{shareCount}</span>
      </div>

      <div className='flex flex-col items-center'>
        <button onClick={onSave} className='rounded-full p-3 bg-white/10 text-slate-100 hover:bg-white/20' aria-label='Save'>
          <Bookmark className='h-6 w-6' />
        </button>
        <span className='text-xs text-slate-200 mt-1'>{saved ? 'Saved' : ''}</span>
      </div>
    </div>
  );
};

export default ReelActions;
