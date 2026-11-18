'use server';

import { isAuthorized } from '@/auth';
import { NotebookFileData } from '@/components/notebook/types';
import { loadNotebook, saveNotebook } from '@/lib/notebooks';
import { revalidatePath } from 'next/cache';

export async function getNotebookAction(
  src: string,
  slug?: string
): Promise<{ data: NotebookFileData | null; relativePath: string }> {
  const authorized = await isAuthorized();
  return loadNotebook(src, slug, authorized);
}

export async function saveNotebookAction(
  src: string,
  data: NotebookFileData,
  slug?: string
): Promise<{ success: boolean; path: string; error?: string }> {
  const authorized = await isAuthorized();

  if (!authorized) {
    return {
      success: false,
      path: src,
      error: 'Unauthorized: Admin privileges required to save notebooks',
    };
  }

  const result = saveNotebook(src, data, slug);

  if (result.success) {
    revalidatePath('/', 'layout');
    return {
      success: true,
      path: result.relativePath,
    };
  }

  return {
    success: false,
    path: result.relativePath,
    error: result.error || 'Failed to save notebook',
  };
}
