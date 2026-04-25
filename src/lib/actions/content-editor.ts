'use server';

import { isAuthorized } from "@/auth";
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { revalidatePath } from "next/cache";

const CONTENT_PATH = path.join(process.cwd(), 'content');

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
            type: 'directory',
            children: getTree(fullPath)
          };
        } else {
          const stats = fs.statSync(fullPath);
          return {
            name: entry.name,
            path: relativePath,
            type: 'file',
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

  const fullPath = path.join(CONTENT_PATH, relativeFilePath);
  if (!fullPath.startsWith(CONTENT_PATH)) throw new Error("Invalid path");
  if (!fs.existsSync(fullPath)) throw new Error("File not found");

  return fs.readFileSync(fullPath, 'utf8');
}

export async function saveContentAction(relativeFilePath: string, content: string) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const fullPath = path.join(CONTENT_PATH, relativeFilePath);
  if (!fullPath.startsWith(CONTENT_PATH)) throw new Error("Invalid path");

  fs.writeFileSync(fullPath, content, 'utf8');
  revalidatePath("/", "layout");
  return { success: true };
}

export async function uploadFileAction(relativeDirPath: string, fileName: string, base64Data: string) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const dirPath = path.join(CONTENT_PATH, relativeDirPath);
  if (!dirPath.startsWith(CONTENT_PATH)) throw new Error("Invalid path");
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const fullPath = path.join(dirPath, fileName);
  const buffer = Buffer.from(base64Data, 'base64');
  
  fs.writeFileSync(fullPath, buffer);
  return { success: true };
}

export async function deleteFileAction(relativeFilePath: string) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const fullPath = path.join(CONTENT_PATH, relativeFilePath);
  if (!fullPath.startsWith(CONTENT_PATH)) throw new Error("Invalid path");

  if (fs.statSync(fullPath).isDirectory()) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(fullPath);
  }
  
  return { success: true };
}

export async function createDirectoryAction(relativeDirPath: string) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  const fullPath = path.join(CONTENT_PATH, relativeDirPath);
  if (!fullPath.startsWith(CONTENT_PATH)) throw new Error("Invalid path");

  fs.mkdirSync(fullPath, { recursive: true });
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

export async function publishContentAction() {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  try {
    execSync('git -C content add .', { stdio: 'inherit' });
    try {
      execSync('git -C content commit -m "Update from web editor"', { stdio: 'inherit' });
    } catch (e) {
      console.log("Nothing to commit", e);
    }
    
    try {
      execSync('git -C content push', { stdio: 'inherit' });
    } catch (e) {
      console.log("Git push failed", e);
    }

    const updateScript = path.join(process.cwd(), 'scripts', 'update.sh');
    if (fs.existsSync(updateScript)) {
      try {
        execSync(`bash ${updateScript} --setup`, { stdio: 'inherit' });
      } catch (e) {
        console.error("Failed to trigger update", e);
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
