'use client';

import { useCallback } from 'react';
import { useEditorStore } from '@/lib/resume/editorStore';
import { ResumeBlockSidebar } from './ResumeBlockSidebar';
import { BlockManager } from './BlockManager';
import { SelectedBlockEditor } from './SelectedBlockEditor';
import { BlockStorePanel } from './BlockStorePanel';
import { Sparkles } from 'lucide-react';
import type { BlockType, CustomBlockType } from '@/types/blockLayout';

type LeftTab = 'navigate' | 'layout' | 'add';

export function BlockEditorRouter() {
  const { activeLeftTab, setActiveLeftTab, activeSection, setActiveSection } = useEditorStore();
  const toggleAiDrawer = useEditorStore((s) => s.toggleAiDrawer);

  // Navigate tab: clicking a block navigates to Layout tab with that block selected
  const handleNavigateSelect = useCallback((blockId: string, blockType: BlockType | 'custom') => {
    if (blockType === 'custom') {
      setActiveSection(`custom-${blockId}` as typeof activeSection);
    } else {
      setActiveSection(`block-${blockId}` as typeof activeSection);
    }
    setActiveLeftTab('layout');
  }, [setActiveSection, setActiveLeftTab, activeSection]);

  // Add Blocks tab: after adding, switch to layout with the new block selected
  const handleBlockStoreAdd = useCallback((blockId: string, _blockType: CustomBlockType) => {
    setActiveSection(`custom-${blockId}` as typeof activeSection);
    setActiveLeftTab('layout');
  }, [setActiveSection, setActiveLeftTab, activeSection]);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-0.5">
          <TabButton
            active={activeLeftTab === 'navigate'}
            onClick={() => setActiveLeftTab('navigate')}
            label="Navigate"
          />
          <TabButton
            active={activeLeftTab === 'layout'}
            onClick={() => setActiveLeftTab('layout')}
            label="Layout"
          />
          <TabButton
            active={activeLeftTab === 'add'}
            onClick={() => setActiveLeftTab('add')}
            label="+ Add"
          />
        </div>
        <button
          onClick={toggleAiDrawer}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-amber-400 transition-colors"
          title="AI Assistant"
        >
          <Sparkles size={14} />
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeLeftTab === 'navigate' && (
          <ResumeBlockSidebar
            onBlockSelect={handleNavigateSelect}
            compact={true}
          />
        )}

        {activeLeftTab === 'layout' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Block manager at top — shows all blocks for reordering/visibility */}
            <div className="border-b border-zinc-800 pb-3 mb-3 flex-shrink-0" style={{ maxHeight: '40%', overflowY: 'auto' }}>
              <BlockManager />
            </div>
            {/* Selected block editor — full editor for the selected block */}
            <div className="flex-1 overflow-auto">
              <SelectedBlockEditor />
            </div>
          </div>
        )}

        {activeLeftTab === 'add' && (
          <BlockStorePanel
            onAddBlock={handleBlockStoreAdd}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
        active
          ? 'bg-zinc-700 text-zinc-200'
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
      }`}
    >
      {label}
    </button>
  );
}