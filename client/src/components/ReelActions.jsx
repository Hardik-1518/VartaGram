import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

const ReelActions = ({ liked, likeCount, commentCount, shareCount, saved, onLike, onComment, onShare, onSave }) => {
  return (
    <div className='flex flex-wrap gap-3 rounded-3xl bg-slate-900/80 p-3 shadow-lg shadow-slate-950/40'>
      <button
        onClick={onLike}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${liked ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-100 hover:bg-white/20'}`}
      >
        <Heart className='h-4 w-4' />
        {likeCount}
      </button>

      <button
        onClick={onComment}
        className='flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-100 hover:bg-white/20'
      >
        <MessageCircle className='h-4 w-4' />
        {commentCount}
      </button>

      <button
        onClick={onShare}
        className='flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-100 hover:bg-white/20'
      >
        <Share2 className='h-4 w-4' />
        {shareCount}
      </button>

      <button
        onClick={onSave}
        className='flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-100 hover:bg-white/20'
      >
        <Bookmark className='h-4 w-4' />
        {saved ? 'Saved' : 'Save'}
      </button>
    </div>
  );
};

export default ReelActions;
