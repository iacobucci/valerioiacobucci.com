'use server';

import { isAuthorized } from "@/auth";
import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { revalidatePath } from "next/cache";
import sharp from 'sharp';

const CONTENT_PATH = path.join(process.cwd(), 'content');

function resolveAndValidatePath(relativePath: string): string {
  const fullPath = path.resolve(CONTENT_PATH, relativePath);
  if (!fullPath.startsWith(CONTENT_PATH)) {
    throw new Error("Invalid path: Out of bounds");
  }
  return fullPath;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
}

export async function listContentAction(): Promise<FileNode[]> {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  function getTree(dirPath: string): FileNode[] {
    if (!fs.existsSync(dirPath)) return [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    return entries
      .filter(entry => entry.name !== '.git' && entry.name !== 'node_modules')
      .map(entry => {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(CONTENT_PATH, fullPath);
        
        if (entry.isDirectory()) {
          return {
            name: entry.name,
            path: relativePath,
            type: 'directory' as const,
            children: getTree(fullPath)
          };
        } else {
          const stats = fs.statSync(fullPath);
          return {
            name: entry.name,
            path: relativePath,
            type: 'file' as const,
            size: stats.size
          };
        }
      })
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });
  }

  return getTree(CONTENT_PATH);
}

export async function getContentAction(relativeFilePath: string) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const fullPath = resolveAndValidatePath(relativeFilePath);
  if (!fs.existsSync(fullPath)) throw new Error("File not found");

  return fs.readFileSync(fullPath, 'utf8');
}

export async function saveContentAction(relativeFilePath: string, content: string) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const fullPath = resolveAndValidatePath(relativeFilePath);

  fs.writeFileSync(fullPath, content, 'utf8');
  revalidatePath("/", "layout");
  return { success: true };
}

export async function uploadFileAction(formData: FormData) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const relativeDirPath = formData.get('dir') as string;
  const file = formData.get('file') as File;
  
  if (!file) throw new Error("No file uploaded");

  const dirPath = resolveAndValidatePath(relativeDirPath);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const fullPath = path.join(dirPath, file.name);
  // Re-validate final path in case file.name contains traversal
  if (!path.resolve(fullPath).startsWith(CONTENT_PATH)) {
    throw new Error("Invalid file name");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  
  fs.writeFileSync(fullPath, buffer);
  return { success: true };
}

export async function deleteFileAction(relativeFilePath: string) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const fullPath = resolveAndValidatePath(relativeFilePath);

  if (fs.statSync(fullPath).isDirectory()) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(fullPath);
  }
  
  return { success: true };
}

export async function renameFileAction(oldRelativePath: string, newName: string) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const oldFullPath = resolveAndValidatePath(oldRelativePath);
  const newFullPath = path.join(path.dirname(oldFullPath), newName);

  if (!newFullPath.startsWith(CONTENT_PATH)) {
    throw new Error("Invalid new name");
  }

  fs.renameSync(oldFullPath, newFullPath);
  return { success: true };
}

export async function moveFileAction(oldRelativePath: string, newParentRelativePath: string) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const oldFullPath = resolveAndValidatePath(oldRelativePath);
  const newParentFullPath = resolveAndValidatePath(newParentRelativePath);
  const newFullPath = path.join(newParentFullPath, path.basename(oldRelativePath));

  if (!newFullPath.startsWith(CONTENT_PATH)) {
    throw new Error("Invalid move destination");
  }

  fs.renameSync(oldFullPath, newFullPath);
  return { success: true };
}

export async function compressImageAction(relativeFilePath: string) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const fullPath = resolveAndValidatePath(relativeFilePath);

  const ext = path.extname(fullPath);
  const base = fullPath.slice(0, -ext.length);
  const outputPath = `${base}-compressed.webp`;

  await sharp(fullPath)
    .webp({ quality: 80 })
    .toFile(outputPath);

  return { success: true, newPath: path.relative(CONTENT_PATH, outputPath) };
}

export async function createDirectoryAction(relativeDirPath: string) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const fullPath = resolveAndValidatePath(relativeDirPath);

  fs.mkdirSync(fullPath, { recursive: true });
  return { success: true };
}

