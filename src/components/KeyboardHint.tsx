'use client';

import { useState } from 'react';

export default function KeyboardHint() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40">
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-nabu-dim hover:text-nabu-text transition-colors"
        >
          ⌨ Show shortcuts
        </button>
      ) : (
        <div className="bg-nabu-surface/90 backdrop-blur border-t border-nabu-border px-4 py-2 flex items-center justify-center gap-4 text-xs text-nabu-dim">
          <span>
            <kbd className="px-1.5 py-0.5 bg-nabu-surface-2 rounded text-nabu-text">Space</kbd>{' '}
            reveal/next
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-nabu-surface-2 rounded text-nabu-text">1</kbd> again
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-nabu-surface-2 rounded text-nabu-text">2</kbd> got it
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-nabu-surface-2 rounded text-nabu-text">T</kbd>
            <kbd className="px-1.5 py-0.5 bg-nabu-surface-2 rounded text-nabu-text ml-0.5">A</kbd>
            <kbd className="px-1.5 py-0.5 bg-nabu-surface-2 rounded text-nabu-text ml-0.5">I</kbd>
            <kbd className="px-1.5 py-0.5 bg-nabu-surface-2 rounded text-nabu-text ml-0.5">S</kbd>
            <kbd className="px-1.5 py-0.5 bg-nabu-surface-2 rounded text-nabu-text ml-0.5">E</kbd>{' '}
            reveal layers
          </span>
          <button onClick={() => setCollapsed(true)} className="text-nabu-dim hover:text-nabu-text ml-2">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
