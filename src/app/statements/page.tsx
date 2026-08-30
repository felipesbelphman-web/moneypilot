"use client";

import Image from "next/image";
import Link from "next/link";
import { IconCheck, IconFileDescription } from "@tabler/icons-react";

export default function StatementsPage() {
  return (
    <FlowShell
      eyebrow="Coming soon"
      summary="PDF statement import is not available yet."
      icon={<IconFileDescription />}
    >
      <h1>PDF statement import is coming soon</h1>
      <p className="flow-description">
        For now, add transactions manually or import a CSV file from the
        Transactions page.
      </p>

      <Link className="flow-primary" href="/transactions">
        Open transactions
      </Link>

      <section className="flow-panel">
        <h2>AVAILABLE NOW</h2>
        <TrustPoint title="Manual transactions">
          Add income and expenses directly to your account.
        </TrustPoint>
        <TrustPoint title="CSV import">
          Import and review CSV transactions before adding them to MoneyPilot.
        </TrustPoint>
      </section>
    </FlowShell>
  );
}

function FlowShell({
  eyebrow,
  summary,
  icon,
  children,
}: {
  eyebrow: string;
  summary: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="statement-flow">
      <section className="statement-card">
        <header className="flow-header">
          <div className="flow-brand">
            <Image
              src="/moneypilot/moneypilot-logo.svg"
              alt=""
              width={33}
              height={33}
            />
            <span>MoneyPilot</span>
          </div>
          <p>{eyebrow}</p>
          <strong>{summary}</strong>
        </header>
        <div className="flow-icon" aria-hidden="true">
          {icon}
        </div>
        {children}
      </section>
    </main>
  );
}

function TrustPoint({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flow-step">
      <span className="flow-check">
        <IconCheck />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{children}</small>
      </span>
    </div>
  );
}
