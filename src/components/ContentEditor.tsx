'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  listContentAction, 
  getContentAction, 
  saveContentAction, 
  publishContentAction, 
  uploadFileAction, 
  deleteFileAction, 
  createDirectoryAction,
  createPostAction,
  FileNode
} from '@/lib/actions/content-editor';
import { serializeMdxAction } from '@/lib/actions/mdx';
import { MDXRemote } from 'next-mdx-remote';
import { mdxComponents } from '@/components/mdx-components';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';
import { 
  Save, Send, FileText, ChevronRight, ChevronDown, 
  Loader2, Folder, File, Image as ImageIcon, Box, 
  Trash2, Upload, Plus, FolderPlus, Download, X,
  PenSquare, Menu
} from 'lucide-react';
import { toast } from '@/lib/toast';
import matter from 'gray-matter';

// --- Components ---

interface FileTreeProps {
  nodes: FileNode[];
  onSelect: (node: FileNode) => void;
  onDelete: (path: string) => void;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  toggleExpand: (path: string) => void;
}

function FileTree({ nodes, onSelect, onDelete, selectedPath, expandedPaths, toggleExpand }: FileTreeProps) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => {
        const isExpanded = expandedPaths.has(node.path);
        const isSelected = selectedPath === node.path;
        const Icon = node.type === 'directory' ? Folder : getFileIcon(node.name);

        return (
          <div key={node.path} className="select-none">
            <div 
              className={`flex items-center group px-2 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                isSelected 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
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
              <Icon className={`w-4 h-4 mr-2 shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className="truncate flex-1">{node.name}</span>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete ${node.name}?`)) onDelete(node.path);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {node.type === 'directory' && isExpanded && node.children && (
              <div className="ml-4 border-l border-gray-200 dark:border-gray-800 pl-1 mt-0.5">
                <FileTree 
                  nodes={node.children} 
                  onSelect={onSelect} 
                  onDelete={onDelete}
                  selectedPath={selectedPath}
                  expandedPaths={expandedPaths}
                  toggleExpand={toggleExpand}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'mdx' || ext === 'md') return FileText;
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext || '')) return ImageIcon;
  if (['gltf', 'glb', 'obj'].includes(ext || '')) return Box;
  return File;
}

// --- Main Editor ---

export default function ContentEditor() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [content, setContent] = useState('');
  const [mdxSource, setMdxSource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newPostData, setNewPostData] = useState({ title: '', slug: '', description: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
      setPreviewMode('edit');
    }
  }, []);

  const loadTree = useCallback(async () => {
    try {
      const data = await listContentAction();
      setTree(data);
    } catch (error) {
      toast.error("Failed to load file tree");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    async function loadFileContent() {
      if (!selectedNode || selectedNode.type === 'directory') return;
      if (!selectedNode.name.endsWith('.mdx')) {
        setContent('');
        return;
      }
      
      setLoading(true);
      try {
        const fileContent = await getContentAction(selectedNode.path);
        setContent(fileContent);
        // On mobile, close sidebar when a file is selected
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
      } catch (error) {
        toast.error("Failed to load file content");
      } finally {
        setLoading(false);
      }
    }
    loadFileContent();
  }, [selectedNode]);

  const updatePreview = useCallback(async (text: string) => {
    if (!text) return;
    try {
      const { content: mdxContent } = matter(text);
      const result = await serializeMdxAction(mdxContent);
      if (result.success) setMdxSource(result.source);
    } catch (error) {
      console.error("MDX error", error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content) updatePreview(content);
    }, 500);
    return () => clearTimeout(timer);
  }, [content, updatePreview]);

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  async function handleSave() {
    if (!selectedNode || selectedNode.type === 'directory') return;
    setSaving(true);
    try {
      await saveContentAction(selectedNode.path, content);
      toast.success("Saved locally");
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!confirm("Commit and push changes?")) return;
    setPublishing(true);
    try {
      const result = await publishContentAction();
      if (result.success) toast.success("Published successfully!");
      else toast.error(`Error: ${result.error}`);
    } catch (error) {
      toast.error("Failed to publish");
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete(path: string) {
    try {
      await deleteFileAction(path);
      if (selectedNode?.path === path) setSelectedNode(null);
      loadTree();
      toast.success("Deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  }

  async function handleCreateFolder() {
    const name = prompt("Folder name:");
    if (!name) return;
    
    let basePath = "";
    if (selectedNode) {
      basePath = selectedNode.type === 'directory' ? selectedNode.path : selectedNode.path.split('/').slice(0, -1).join('/');
    }
    
    const fullPath = basePath ? `${basePath}/${name}` : name;
    try {
      await createDirectoryAction(fullPath);
      loadTree();
      toast.success("Folder created");
    } catch (error) {
      toast.error("Failed to create folder");
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let targetDir = "";
    if (selectedNode) {
      targetDir = selectedNode.type === 'directory' ? selectedNode.path : selectedNode.path.split('/').slice(0, -1).join('/');
    }

    setLoading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        await uploadFileAction(targetDir, file.name, base64);
      }
      toast.success(`${files.length} files uploaded`);
      loadTree();
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePost() {
    if (!newPostData.title || !newPostData.slug) {
      toast.error("Title and Slug are required");
      return;
    }
    
    setLoading(true);
    try {
      const result = await createPostAction(newPostData.slug, newPostData.title, newPostData.description);
      if (result.success) {
        toast.success("Post created successfully");
        setShowCreateModal(false);
        setNewPostData({ title: '', slug: '', description: '' });
        await loadTree();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  const getFileInfo = useCallback(() => {
    if (!selectedNode) return { type: 'blog', slug: '' };
    const parts = selectedNode.path.split('/');
    if (parts.length === 1) return { type: 'blog', slug: '' };
    if (parts.length === 2) return { type: 'blog', slug: parts[0] };
    return { type: parts[0], slug: parts[1] };
  }, [selectedNode]);

  const components = {
    ...mdxComponents,
    ModelViewer: (props: { url: string; [key: string]: unknown }) => {
      let url = props.url;
      const { type, slug } = getFileInfo();
      if (slug && url && typeof url === 'string' && !url.startsWith('http') && !url.startsWith('/') && !url.startsWith('data:')) {
        const normalizedUrl = url.startsWith('./') ? url.slice(2) : url;
        url = `/assets/${type}/${slug}/${normalizedUrl}`;
      }
      return <ModelViewerWrapper {...props} url={url} />;
    },
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
      let finalSrc = src;
      const { type, slug } = getFileInfo();
      if (slug && src && typeof src === 'string' && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
        const normalizedSrc = src.startsWith('./') ? src.slice(2) : src;
        finalSrc = `/assets/${type}/${slug}/${normalizedSrc}`;
      }
      return <img {...props} src={finalSrc} alt={alt} className="rounded-lg my-8 w-full" />;
    }
  };

  const isMdx = selectedNode?.name.endsWith('.mdx');
  const isImage = selectedNode && ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(selectedNode.name.split('.').pop()?.toLowerCase() || '');

  return (
    <div className="flex flex-col h-screen max-h-[calc(100vh-80px)] sm:max-h-[calc(100vh-100px)] overflow-hidden bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <FileText className="w-5 h-5 text-blue-500 hidden sm:block" />
            <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Editor</span>
          </div>
          {selectedNode && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 overflow-hidden">
              <ChevronRight className="w-4 h-4 shrink-0" />
              <span className="font-mono truncate">{selectedNode.name}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {isMdx && (
            <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1 mr-1 sm:mr-4">
              <button onClick={() => setPreviewMode('edit')} className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-md ${previewMode === 'edit' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}>Edit</button>
              <button onClick={() => setPreviewMode('split')} className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-md ${previewMode === 'split' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}>Split</button>
              <button onClick={() => setPreviewMode('preview')} className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-md ${previewMode === 'preview' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}>Prev</button>
            </div>
          )}
          
          <button
            onClick={handleSave}
            disabled={saving || !isMdx}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Push</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className={`
          ${isSidebarOpen ? 'w-72 border-r' : 'w-0 overflow-hidden border-0'} 
          absolute lg:relative z-40 h-full border-gray-200 dark:border-gray-800 
          flex flex-col bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out
        `}>
          <div className="min-w-[18rem] flex flex-col h-full">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex flex-col gap-2">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-colors"
              >
                <PenSquare className="w-4 h-4" /> New Article
              </button>
              <div className="flex gap-2">
                <button onClick={handleCreateFolder} className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <FolderPlus className="w-3.5 h-3.5" /> Folder
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
              </div>
              <input type="file" ref={fileInputRef} multiple className="hidden" onChange={handleUpload} />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading && tree.length === 0 ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              ) : (
                <FileTree 
                  nodes={tree} 
                  onSelect={setSelectedNode} 
                  onDelete={handleDelete}
                  selectedPath={selectedNode?.path || null}
                  expandedPaths={expandedPaths}
                  toggleExpand={toggleExpand}
                />
              )}
            </div>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="lg:hidden absolute inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-gray-950">
          {selectedNode ? (
            <>
              {isMdx ? (
                <>
                  <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-full">
                    {/* Preview (Top on mobile, Right on desktop) */}
                    {(previewMode === 'preview' || previewMode === 'split') && (
                      <div className={`flex-1 overflow-y-auto p-4 sm:p-8 order-1 lg:order-2 ${previewMode === 'split' ? 'bg-gray-50/30 dark:bg-gray-900/10' : ''}`}>
                        <div className="max-w-none prose prose-neutral dark:prose-invert">
                          {mdxSource && <MDXRemote {...mdxSource} components={components} />}
                        </div>
                      </div>
                    )}
                    
                    {/* Editor (Bottom on mobile, Left on desktop) */}
                    {(previewMode === 'edit' || previewMode === 'split') && (
                      <div className={`flex-1 flex flex-col order-2 lg:order-1 ${previewMode === 'split' ? 'border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-gray-800' : ''}`}>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="flex-1 p-4 sm:p-6 font-mono text-base sm:text-sm resize-none focus:outline-none bg-transparent text-gray-800 dark:text-gray-200 leading-relaxed"
                          placeholder="Start writing..."
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  {isImage ? (
                    <img 
                      src={`/assets/${getFileInfo().type}/${getFileInfo().slug}/${selectedNode.name}`} 
                      alt={selectedNode.name} 
                      className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg mb-8" 
                    />
                  ) : (
                    <div className="p-8 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
                      {(() => {
                        const Icon = getFileIcon(selectedNode.name);
                        return <Icon className="w-16 h-16 text-gray-400" />;
                      })()}
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{selectedNode.name}</h3>
                  <p className="text-gray-500 mb-6">
                    {selectedNode.size ? `${(selectedNode.size / 1024).toFixed(2)} KB` : "File"}
                  </p>
                  <a 
                    href={`/assets/${getFileInfo().type}/${getFileInfo().slug}/${selectedNode.name}`}
                    download
                    className="flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
              <div className="p-6 rounded-full bg-gray-100 dark:bg-gray-800">
                <Plus className="w-12 h-12 text-gray-300" />
              </div>
              <p className="text-lg font-medium">Select a file to edit or view</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="font-bold text-gray-900 dark:text-white">New Article</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Title</label>
                <input 
                  type="text" 
                  value={newPostData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
                    setNewPostData(prev => ({ ...prev, title, slug }));
                  }}
                  placeholder="The Future of AI..."
                  className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Slug</label>
                <input 
                  type="text" 
                  value={newPostData.slug}
                  onChange={(e) => setNewPostData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="the-future-of-ai"
                  className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea 
                  value={newPostData.description}
                  onChange={(e) => setNewPostData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief summary of the article..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all resize-none"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreatePost}
                  disabled={loading || !newPostData.title || !newPostData.slug}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenSquare className="w-4 h-4" />}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
