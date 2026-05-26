import React, { useState } from 'react';

const ReelComments = ({ comments = [], loading, onSubmit }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onSubmit(text);
    setText('');
  };

  return (
    <div className='rounded-3xl bg-slate-900/80 p-4 shadow-xl shadow-slate-950/40'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300'>Comments</h3>
        <span className='text-xs text-slate-400'>{comments.length} total</span>
      </div>
      <div className='max-h-60 space-y-3 overflow-y-auto pr-1 text-sm text-slate-200'>
        {comments.length === 0 ? (
          <p className='text-slate-500'>No comments yet — be the first.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id || `${comment.user?._id}-${comment.text}-${comment.createdAt}`} className='rounded-2xl bg-slate-950/60 p-3'>
              <div className='flex items-center gap-3'>
                <img
                  src={comment.user?.profile_picture}
                  alt={comment.user?.full_name}
                  className='h-8 w-8 rounded-full object-cover'
                />
                <div>
                  <p className='font-semibold text-white'>{comment.user?.full_name || 'Anonymous'}</p>
                  <p className='text-slate-400 text-xs'>@{comment.user?.username || 'unknown'}</p>
                </div>
              </div>
              <p className='mt-3 text-slate-200'>{comment.text}</p>
            </div>
          ))
        )}
      </div>
      <div className='mt-4 flex gap-3'>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className='flex-1 rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500'
          placeholder='Add a comment...'
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !text.trim()}
          className='rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60'
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ReelComments;
