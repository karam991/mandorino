"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md p-8 text-center">
        <h1 className="text-2xl font-semibold">Da ist etwas schiefgelaufen.</h1>
        <p className="mt-3 text-sm text-muted">
          Bitte versuchen Sie es noch einmal. Ihre Eingaben auf dieser Seite sind nicht verloren gegangen.
        </p>
        <button type="button" onClick={reset} className="btn-primary mt-6">
          Erneut versuchen
        </button>
      </div>
    </main>
  );
}
