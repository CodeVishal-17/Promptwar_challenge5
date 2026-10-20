"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import { formatLong, parseISODate } from "@/lib/dates";
import { EVENT_LABEL } from "@/lib/labels";
import { deletePlan, loadPlans } from "@/lib/storage";
import type { Plan } from "@/lib/types";

export default function SavedPage() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    setPlans(loadPlans());
  }, []);

  if (!plans) {
    return (
      <section className="wrap page">
        <h1>Saved plans</h1>
        <p>Looking in this browser…</p>
      </section>
    );
  }

  return (
    <section className="wrap page">
      <div className="page-intro">
        <p className="eyebrow">On this device</p>
        <h1>Saved plans</h1>
        <p className="lede">{BRAND.name} keeps plans in this browser. Clearing site data removes them.</p>
      </div>
      {plans.length === 0 ? (
        <div className="empty">
          <p>Nothing saved yet.</p>
          <Link className="btn btn-primary" href="/new">
            Compose a plan
          </Link>
        </div>
      ) : (
        <ul className="saved-list">
          {plans.map((plan) => {
            const date = parseISODate(plan.brief.date);
            return (
              <li key={plan.id}>
                <div>
                  <Link href={`/plan/${plan.id}`}>{plan.brief.title}</Link>
                  <p>
                    {EVENT_LABEL[plan.brief.eventType]} · {plan.brief.city} · {date ? formatLong(date) : plan.brief.date}
                  </p>
                </div>
                {pendingId === plan.id ? (
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => {
                      deletePlan(plan.id);
                      setPlans(loadPlans());
                      setPendingId(null);
                    }}
                  >
                    Confirm remove
                  </button>
                ) : (
                  <button className="btn btn-ghost" type="button" onClick={() => setPendingId(plan.id)}>
                    Remove
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
