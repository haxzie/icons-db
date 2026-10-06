import { AppChrome } from "@/components/shell/AppChrome";
import { PreloadSearchIndex } from "@/components/search/PreloadSearchIndex";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PreloadSearchIndex />
      <AppChrome>{children}</AppChrome>
    </>
  );
}