export async function createFileAction(relativeFilePath: string, content: string = '') {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const fullPath = resolveAndValidatePath(relativeFilePath);
  if (fs.existsSync(fullPath)) {
    throw new Error("File already exists");
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  return { success: true };
}

export async function createPostAction(slug: string, title: string, description: string) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const postDir = path.join(CONTENT_PATH, slug);
  if (fs.existsSync(postDir)) {
    throw new Error("Post with this slug already exists");
  }

  fs.mkdirSync(postDir, { recursive: true });

  const date = new Date().toISOString();
  const template = `---
title: "${title}"
description: "${description}"
date: "${date}"
draft: true
tags: []
---

Write your content here...
`;

  const filePath = path.join(postDir, 'en.mdx');
  fs.writeFileSync(filePath, template, 'utf8');

  revalidatePath("/", "layout");
  return { success: true, path: `${slug}/en.mdx` };
}

export async function getGitStatusAction() {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  try {
    const status = execSync('git -C content status --short', { encoding: 'utf8' });
    const diff = execSync('git -C content diff --stat', { encoding: 'utf8' });
    return { success: true, status, diff };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function gitCommitAction(message: string) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  try {
    spawnSync('git', ['-C', 'content', 'add', '.'], { stdio: 'inherit' });
    const result = spawnSync('git', ['-C', 'content', 'commit', '-m', message], { stdio: 'inherit' });
    
    if (result.status !== 0) {
      throw new Error(`Git commit failed with status ${result.status}`);
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function gitPushAction() {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  try {
    const result = spawnSync('git', ['-C', 'content', 'push'], { stdio: 'inherit' });
    if (result.status !== 0) {
       throw new Error(`Git push failed with status ${result.status}`);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function gitPullAction() {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  try {
    // Using rebase for a cleaner history in a single-user workflow
    const result = spawnSync('git', ['-C', 'content', 'pull', '--rebase'], { stdio: 'inherit' });
    if (result.status !== 0) {
       throw new Error(`Git pull failed with status ${result.status}`);
    }
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: "Pull failed. You might have local conflicts or changes that need stashing.",
      details: error.message 
    };
  }
}

export async function gitStashAction() {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  try {
    spawnSync('git', ['-C', 'content', 'stash'], { stdio: 'inherit' });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function gitStashPopAction() {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  try {
    const result = spawnSync('git', ['-C', 'content', 'stash', 'pop'], { stdio: 'inherit' });
    if (result.status !== 0) {
       throw new Error("Stash pop failed. You might have conflicts with your current changes.");
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Stash pop failed. You might have conflicts with your current changes." };
  }
}

export async function gitResetAction() {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  try {
    // Hard reset to the last committed state to recover from messy states
    spawnSync('git', ['-C', 'content', 'reset', '--hard'], { stdio: 'inherit' });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDeployStatusAction() {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const UPDATE_SERVICE = 'update-valerioiacobucci.com.service';
  try {
    const isActive = execSync(`systemctl --user is-active ${UPDATE_SERVICE}`, { encoding: 'utf8' }).trim();
    const status = execSync(`systemctl --user status ${UPDATE_SERVICE} --no-pager`, { encoding: 'utf8' });
    const logs = execSync(`journalctl --user -u ${UPDATE_SERVICE} -n 20 --no-pager`, { encoding: 'utf8' });
    
    return { 
      success: true, 
      isActive: isActive === 'active' || isActive === 'activating',
      status,
      logs 
    };
  } catch (error: any) {
    return { success: false, error: "Service not running or not found", details: error.message };
  }
}

export async function triggerDeployAction() {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  try {
    const updateScript = path.join(process.cwd(), 'scripts', 'update.sh');
    if (!fs.existsSync(updateScript)) throw new Error("Update script not found");
    
    execSync(`bash ${updateScript} --setup`, { stdio: 'inherit' });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function publishContentAction() {
  // Mantengo questa funzione per compatibilità ma la rifattorizzo per usare le nuove
  const commit = await gitCommitAction("Update from web editor");
  if (!commit.success && !commit.error.includes("nothing to commit")) return commit;
  
  const push = await gitPushAction();
  if (!push.success) return push;
  
  return triggerDeployAction();
}

