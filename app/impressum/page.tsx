import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";
import { TENANT } from "@/lib/tenant.config";

export const metadata: Metadata = { title: "Impressum" };

export default function ImpressumPage() {
  const p = TENANT.legal.provider;
  return (
    <LegalPage title="Impressum">
      <section>
        <h2>Angaben zum Anbieter</h2>
        <p>
          {p.name}
          <br />
          {p.street}
          <br />
          {p.postalCity}
        </p>
        <p>Vertreten durch: {p.representative}</p>
      </section>
      <section>
        <h2>Kontakt</h2>
        <p>
          Telefon: {p.phone}
          <br />
          E-Mail: <a className="underline" href={`mailto:${p.email}`}>{p.email}</a>
        </p>
      </section>
      <section>
        <h2>Berufsrechtliche Angaben</h2>
        <p>Berufsbezeichnung: {p.professionalTitle}</p>
        <p>Zuständige Kammer: {p.chamber}</p>
      </section>
      <section>
        <h2>Umsatzsteuer-Identifikationsnummer</h2>
        <p>{p.vatId}</p>
      </section>
    </LegalPage>
  );
}
