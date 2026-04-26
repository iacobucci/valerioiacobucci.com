import { auth, isAuthorized } from "@/auth";
import { notFound, redirect } from "next/navigation";
import ContentEditor from "@/components/ContentEditor";
import { setRequestLocale } from "next-intl/server";

export default async function AdminEditorPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const authorized = await isAuthorized();

  if (!authorized) {
    const session = await auth();
    // If logged in but not authorized, show 404 to hide existence of admin page
    if (session) {
      notFound();
    } else {
      // If not logged in, redirect to login
      redirect(`/${locale}/api/auth/signin`);
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-950 p-4 sm:p-6 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full">
        <ContentEditor />
      </div>
    </div>
  );
}
