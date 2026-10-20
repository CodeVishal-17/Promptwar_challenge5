"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BudgetBoard } from "@/components/plan/BudgetBoard";
import { IdeaSpread } from "@/components/plan/IdeaSpread";
import { Overview } from "@/components/plan/Overview";
import { TimelineRail } from "@/components/plan/TimelineRail";
import { VendorList } from "@/components/plan/VendorList";
import { fileSlug } from "@/lib/brand";
import { formatLong, parseISODate } from "@/lib/dates";
import { EVENT_LABEL, SOURCE_LABEL } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import { buildSample } from "@/lib/samples";
import { deletePlan, getStoredPlan, savePlan } from "@/lib/storage";
import type { Plan } from "@/lib/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "budget", label: "Budget" },
  { id: "timeline", label: "Timeline" },
  { id: "vendors", label: "Vendors" },
  { id: "ideas", label: "Ideas" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function PlanStudio({ id }: { id: string }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState<TabId>("overview");
  const [status, setStatus] = useState("");
  const [storedSample, setStoredSample] = useState(false);

  useEffect(() => {
    const stored = getStoredPlan(id);
    if (stored) {
      setPlan(stored);
      setStoredSample(id.startsWith("sample-"));
      setMissing(false);
      return;
    }
    const sample = buildSample(id, new Date());
    if (sample) {
      setPlan(sample);
      setStoredSample(false);
      setMissing(false);
      return;
    }
    setPlan(null);
    setMissing(true);
  }, [id]);

  function commit(next: Plan, message: string) {
    setPlan(next);
    savePlan(next);
    setStoredSample(id.startsWith("sample-"));
    setStatus(message);
  }

  function onTabKey(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = TABS.findIndex((item) => item.id === tab);
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = TABS[(index + direction + TABS.length) % TABS.length];
    setTab(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  function download() {
    if (!plan) return;
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const slug = fileSlug(plan.brief.title);
    link.href = url;
    link.download = `${slug}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (missing) {
    return (
      <section className="wrap page empty">
        <h1>This plan is not in this browser.</h1>
        <p>Saved plans stay on this device. Compose a new one, or open a sample.</p>
        <div className="actions">
          <Link className="btn btn-primary" href="/new">
            New plan
          </Link>
          <Link className="btn btn-ghost" href="/plan/sample-wedding">
            Wedding sample
          </Link>
        </div>
      </section>
    );
  }

  if (!plan) {
    return (
      <section className="wrap page">
        <h1>Opening this plan…</h1>
      </section>
    );
  }

  const when = parseISODate(plan.brief.date);

  return (
    <section className="wrap page studio" data-event={plan.brief.eventType}>
      <p className="eyebrow">{EVENT_LABEL[plan.brief.eventType]}</p>
      <div className="plan-top">
        <h1>{plan.brief.title}</h1>
        <div className="plan-actions no-print">
          <button className="btn btn-ghost" type="button" onClick={() => window.print()}>
            Print
          </button>
          <button className="btn btn-ghost" type="button" onClick={download}>
            Download JSON
          </button>
          <Link className="btn btn-primary" href="/new">
            New plan
          </Link>
        </div>
      </div>
      <ul className="meta">
        <li>{when ? formatLong(when) : plan.brief.date}</li>
        <li>{plan.brief.city}</li>
        <li>{plan.brief.guests} guests</li>
        <li>{formatMoney(plan.budget.total, plan.budget.currency)}</li>
        <li>Wording: {SOURCE_LABEL[plan.source]}</li>
      </ul>
      <p className="sr-only" role="status">
        {status}
      </p>
      {plan.notice ? <p className="notice">{plan.notice}</p> : null}
      {storedSample ? (
        <p className="notice no-print">
          This sample has edits saved in this browser.{" "}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              deletePlan(id);
              const fresh = buildSample(id, new Date());
              if (fresh) setPlan(fresh);
              setStoredSample(false);
              setStatus("Sample reset.");
            }}
          >
            Reset sample
          </button>
        </p>
      ) : null}
      <div className="tabs no-print" role="tablist" aria-label="Plan sections" onKeyDown={onTabKey}>
        {TABS.map((item) => (
          <button
            key={item.id}
            id={`tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="panel" id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" hidden={tab !== "overview"}>
        <Overview plan={plan} />
      </div>
      <div className="panel" id="panel-budget" role="tabpanel" aria-labelledby="tab-budget" hidden={tab !== "budget"}>
        <BudgetBoard key={plan.id} plan={plan} onChange={commit} />
      </div>
      <div className="panel" id="panel-timeline" role="tabpanel" aria-labelledby="tab-timeline" hidden={tab !== "timeline"}>
        <TimelineRail plan={plan} />
      </div>
      <div className="panel" id="panel-vendors" role="tabpanel" aria-labelledby="tab-vendors" hidden={tab !== "vendors"}>
        <VendorList plan={plan} onChange={commit} />
      </div>
      <div className="panel" id="panel-ideas" role="tabpanel" aria-labelledby="tab-ideas" hidden={tab !== "ideas"}>
        <IdeaSpread plan={plan} />
      </div>
    </section>
  );
}
