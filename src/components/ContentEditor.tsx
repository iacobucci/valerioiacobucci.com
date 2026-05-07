'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  listContentAction, 
  getContentAction, 
  saveContentAction, 
  uploadFileAction, 
  deleteFileAction, 
  createDirectoryAction,
  createPostAction,
  renameFileAction,
  moveFileAction,
  compressImageAction,
  getGitStatusAction,
  getDeployStatusAction,
  triggerDeployAction,
  gitCommitAction,
  gitPushAction,
  gitPullAction,
  gitStashAction,
  gitStashPopAction,
  gitResetAction,
  createFileAction,
  FileNode,
  downloadDirectoryAction,
  uploadZipAction,
  getTagsAction,
  duplicateAction,
  translateContentAction,
} from '@/lib/actions/content-editor';
import { serializeMdxAction } from '@/lib/actions/mdx';
import { MDXRemote } from 'next-mdx-remote';
import { clientMdxComponents } from '@/components/mdx-client-components';
import { 
  Save, Send, FileText, ChevronRight, 
  Loader2, Folder, File, Trash2, Upload, Plus, FolderPlus, Download, X, ExternalLink,
  PenSquare, Menu, GitBranch,
  GitCommit, GitPullRequest, Rocket, 
  RefreshCw, Terminal as TerminalIcon, CheckCircle2,
  RotateCw, Archive, ArchiveRestore, RotateCcw, Zap, ZapOff,
  Undo2, Redo2, ArrowRight
} from 'lucide-react';
import { toast } from '@/lib/toast';
import matter from 'gray-matter';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import refactored components and utils
import { ItemTypes, getFileIcon, formatSize } from './editor/utils';
import { FrontmatterData, HistoryItem, ConfirmModalProps, InputDialogProps } from './editor/types';
import ConfirmModal from './editor/ConfirmModal';
import InputDialog from './editor/InputDialog';
import TranslateModal from './editor/TranslateModal';
import FrontmatterModal from './editor/FrontmatterModal';
import DraggableFile from './editor/DraggableFile';
import ProjectsVisualEditor from './editor/ProjectsVisualEditor';
import Video from '@/components/mdx/Video';
import ModelViewerWrapper from '@/components/ModelViewerWrapper';

