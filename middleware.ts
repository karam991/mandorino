import { NextResponse, type NextRequest } from "next/server";

/**
 * Serverseitiger Schutz für /team/* (außer /team/login).
 *
 * Supabase-Modus: Session aus Cookies (`@supabase/ssr`), Token wird gegen den
 * Auth-Server geprüft (`getUser`), danach muss die E-Mail in `tenant_team`
 * stehen (per RLS nur für Team-Mitglieder lesbar → 0 Zeilen = kein Zugriff).
 * Demo-Modus (NEXT_PUBLIC_DEMO_MODE=1, ohne Supabase): kein Server-Check,
 * es gibt dort keine echten Daten.
 * Nichts konfiguriert und kein Demo-Flag: /team/* ist gesperrt (fail closed).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/team/login") return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "1") return NextResponse.next();
    return redirectToLogin(req);
  }

  let res = NextResponse.next({ request: req });

  const { createServerClient } = await import("@supabase/ssr");
  const sb = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await sb.auth.getUser();
  const email = data.user?.email;
  if (!email) return redirectToLogin(req);

  const { data: member } = await sb
    .from("tenant_team")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (!member) return redirectToLogin(req);

  return res;
}

function redirectToLogin(req: NextRequest) {
  const login = req.nextUrl.clone();
  login.pathname = "/team/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/team/:path*"] };
