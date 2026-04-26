import Footer from '@/components/Footer';
import { COMMIT_HASH } from '@/lib/env';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Footer commitHash={COMMIT_HASH} />
    </>
  );
}