function EditorInternal() {
  const searchParams = useSearchParams();
  const initialPath = searchParams.get('path');
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [content, setContent] = useState('');
  const [mdxSource, setMdxSource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gitOperation, setGitOperation] = useState<'none' | 'commit' | 'push' | 'pull' | 'stash' | 'pop' | 'reset' | 'deploy'>('none');
  const [gitStatus, setGitStatus] = useState<{ status: string; diff: string }>({ status: '', diff: '' });
  const [deployStatus, setDeployStatus] = useState<{ isActive: boolean; status: string; logs: string }>({ isActive: false, status: '', logs: '' });
  const [sidebarTab, setSidebarTab] = useState<'files' | 'git'>('files');
  const [previewMode, setPreviewMode] = useState<'split' | 'edit' | 'preview' | 'visual'>('split');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newPostData, setNewPostData] = useState({ title: '', slug: '', description: '' });
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [autosave, setAutosave] = useState(false);
  const [previewVersion, setPreviewVersion] = useState(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Load/Save autosave preference
  useEffect(() => {
    const saved = localStorage.getItem('editor-autosave');
    if (saved !== null) setAutosave(saved === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('editor-autosave', String(autosave));
  }, [autosave]);

  // Confirmation & Input Modal State
  const [confirmConfig, setConfirmModal] = useState<ConfirmModalProps | null>(null);
  const [inputConfig, setInputConfig] = useState<InputDialogProps | null>(null);
  const [frontmatterConfig, setFrontmatterModal] = useState<{ isOpen: boolean; data: FrontmatterData; path: string } | null>(null);
  const [translateConfig, setTranslateConfig] = useState<{ isOpen: boolean; path: string } | null>(null);

  // History for Undo/Redo
  const [undoStack, setUndoStack] = useState<HistoryItem[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryItem[]>([]);

  const isMdx = !!selectedNode?.name.endsWith('.mdx');
  const isJson = !!selectedNode?.name.endsWith('.json');
  const isTxt = !!selectedNode?.name.endsWith('.txt');
  const isHtml = !!selectedNode?.name.endsWith('.html');
  const isCss = !!selectedNode?.name.endsWith('.css');
  const isJs = !!selectedNode?.name.endsWith('.js');
  const isImage = !!selectedNode && ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(selectedNode.name.split('.').pop()?.toLowerCase() || '');
  const hasVisualEditor = selectedNode?.name === 'projects.json';

  const loadTree = useCallback(async () => {
    try {
      const data = await listContentAction();
      setTree(data);
    } catch {
      toast.error("Failed to load file tree");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const tags = await getTagsAction();
      setAvailableTags(tags);
    } catch {}
  }, []);

  const loadGitStatus = useCallback(async () => {
    try {
      const result = await getGitStatusAction();
      if (result.success) setGitStatus({ status: result.status || 'Clean', diff: result.diff || '' });
    } catch (error) {}
  }, []);

  const loadDeployStatus = useCallback(async () => {
    try {
      const result = await getDeployStatusAction();
      if (result.success) {
        setDeployStatus({ 
          isActive: result.isActive ?? false, 
          status: result.status ?? '', 
          logs: result.logs ?? '' 
        });
      }
    } catch (error) {}
  }, []);

  // Initial load
  useEffect(() => {
    loadTree();
    loadGitStatus();
    loadTags();
  }, [loadTree, loadGitStatus, loadTags]);

  // Update preview version when tree changes to bust cache
  useEffect(() => {
    if (tree.length > 0) {
      setPreviewVersion(Date.now());
    }
  }, [tree]);

  // Handle initial path selection
  useEffect(() => {
    if (initialPath && tree.length > 0) {
      const parts = initialPath.split('/');
      const newExpanded = new Set<string>();
      let current = '';
      for (const part of parts) {
        current = current ? `${current}/${part}` : part;
        newExpanded.add(current);
      }
      setExpandedPaths(prev => new Set([...prev, ...newExpanded]));

      const findNode = (nodes: FileNode[], target: string): FileNode | null => {
        for (const node of nodes) {
          if (node.path === target) return node;
          if (node.children) {
            const found = findNode(node.children, target);
            if (found) return found;
          }
        }
        return null;
      };

      const targetNode = findNode(tree, initialPath);
      if (targetNode) {
        setSelectedNode(targetNode);
      }
    }
  }, [initialPath, tree]);

  // Selective polling: only for deployment status when tab is active
  useEffect(() => {
    if (sidebarTab === 'git') {
      loadDeployStatus();
      const interval = setInterval(loadDeployStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [sidebarTab, loadDeployStatus]);

  useEffect(() => {
    async function loadFileContent() {
      if (!selectedNode || selectedNode.type === 'directory') return;
      
      const isTextFile = !!(
        selectedNode.name.endsWith('.mdx') || 
        selectedNode.name.endsWith('.json') || 
        selectedNode.name.endsWith('.txt') ||
        selectedNode.name.endsWith('.html') ||
        selectedNode.name.endsWith('.css') ||
        selectedNode.name.endsWith('.js')
      );
      if (!isTextFile) {
        setContent('');
        setIsDirty(false);
        return;
      }
      
      setLoading(true);
      try {
        const fileContent = await getContentAction(selectedNode.path);
        setContent(fileContent);
        setIsDirty(false);
        
        if (selectedNode.name === 'projects.json') {
          setPreviewMode('visual');
        } else if (selectedNode.name.endsWith('.mdx')) {
          setPreviewMode(window.innerWidth < 1024 ? 'edit' : 'split');
        } else {
          setPreviewMode('edit');
        }

        if (window.innerWidth < 1024) setIsSidebarOpen(false);
      } catch {
        toast.error("Failed to load file tree");
      } finally {
        setLoading(false);
      }
    }
    loadFileContent();
  }, [selectedNode]);

  const updatePreview = useCallback(async (text: string) => {
    if (!text || !selectedNode?.name.endsWith('.mdx')) return;
    try {
      const { content: mdxContent } = matter(text);
      const result = await serializeMdxAction(mdxContent);
      if (result.success) setMdxSource(result.source);
    } catch (error) {
      console.error("MDX error", error);
    }
  }, [selectedNode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content) updatePreview(content);
    }, 500);
    return () => clearTimeout(timer);
  }, [content, updatePreview]);

  const getFileInfo = useCallback(() => {
    if (!selectedNode) return { type: 'blog', slug: '' };
    const parts = selectedNode.path.split('/');
    if (parts.length === 1) return { type: 'blog', slug: '' };
    if (parts.length === 2) return { type: 'blog', slug: parts[0] };
    return { type: parts[0], slug: parts[1] };
  }, [selectedNode]);

  const handlePreview = useCallback(() => {
    if (!selectedNode || !selectedNode.path.endsWith('.mdx')) return;
    
    const parts = selectedNode.path.split('/');
    const { type, slug } = getFileInfo();
    const fileName = parts[parts.length - 1];
    const lang = fileName.replace('.mdx', '');
    
    const url = `/${lang}/${type}/${slug}`;
    window.open(url, '_blank');
  }, [selectedNode, getFileInfo]);

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleSave = useCallback(async (silent = false) => {
    if (!selectedNode || selectedNode.type === 'directory') return;
    setSaving(true);
    try {
      await saveContentAction(selectedNode.path, content);
      setIsDirty(false);
      if (!silent) toast.success("Saved locally");
      loadGitStatus(); // Fetch git status only on save
    } catch {
      if (!silent) toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }, [selectedNode, content, loadGitStatus]);

  // Autosave effect
  useEffect(() => {
    if (autosave && isDirty && !saving && (isMdx || isJson || isTxt || isHtml || isCss || isJs)) {
      const timer = setTimeout(() => {
        handleSave(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [content, autosave, isDirty, saving, handleSave, isMdx, isJson, isTxt, isHtml, isCss, isJs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleGitCommit = async () => {
    setInputConfig({
      isOpen: true,
      title: "Commit Changes",
      defaultValue: "Update from web editor",
      placeholder: "Commit message...",
      confirmLabel: "Commit",
      onConfirm: async (message) => {
        setInputConfig(null);
        if (!message) return;
        setGitOperation('commit');
        try {
          const result = await gitCommitAction(message);
          if (result.success) {
            toast.success("Committed locally");
            loadGitStatus();
          } else {
            toast.error(`Error: ${result.error}`);
          }
        } catch (error) {
          toast.error("Commit failed");
        } finally {
          setGitOperation('none');
        }
      },
      onCancel: () => setInputConfig(null)
    });
  };

  const handleGitPush = async () => {
    setGitOperation('push');
    try {
      const result = await gitPushAction();
      if (result.success) {
        toast.success("Pushed to remote");
        loadGitStatus();
      } else {
        toast.error(`Push failed. You might need to pull first.`);
      }
    } catch {
      toast.error("Push failed");
    } finally {
      setGitOperation('none');
    }
  };

  const handleGitPull = async () => {
    setGitOperation('pull');
    try {
      const result = await gitPullAction();
      if (result.success) {
        toast.success("Pulled and rebased");
        loadGitStatus();
        loadTree();
      } else {
        toast.error(result.error || "Pull failed");
      }
    } catch {
      toast.error("Pull failed");
    } finally {
      setGitOperation('none');
    }
  };

  const handleGitStash = async () => {
    setGitOperation('stash');
    try {
      const result = await gitStashAction();
      if (result.success) {
        toast.success("Changes stashed");
        loadGitStatus();
      }
    } finally {
      setGitOperation('none');
    }
  };

  const handleGitPop = async () => {
    setGitOperation('pop');
    try {
      const result = await gitStashPopAction();
      if (result.success) {
        toast.success("Stash popped");
        loadGitStatus();
      } else {
        toast.error(result.error || "Failed to pop stash");
      }
    } finally {
      setGitOperation('none');
    }
  };

  const handleGitReset = async () => {
    setConfirmModal({
      isOpen: true,
      title: "Hard Reset",
      message: "This will DISCARD all local changes and reset to the last commit. Are you sure?",
      confirmLabel: "Reset Everything",
      confirmVariant: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        setGitOperation('reset');
        try {
          const result = await gitResetAction();
          if (result.success) {
            toast.success("Reset complete");
            loadGitStatus();
            loadTree();
          }
        } finally {
          setGitOperation('none');
        }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const handleDeploy = async () => {
    setConfirmModal({
      isOpen: true,
      title: "Trigger Deployment",
      message: "This will start a full website build and restart the service. Are you sure?",
      confirmLabel: "Deploy Now",
      confirmVariant: "purple",
      onConfirm: async () => {
        setConfirmModal(null);
        setGitOperation('deploy');
        try {
          const result = await triggerDeployAction();
          if (result.success) {
            toast.success("Deployment started");
            loadDeployStatus();
          } else {
            toast.error(`Error: ${result.error}`);
          }
        } catch (error) {
          toast.error("Deployment trigger failed");
        } finally {
          setGitOperation('none');
        }
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  async function handleDelete(path: string, name: string) {
    setConfirmModal({
      isOpen: true,
      title: "Delete File",
      message: `Are you sure you want to delete "${name}"? This action is irreversible.`,
      confirmLabel: "Delete Forever",
      confirmVariant: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await deleteFileAction(path);
          if (selectedNode?.path === path) setSelectedNode(null);
          loadTree();
          loadGitStatus();
          toast.success("Deleted");
        } catch (error) {
          toast.error("Failed to delete");
        }
      },
      onCancel: () => setConfirmModal(null)
    });
  }

  // --- File System Actions with Undo/Redo support ---

  const performAction = async (type: HistoryItem['type'], params: any, skipHistory = false) => {
    let result: any;
    let inverseParams: any;

    try {
      switch (type) {
        case 'move':
          result = await moveFileAction(params.oldPath, params.newParentPath);
          inverseParams = { oldPath: `${params.newParentPath}/${params.oldPath.split('/').pop()}`.replace(/^\//, ''), newParentPath: params.oldPath.split('/').slice(0, -1).join('/') };
          break;
        case 'rename':
          result = await renameFileAction(params.oldPath, params.newName);
          inverseParams = { oldPath: `${params.oldPath.split('/').slice(0, -1).join('/')}/${params.newName}`.replace(/^\//, ''), newName: params.oldPath.split('/').pop() };
          break;
        case 'create_folder':
          result = await createDirectoryAction(params.path);
          break;
        case 'create_post':
          result = await createPostAction(params.slug, params.title, params.description);
          break;
      }

      if (result.success) {
        if (!skipHistory) {
          setUndoStack(prev => [{ type, params, inverseParams }, ...prev]);
          setRedoStack([]);
        }
        loadTree();
        loadGitStatus();
        return result;
      }
    } catch (e) {
      toast.error("Action failed");
    }
    return { success: false };
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const item = undoStack[0];
    
    if (item.type === 'move' || item.type === 'rename') {
      const result = await performAction(item.type, item.inverseParams, true);
      if (result.success) {
        setUndoStack(prev => prev.slice(1));
        setRedoStack(prev => [item, ...prev]);
        toast.success(`Undone: ${item.type}`);
      }
    } else {
      toast.info("Undo not supported for this action");
      setUndoStack(prev => prev.slice(1));
    }
  };

  const handleRedo = async () => {
    if (redoStack.length === 0) return;
    const item = redoStack[0];
    const result = await performAction(item.type, item.params, true);
    if (result.success) {
      setRedoStack(prev => prev.slice(1));
      setUndoStack(prev => [item, ...prev]);
      toast.success(`Redone: ${item.type}`);
    }
  };

  async function handleRename(oldPath: string) {
    const oldName = oldPath.split('/').pop() || "";
    setInputConfig({
      isOpen: true,
      title: "Rename File/Folder",
      defaultValue: oldName,
      confirmLabel: "Rename",
      onConfirm: async (newName) => {
        setInputConfig(null);
        if (!newName || newName === oldName) return;
        await performAction('rename', { oldPath, newName });
      },
      onCancel: () => setInputConfig(null)
    });
  }

  async function handleMove(oldPath: string, newParentPath: string) {
    if (oldPath === newParentPath || oldPath.startsWith(newParentPath + '/')) return;
    await performAction('move', { oldPath, newParentPath });
  }

  async function handleCompress(path: string) {
    setLoading(true);
    try {
      const result = await compressImageAction(path);
      if (result.success) {
        toast.success(`Compressed: ${result.newPath}`);
        loadTree();
        loadGitStatus();
      }
    } catch {
      toast.error("Compression failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDuplicate(path: string) {
    setLoading(true);
    try {
      const result = await duplicateAction(path);
      if (result.success) {
        toast.success("Duplicated successfully");
        loadTree();
        loadGitStatus();
      }
    } catch {
      toast.error("Duplication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleTranslate(path: string, targetLocales: string[]) {
    setTranslateConfig(null);
    setLoading(true);
    try {
      for (const locale of targetLocales) {
        const result = await translateContentAction(path, locale);
        if (result.success) {
          toast.success(`Translated to ${locale.toUpperCase()} successfully`);
        } else {
          toast.error(`Failed to translate to ${locale.toUpperCase()}: ${result.error}`);
        }
      }
      loadTree();
      loadGitStatus();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Translation error: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleEditFrontmatter(path: string) {
    setLoading(true);
    try {
      // Use current content if it's the same file, otherwise fetch from disk
      const fileContent = (selectedNode && selectedNode.path === path) 
        ? content 
        : await getContentAction(path);
      const { data } = matter(fileContent);
      setFrontmatterModal({
        isOpen: true,
        path: path,
        data: {
          ...data,
          title: (data.title as string) || '',
          description: (data.description as string) || '',
          date: data.date ? (data.date instanceof Date ? data.date.toISOString() : String(data.date)) : new Date().toISOString(),
          updated: data.updated ? (data.updated instanceof Date ? data.updated.toISOString() : String(data.updated)) : undefined,
          draft: !!data.draft,
          preview: !!data.preview,
          preview_passcode: data.preview_passcode ? String(data.preview_passcode) : undefined,
          selected: !!data.selected,
          tags: (Array.isArray(data.tags) ? data.tags : []).map(t => String(t).toLowerCase().trim()).filter(Boolean),
        }
      });
    } catch {
      toast.error("Failed to load metadata");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveFrontmatter(newData: FrontmatterData) {
    if (!frontmatterConfig) return;
    const targetPath = frontmatterConfig.path;
    setSaving(true);
    try {
      // Use current content if we are editing the currently open file
      // otherwise we need to fetch the content again to apply frontmatter
      let bodyContent: string;
      if (selectedNode && selectedNode.path === targetPath) {
        bodyContent = matter(content).content;
      } else {
        const fileContent = await getContentAction(targetPath);
        bodyContent = matter(fileContent).content;
      }
      
      // Clean up newData to ensure only serializable fields are included
      // YAML stringifier (js-yaml used by gray-matter) throws on undefined values
      const sanitizedData = Object.fromEntries(
        Object.entries(newData)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => {
            if (k === 'tags' && Array.isArray(v)) {
              return [k, v.map(t => String(t).toLowerCase().trim()).filter(Boolean)];
            }
            return [k, v];
          })
      );
      
      const newFileContent = matter.stringify(bodyContent, sanitizedData);
      
      const result = await saveContentAction(targetPath, newFileContent);
      if (result.success) {
        if (selectedNode && selectedNode.path === targetPath) {
          setContent(newFileContent);
          setIsDirty(false);
        }
        setFrontmatterModal(null);
        toast.success("Metadata updated");
        loadGitStatus();
        // Force preview update if it's an MDX file and it's the currently open one
        if (targetPath.endsWith('.mdx') && selectedNode && selectedNode.path === targetPath) {
          updatePreview(newFileContent);
        }
      } else {
        throw new Error("Save failed");
      }
    } catch (e: any) {
      console.error("Error saving frontmatter:", e);
      toast.error(e.message || "Failed to save metadata");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadDir(path: string) {
    setLoading(true);
    try {
      const result = await downloadDirectoryAction(path);
      if (result.success && result.data) {
        const link = document.createElement('a');
        link.href = `data:application/zip;base64,${result.data}`;
        link.download = result.fileName || 'download.zip';
        link.click();
        toast.success("Download started");
      } else {
        toast.error(result.error || "Download failed");
      }
    } catch {
      toast.error("Download failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadZip(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    let targetDir = "";
    if (selectedNode) {
      targetDir = selectedNode.type === 'directory' ? selectedNode.path : selectedNode.path.split('/').slice(0, -1).join('/');
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dir', targetDir);
      const result = await uploadZipAction(formData);
      if (result.success) {
        toast.success("ZIP uploaded and extracted");
        loadTree();
        loadGitStatus();
      } else {
        toast.error(result.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  }

  async function handleCreateFolder() {
    setInputConfig({
      isOpen: true,
      title: "New Folder",
      placeholder: "Folder name...",
      confirmLabel: "Create",
      onConfirm: async (name) => {
        setInputConfig(null);
        if (!name) return;
        
        let basePath = "";
        if (selectedNode) {
          basePath = selectedNode.type === 'directory' ? selectedNode.path : selectedNode.path.split('/').slice(0, -1).join('/');
        }
        
        const fullPath = basePath ? `${basePath}/${name}` : name;
        await performAction('create_folder', { path: fullPath });
      },
      onCancel: () => setInputConfig(null)
    });
  }

  async function handleCreateFile() {
    setInputConfig({
      isOpen: true,
      title: "New File",
      placeholder: "Filename (e.g. data.json, post.mdx)...",
      confirmLabel: "Create",
      onConfirm: async (name) => {
        setInputConfig(null);
        if (!name) return;
        
        let basePath = "";
        if (selectedNode) {
          basePath = selectedNode.type === 'directory' ? selectedNode.path : selectedNode.path.split('/').slice(0, -1).join('/');
        }
        
        const fullPath = basePath ? `${basePath}/${name}` : name;
        setLoading(true);
        try {
          const result = await createFileAction(fullPath, '');
          if (result.success) {
            toast.success("File created");
            loadTree();
            loadGitStatus();
          }
        } catch (error: any) {
          toast.error(error.message || "Failed to create file");
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => setInputConfig(null)
    });
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
        const formData = new FormData();
        formData.append('file', file);
        formData.append('dir', targetDir);
        await uploadFileAction(formData);
      }
      toast.success(`${files.length} files uploaded`);
      loadTree();
      loadGitStatus();
    } catch {
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
      const result = await performAction('create_post', { 
        slug: newPostData.slug, 
        title: newPostData.title, 
        description: newPostData.description 
      });
      if (result.success) {
        toast.success("Post created successfully");
        setShowCreateModal(false);
        setNewPostData({ title: '', slug: '', description: '' });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  const components = {
    ...clientMdxComponents,
    ModelViewer: (props: { url: string; [key: string]: unknown }) => {
      let url = props.url;
      const { type, slug } = getFileInfo();
      if (slug && url && typeof url === 'string' && !url.startsWith('http') && !url.startsWith('/') && !url.startsWith('data:')) {
        const normalizedUrl = url.startsWith('./') ? url.slice(2) : url;
        url = `/assets/${type}/${slug}/${normalizedUrl}?v=${previewVersion}`;
      }
      return <ModelViewerWrapper {...props} url={url} />;
    },
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
      let finalSrc = src;
      const { type, slug } = getFileInfo();
      if (slug && src && typeof src === 'string' && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
        const normalizedSrc = src.startsWith('./') ? src.slice(2) : src;
        finalSrc = `/assets/${type}/${slug}/${normalizedSrc}?v=${previewVersion}`;
      }
      return <img {...props} src={finalSrc} alt={alt} className="rounded-lg my-8 w-full" />;
    },
    Video: (props: any) => {
      const { type, slug } = getFileInfo();
      return <Video {...props} assetPath={`/assets/${type}/${slug}`} version={previewVersion} />;
    }
  };

  const handleJsonVisualChange = (newData: any[]) => {
    setContent(JSON.stringify(newData, null, 2));
    setIsDirty(true);
  };

  const handleJsonRemoveProject = (index: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Remove Project",
      message: "Are you sure you want to remove this project from the list?",
      confirmLabel: "Remove",
      confirmVariant: "danger",
      onConfirm: () => {
        setConfirmModal(null);
        try {
          const jsonData = JSON.parse(content);
          if (Array.isArray(jsonData)) {
            const newData = [...jsonData];
            newData.splice(index, 1);
            handleJsonVisualChange(newData);
            toast.success("Project removed from list");
          }
        } catch (e) {}
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  // --- Drop target for Root ---
  const [{ isOverRoot }, dropToRoot] = useDrop(() => ({
    accept: ItemTypes.FILE,
    drop: (item: any, monitor) => {
      if (monitor.didDrop()) return;
      if (item.path.includes('/')) {
        handleMove(item.path, "");
      }
    },
    collect: (monitor) => ({
      isOverRoot: monitor.isOver({ shallow: true }) && monitor.canDrop(),
    }),
  }), [handleMove]);

  const rootRef = (el: HTMLDivElement | null) => {
    dropToRoot(el);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
        {confirmConfig && <ConfirmModal {...confirmConfig} />}
        {inputConfig && <InputDialog {...inputConfig} />}
        {frontmatterConfig && <FrontmatterModal isOpen={frontmatterConfig.isOpen} data={frontmatterConfig.data} availableTags={availableTags} onSave={handleSaveFrontmatter} onCancel={() => setFrontmatterModal(null)} />}
        {translateConfig && <TranslateModal isOpen={translateConfig.isOpen} currentPath={translateConfig.path} onConfirm={(locales) => handleTranslate(translateConfig.path, locales)} onCancel={() => setTranslateConfig(null)} />}
        
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
                <span className={`font-mono truncate content-center ${isDirty ? 'italic' : ''}`}>
                  {selectedNode.name}{isDirty ? '*' : ''}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {(isMdx || (isJson && hasVisualEditor)) && (
              <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1 mr-2 lg:mr-4">
                {isMdx ? (
                  <>
                    <button onClick={() => setPreviewMode('edit')} className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${previewMode === 'edit' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}>Edit</button>
                    <button onClick={() => setPreviewMode('split')} className={`hidden sm:block px-3 py-1 text-xs font-bold rounded-md transition-all ${previewMode === 'split' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}>Split</button>
                    <button onClick={() => setPreviewMode('preview')} className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${previewMode === 'preview' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}>Prev</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setPreviewMode('edit')} className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${previewMode === 'edit' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}>Source</button>
                    <button onClick={() => setPreviewMode('visual')} className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${previewMode === 'visual' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}>Visual</button>
                  </>
                )}
              </div>
            )}
            
            <button
              onClick={handlePreview}
              disabled={!selectedNode || !selectedNode.path.endsWith('.mdx')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg font-bold transition-all text-sm border ${
                selectedNode?.path.endsWith('.mdx') 
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50' 
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 opacity-50 cursor-not-allowed'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Preview</span>
            </button>

            <button
              onClick={() => setAutosave(!autosave)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg font-bold transition-all text-xs sm:text-sm border ${
                autosave 
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400' 
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
              }`}
              title={autosave ? "Autosave ON" : "Autosave OFF"}
            >
              {autosave ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              <span className="hidden lg:inline">Autosave</span>
            </button>
            

            <button
              onClick={() => handleSave()}
              disabled={saving || (!isMdx && !isJson && !isTxt && !isHtml && !isCss && !isJs)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg font-bold transition-all text-sm border ${
                isDirty 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
              }`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar */}
          <div className={`
            ${isSidebarOpen ? 'w-full lg:w-80 border-r' : 'w-0 overflow-hidden border-0'} 
            absolute lg:relative z-40 h-full border-gray-200 dark:border-gray-800 
            flex flex-col bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out
          `}>
            <div className="min-w-full lg:min-w-[20rem] flex flex-col h-full">
              {/* Tabs */}
              <div className="flex p-2 bg-gray-100 dark:bg-gray-800/50">
                <button 
                  onClick={() => setSidebarTab('files')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 m-1 rounded-lg text-xs font-bold transition-all ${sidebarTab === 'files' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-gray-50' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Folder className="w-3.5 h-3.5" /> Files
                </button>
                <button 
                  onClick={() => setSidebarTab('git')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 m-1 rounded-lg text-xs font-bold transition-all border-2 ${
                    sidebarTab === 'git' 
                      ? `bg-white dark:bg-gray-700 text-blue-600 dark:text-gray-50 ${gitStatus.status !== 'Clean' ? 'border-red-500/50' : 'border-transparent'}` 
                      : gitStatus.status !== 'Clean'
                        ? 'border-red-500/50 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <GitBranch className={`w-3.5 h-3.5 ${gitStatus.status !== 'Clean' ? 'text-red-500' : ''}`} /> Source & Deploy
                </button>
              </div>

              {sidebarTab === 'files' ? (
                <>
                  <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex flex-col gap-2">
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all"
                    >
                      <PenSquare className="w-4 h-4" /> New Article
                    </button>
                    <div className="flex gap-2">
                      <button onClick={handleCreateFile} className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all">
                        <File className="w-3.5 h-3.5" /> File
                      </button>
                      <button onClick={handleCreateFolder} className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all">
                        <FolderPlus className="w-3.5 h-3.5" /> Folder
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all" title="Upload Files">
                        <Upload className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => zipInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 text-purple-600 dark:text-purple-400 transition-all" title="Upload ZIP">
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input type="file" ref={fileInputRef} multiple className="hidden" onChange={handleUpload} />
                    <input type="file" ref={zipInputRef} accept=".zip" className="hidden" onChange={handleUploadZip} />
                  </div>
                  
                  <div 
                    ref={rootRef}
                    className={`flex-1 overflow-y-auto p-2 transition-colors ${isOverRoot ? 'bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-500 ring-inset' : ''}`}
                  >
                    {loading && tree.length === 0 ? (
                      <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                    ) : (
                      <div className="space-y-0.5">
                        {tree.map(node => (
                          <div key={node.path}>
                            <DraggableFile 
                              node={node} 
                              onSelect={setSelectedNode} 
                              onDelete={handleDelete}
                              onRename={handleRename}
                              onMove={handleMove}
                              onCompress={handleCompress}
                              onDuplicate={handleDuplicate}
                              onTranslate={(path) => setTranslateConfig({ isOpen: true, path })}
                              onEditFrontmatter={handleEditFrontmatter}
                              onDownloadDir={handleDownloadDir}
                              selectedPath={selectedNode?.path || null}
                              expandedPaths={expandedPaths}
                              toggleExpand={toggleExpand}
                            />
                            {node.name === 'apps' && node.path.split('/').length === 1 && (
                              <div className="my-2 border-t border-gray-100 dark:border-gray-800/50 mx-2" />
                            )}
                          </div>
                        ))}
                        {tree.length === 0 && !loading && (
                          <div className="text-center p-8 text-gray-400 text-xs italic">
                            Empty directory
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2 bg-gray-50/50 dark:bg-gray-900/50">
                    <button 
                      onClick={handleUndo}
                      disabled={undoStack.length === 0}
                      title="Undo"
                      className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-xs font-bold text-gray-600 dark:text-gray-400"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Undo
                    </button>
                    <button 
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      title="Redo"
                      className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-xs font-bold text-gray-600 dark:text-gray-400"
                    >
                      <Redo2 className="w-3.5 h-3.5" /> Redo
                    </button>
                    <button 
                      onClick={() => { loadTree(); loadGitStatus(); }}
                      title="Refresh"
                      className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-600 dark:text-gray-400"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Git Operations */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Repository Control</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={handleGitCommit}
                        disabled={gitOperation !== 'none' || gitStatus.status === 'Clean'}
                        className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-blue-500 transition-all group disabled:opacity-50"
                      >
                        <GitCommit className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold">Commit</span>
                        <span className="text-[8px] text-gray-400 text-center leading-tight">Save snapshot</span>
                      </button>
                      <button 
                        onClick={handleGitPush}
                        disabled={gitOperation !== 'none'}
                        className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-green-500 transition-all group disabled:opacity-50"
                      >
                        <Send className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold">Push</span>
                        <span className="text-[8px] text-gray-400 text-center leading-tight">Sync to remote</span>
                      </button>
                      <button 
                        onClick={handleGitPull}
                        disabled={gitOperation !== 'none'}
                        className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-orange-500 transition-all group disabled:opacity-50"
                      >
                        <GitPullRequest className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold">Pull (Rebase)</span>
                        <span className="text-[8px] text-gray-400 text-center leading-tight">Get remote changes</span>
                      </button>
                      <button 
                        onClick={handleGitStash}
                        disabled={gitOperation !== 'none' || gitStatus.status === 'Clean'}
                        className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-amber-500 transition-all group disabled:opacity-50"
                      >
                        <Archive className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold">Stash</span>
                        <span className="text-[8px] text-gray-400 text-center leading-tight">Save work for later</span>
                      </button>
                      <button 
                        onClick={handleGitPop}
                        disabled={gitOperation !== 'none'}
                        className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:border-amber-500 transition-all group disabled:opacity-50"
                      >
                        <ArchiveRestore className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold">Stash Pop</span>
                        <span className="text-[8px] text-gray-400 text-center leading-tight">Restore stashed work</span>
                      </button>
                      <button 
                        onClick={handleGitReset}
                        disabled={gitOperation !== 'none'}
                        className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 hover:border-red-500 transition-all group disabled:opacity-50"
                      >
                        <RotateCcw className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold">Hard Reset</span>
                        <span className="text-[8px] text-red-400 text-center leading-tight">Discard all changes</span>
                      </button>
                      <button
                        onClick={handleDeploy}
                        disabled={gitOperation !== 'none' || deployStatus.isActive}
                        className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 hover:border-purple-500 transition-all group disabled:opacity-50"
                      >
                        {deployStatus.isActive ? <RefreshCw className="w-5 h-5 text-purple-500 animate-spin" /> : <Rocket className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />}
                        <span className="text-[10px] font-bold">Deploy</span>
                        <span className="text-[8px] text-purple-400 text-center leading-tight">Rebuild & Restart</span>
                      </button>
                      </div>
                      </div>
                  {/* Git Status */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Git Status</h4>
                    <div className="bg-gray-100 dark:bg-gray-800/80 rounded-xl p-3 font-mono text-[10px] border border-gray-200 dark:border-gray-800 leading-relaxed overflow-x-auto whitespace-pre">
                      {gitStatus.status === 'Clean' ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Working directory clean
                        </div>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400">{gitStatus.status}</span>
                      )}
                    </div>
                    {gitStatus.diff && (
                      <div className="bg-gray-900 rounded-xl p-3 font-mono text-[9px] border border-gray-800 leading-tight overflow-x-auto whitespace-pre text-gray-300">
                        {gitStatus.diff}
                      </div>
                    )}
                  </div>

                  {/* Deploy Logs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deployment Monitor</h4>
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${deployStatus.isActive ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-gray-200 text-gray-600'}`}>
                        {deployStatus.isActive ? 'In Progress' : 'Idle'}
                      </div>
                    </div>
                    <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 border-b border-gray-800">
                        <TerminalIcon className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Console Output</span>
                      </div>
                      <div className="p-3 font-mono text-[9px] leading-normal text-green-500 h-40 overflow-y-auto whitespace-pre-wrap">
                        {deployStatus.logs || "No recent deployment logs found."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Overlay for mobile sidebar */}
          {isSidebarOpen && (
            <div 
              className="lg:hidden absolute inset-0 z-30 bg-black/60"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-gray-950 min-h-0">
            {selectedNode ? (
              <>
                {(isMdx || isJson || isTxt) ? (
                  <>
                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-full min-h-0">
                      {/* Visual Editor View */}
                      {isJson && hasVisualEditor && previewMode === 'visual' && (
                        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/10">
                          {(() => {
                            try {
                              const jsonData = JSON.parse(content);
                              if (Array.isArray(jsonData)) {
                                return <ProjectsVisualEditor data={jsonData} onChange={handleJsonVisualChange} onRemoveRequest={handleJsonRemoveProject} setInputConfig={setInputConfig} availableTags={availableTags} />;
                              }
                              return <div className="p-12 text-center text-gray-500">Visual editor only supports array-based JSON for now.</div>;
                            } catch (e) {
                              return <div className="p-12 text-center text-red-500 font-mono text-sm">Invalid JSON syntax. Please fix in Source mode.</div>;
                            }
                          })()}
                        </div>
                      )}

                      {/* MDX Preview View */}
                      {isMdx && (previewMode === 'preview' || previewMode === 'split') && (
                        <div className={`flex-1 overflow-y-auto p-4 sm:p-8 order-1 lg:order-2 ${previewMode === 'split' ? 'bg-gray-50/30 dark:bg-gray-900/10' : ''}`}>
                          <div className="max-w-none prose prose-neutral dark:prose-invert">
                            {mdxSource && <MDXRemote {...mdxSource} components={components} />}
                          </div>
                        </div>
                      )}
                      
                      {/* Source Editor View */}
                      {(previewMode === 'edit' || (isMdx && previewMode === 'split') || (isJson && previewMode !== 'visual') || isHtml || isCss || isJs) && (
                        <div className={`flex-1 flex flex-col min-h-0 order-2 lg:order-1 ${previewMode === 'split' ? 'border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-gray-800' : ''}`}>
                          <textarea
                            value={content}
                            onChange={(e) => {
                              setContent(e.target.value);
                              setIsDirty(true);
                            }}
                            className="flex-1 p-4 sm:p-6 font-mono text-base sm:text-sm resize-none focus:outline-none bg-transparent text-gray-800 dark:text-gray-200 leading-relaxed overflow-y-auto"
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
                        className="max-w-full max-h-[60vh] object-contain rounded-lg border border-gray-200 dark:border-gray-800 mb-8" 
                      />
                    ) : (
                      <div className="p-8 rounded-full bg-gray-100 dark:bg-gray-800 mb-6 border border-gray-200 dark:border-gray-700">
                        {(() => {
                          const Icon = getFileIcon(selectedNode.name);
                          return <Icon className="w-16 h-16 text-gray-400" />;
                        })()}
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-2">{selectedNode.name}</h3>
                    {selectedNode.type === 'file' && (
                      <div className="flex items-center gap-4 text-gray-500 mb-6">
                        <span className="px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-xs font-mono">
                          {formatSize(selectedNode.size)}
                        </span>
                        <span className="text-xs uppercase tracking-widest">{selectedNode.name.split('.').pop()}</span>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <a 
                        href={`/assets/${getFileInfo().type}/${getFileInfo().slug}/${selectedNode.name}`}
                        download
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-bold text-sm"
                      >
                        <Download className="w-4 h-4" /> Download
                      </a>
                      <button 
                        onClick={() => handleRename(selectedNode.path)}
                        className="flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors font-bold text-sm"
                      >
                        <PenSquare className="w-4 h-4" /> Rename
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4 px-6 text-center">
                <div className="p-6 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <Plus className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">Select a file to begin</p>
                <p className="text-sm max-w-xs text-gray-500 dark:text-gray-400">Choose a file from the sidebar or create a new article to get started.</p>
                <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-xs text-gray-400 font-medium">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-mono">Ctrl+S</kbd>
                    <span>Quick Save</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3" />
                    <span>Drag & Drop files</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Post Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md overflow-hidden">
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
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreatePost}
                    disabled={loading || !newPostData.title || !newPostData.slug}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold transition-all flex items-center justify-center gap-2"
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

// --- Main Editor Wrapper ---

export default function ContentEditor() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <EditorInternal />
    </DndProvider>
  );
}
