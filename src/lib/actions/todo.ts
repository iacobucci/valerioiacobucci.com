'use server';

import fs from 'fs';
import path from 'path';
import { getCachedTodo, setCachedTodo } from '../todo-cache';

export async function getTodoAction() {
  try {
    let content = getCachedTodo();

    if (!content) {
      const filePath = path.join(process.cwd(), 'content/todo.txt');
      if (fs.existsSync(filePath)) {
        content = fs.readFileSync(filePath, 'utf8');
        setCachedTodo(content);
      } else {
        return "No tasks found";
      }
    }

    return content;
  } catch (error) {
    console.error('Error in getTodoAction:', error);
    return "Error reading TODO list";
  }
}
