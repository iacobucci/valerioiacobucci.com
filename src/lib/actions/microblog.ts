'use server';

import { auth, isAuthorized } from "@/auth";
import { addMicroblogPost, toggleMicroblogReaction, deleteMicroblogPost, updateMicroblogPost } from "@/lib/microblog";
import { revalidatePath } from "next/cache";

export async function createPostAction(content: string, imageBase64?: string | null, isThread: boolean = false, showLinkPreview: boolean = true) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  let imageBuffer: Buffer | null = null;
  if (imageBase64) {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    imageBuffer = Buffer.from(base64Data, 'base64');
  }

  // Splitting logic
  const MAX_LENGTH = 140;
  const chunks: string[] = [];
  let remaining = content.trim();

  if (remaining.length <= MAX_LENGTH) {
    chunks.push(remaining);
  } else {
    while (remaining.length > MAX_LENGTH) {
      let splitIndex = remaining.lastIndexOf('\n', MAX_LENGTH);
      if (splitIndex === -1 || splitIndex < MAX_LENGTH * 0.5) {
        splitIndex = remaining.lastIndexOf(' ', MAX_LENGTH);
      }
      
      if (splitIndex === -1) {
        splitIndex = MAX_LENGTH;
      }

      chunks.push(remaining.substring(0, splitIndex).trim());
      remaining = remaining.substring(splitIndex).trim();
    }
    if (remaining.length > 0) {
      chunks.push(remaining);
    }
  }

  // Save chunks sequentially
  for (let i = 0; i < chunks.length; i++) {
    const isFirst = i === 0;
    const chunkContent = chunks[i];
    
    // First chunk gets the user-selected isThread state and the image
    // Subsequent chunks are ALWAYS threaded to the previous one
    const currentIsThread = isFirst ? isThread : true;
    const currentImage = isFirst ? imageBuffer : null;
    
    await addMicroblogPost(chunkContent, currentImage, currentIsThread, showLinkPreview);
  }
  
  revalidatePath("/[locale]/microblog", "page");
  return { success: true };
}

export async function updatePostAction(id: number, content: string, isThread?: boolean, showLinkPreview?: boolean) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  await updateMicroblogPost(id, content, isThread, showLinkPreview);
  
  revalidatePath("/[locale]/microblog", "page");
  return { success: true };
}

export async function deletePostAction(id: number) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  await deleteMicroblogPost(id);
  
  revalidatePath("/[locale]/microblog", "page");
  return { success: true };
}

export async function toggleReactionAction(postId: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("You must be logged in to vote");
  }

  const user = session.user as { id?: string; username?: string; name?: string | null; image?: string | null };
  const userId = user.id;
  const username = user.username || user.name;
  const userImage = user.image || undefined;

  if (!userId || !username) {
    throw new Error("User information not found in session");
  }

  await toggleMicroblogReaction(postId, userId, username, userImage);
  
  revalidatePath("/[locale]/microblog", "page");
  return { success: true };
}
