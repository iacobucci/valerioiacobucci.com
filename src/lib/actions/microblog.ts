'use server';

import { auth } from "@/auth";
import { addMicroblogPost, toggleMicroblogReaction, deleteMicroblogPost, updateMicroblogPost } from "@/lib/microblog";
import { revalidatePath } from "next/cache";

async function isAuthorized() {
  const session = await auth();
  const user = session?.user as { email?: string | null; username?: string } | undefined;
  return (
    user?.email?.toLowerCase().trim() === "iacobuccivalerio@gmail.com" || 
    user?.username === "iacobucci"
  );
}

export async function createPostAction(content: string, imageBase64?: string | null) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  let imageBuffer: Buffer | null = null;
  if (imageBase64) {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    imageBuffer = Buffer.from(base64Data, 'base64');
  }

  await addMicroblogPost(content, imageBuffer);
  
  revalidatePath("/[locale]/microblog", "page");
  return { success: true };
}

export async function updatePostAction(id: number, content: string) {
  if (!(await isAuthorized())) {
    throw new Error("Unauthorized");
  }

  await updateMicroblogPost(id, content);
  
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
