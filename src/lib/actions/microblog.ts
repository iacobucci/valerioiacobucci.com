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

  // Save chunks sequentially, but in reverse order so that the first part 
  // ends up at the top of the feed (which is ordered by date DESC)
  for (let i = chunks.length - 1; i >= 0; i--) {
    const isLogicalFirst = i === 0;
    const isLogicalLast = i === chunks.length - 1;
    const chunkContent = chunks[i];
    
    // The logically first chunk gets the image
    const currentImage = isLogicalFirst ? imageBuffer : null;

    // Threading logic:
    // - If it's the logically last chunk, use the user-selected isThread state 
    //   to potentially connect to older existing posts.
    // - All other chunks are set to isThread=true to connect to the next part of the same post.
    const currentIsThread = isLogicalLast ? isThread : true;
    
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
