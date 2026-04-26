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
    <div className="fixed inset-0 top-16 bg-gray-100 dark:bg-gray-950 p-0 sm:p-6 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full sm:rounded-xl overflow-hidden border-t sm:border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <ContentEditor />
      </div>
    </div>
  );
}
