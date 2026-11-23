import { Toaster } from "sonner";

/** Team-Bereich: Toasts nur hier laden, damit /embed und die Landing leicht bleiben. */
export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </>
  );
}
