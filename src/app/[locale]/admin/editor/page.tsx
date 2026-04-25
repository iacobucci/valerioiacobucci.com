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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Content Manager
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Edit your website's MDX content directly from the production environment.
          </p>
        </header>
        
        <ContentEditor />
      </div>
    </div>
  );
}
