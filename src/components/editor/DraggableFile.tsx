'use client';

import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { 
  Folder, ChevronRight, ChevronDown, MoreVertical, 
  PenSquare, Copy, Languages, Tag, Download, Trash2, 
  Minimize 
} from 'lucide-react';
import { FileNode } from '@/lib/actions/content-editor';
import { getFileIcon, formatSize, ItemTypes } from './utils';

interface DraggableFileProps {
  node: FileNode;
  onSelect: (node: FileNode) => void;
  onDelete: (path: string, name: string) => void;
  onRename: (path: string) => void;
  onMove: (oldPath: string, newParentPath: string) => void;
  onCompress: (path: string) => void;
  onDuplicate: (path: string) => void;
  onTranslate: (path: string) => void;
  onEditFrontmatter: (path: string) => void;
  onDownloadDir: (path: string) => void;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  toggleExpand: (path: string) => void;
}

export default function DraggableFile({ 
  node, onSelect, onDelete, onRename, onMove, 
  onCompress, onDuplicate, onTranslate, onEditFrontmatter, onDownloadDir,
  selectedPath, expandedPaths, toggleExpand 
}: DraggableFileProps) {

  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;
  const Icon = node.type === 'directory' ? Folder : getFileIcon(node.name);
  const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(node.name.split('.').pop()?.toLowerCase() || '');
  const isMdx = node.name.endsWith('.mdx');
  const [showMenu, setShowMenu] = useState(false);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.FILE,
    item: { path: node.path, type: node.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [node.path, node.type]);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.FILE,
    canDrop: (item: any) => node.type === 'directory' && !item.path.startsWith(node.path) && item.path !== node.path,
    drop: (item: any, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) return;
      onMove(item.path, node.path);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }) && monitor.canDrop(),
    }),
  }), [node.path, node.type, onMove]);

  const ref = (el: HTMLDivElement | null) => {
    drag(drop(el));
  };

  return (
    <div key={node.path} className="select-none">
      <div 
        ref={ref}
        className={`flex items-center group px-2 py-1.5 rounded-lg text-sm transition-colors cursor-pointer relative ${
          isSelected 
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        } ${isDragging ? 'opacity-50' : ''} ${isOver ? 'bg-blue-100 dark:bg-blue-800/40' : ''}`}
        onClick={() => {
          if (node.type === 'directory') toggleExpand(node.path);
          onSelect(node);
        }}
      >
        <div className="w-4 flex items-center justify-center mr-1">
          {node.type === 'directory' && (
            isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
          )}
        </div>
        <Icon className={`w-4 h-4 mr-2 shrink-0 ${node.isDraft ? 'text-blue-500' : isSelected ? 'text-blue-600 font-bold' : 'text-gray-400'}`} />
        <span className="truncate flex-1">
          {node.name}
        </span>
        
        {node.type === 'file' && (
          <span className="text-[10px] text-gray-400 dark:text-gray-600 mr-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            {formatSize(node.size)}
          </span>
        )}

        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:text-blue-500 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-50" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 z-[60] py-1 shadow-xl">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onRename(node.path); }}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs flex items-center gap-2"
              >
                <PenSquare className="w-3.5 h-3.5" /> Rename
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDuplicate(node.path); }}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              {isMdx && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onTranslate(node.path); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold"
                  >
                    <Languages className="w-3.5 h-3.5" /> Translate
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEditFrontmatter(node.path); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"
                  >
                    <Tag className="w-3.5 h-3.5" /> Edit Metadata
                  </button>
                </>
              )}
              {node.type === 'directory' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDownloadDir(node.path); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs flex items-center gap-2 text-purple-600 dark:text-purple-400"
                >
                  <Download className="w-3.5 h-3.5" /> Download ZIP
                </button>
              )}
              {isImage && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onCompress(node.path); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs flex items-center gap-2 text-green-600"
                >
                  <Minimize className="w-3.5 h-3.5" /> Compress WebP
                </button>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowMenu(false); 
                  onDelete(node.path, node.name);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs flex items-center gap-2 text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
      
      {node.type === 'directory' && isExpanded && node.children && (
        <div className="ml-4 border-l border-gray-200 dark:border-gray-800 pl-1 mt-0.5">
          {node.children.map(child => (
            <div key={child.path}>
              <DraggableFile 
                node={child} 
                onSelect={onSelect} 
                onDelete={onDelete}
                onRename={onRename}
                onMove={onMove}
                onCompress={onCompress}
                onDuplicate={onDuplicate}
                onTranslate={onTranslate}
                onEditFrontmatter={onEditFrontmatter}
                onDownloadDir={onDownloadDir}
                selectedPath={selectedPath}
                expandedPaths={expandedPaths}
                toggleExpand={toggleExpand}
              />
              {child.name === 'apps' && child.path.split('/').length === 1 && (
                <div className="my-2 border-t border-gray-100 dark:border-gray-800/50 mx-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
