'use server';

import { auth } from "@/auth";
import { addMicroblogPost } from "@/lib/microblog";
import { revalidatePath } from "next/cache";

export async function createPostAction(content: string, imageBase64?: string | null) {
  const session = await auth();
  
  // Controllo autorizzazione: aggiungo sia l'email che un possibile check su username se lo implementiamo
  const isAuthorized = 
    session?.user?.email?.toLowerCase().trim() === "iacobuccivalerio@gmail.com" || 
    (session?.user as any)?.username === "iacobucci";

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
