'use server';

import { auth } from "@/auth";
import { addMicroblogPost, toggleMicroblogReaction } from "@/lib/microblog";
import { revalidatePath } from "next/cache";

export async function createPostAction(content: string, imageBase64?: string | null) {
  const session = await auth();
  
  const user = session?.user as { email?: string | null; username?: string } | undefined;
  // Controllo autorizzazione: aggiungo sia l'email che un possibile check su username se lo implementiamo
  const isAuthorized = 
    user?.email?.toLowerCase().trim() === "iacobuccivalerio@gmail.com" || 
    user?.username === "iacobucci";

  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  let imageBuffer: Buffer | null = null;
  if (imageBase64) {
    // Rimuove il prefisso data:image/xxx;base64, se presente
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    imageBuffer = Buffer.from(base64Data, 'base64');
  }

  await addMicroblogPost(content, imageBuffer);
  
  revalidatePath("/[locale]/microblog", "page");
  return { success: true };
}

export async function toggleReactionAction(postId: number) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("You must be logged in to vote");
  }

  const user = session.user as { id?: string; sub?: string; username?: string; name?: string | null; image?: string | null };
  const userId = user.id || user.sub;
  const username = user.username || user.name || "Unknown";
  const userImage = user.image || undefined;

  if (!userId) {
    throw new Error("User ID not found in session");
  }

  await toggleMicroblogReaction(postId, userId, username, userImage);
  
  revalidatePath("/[locale]/microblog", "page");
  return { success: true };
}
