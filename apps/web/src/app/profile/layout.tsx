import { AppChrome } from "@/components/shell/AppChrome";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppChrome>{children}</AppChrome>;
}
