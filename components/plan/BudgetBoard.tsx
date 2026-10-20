"use client";

import { useState } from "react";
import { BudgetBar, categoryColor } from "@/components/BudgetBar";
import { formatMoney, formatPercent } from "@/lib/money";
import { withAdjustments } from "@/lib/planner";
import type { Plan } from "@/lib/types";

export function BudgetBoard({ plan, onChange }: { plan: Plan; onChange: (plan: Plan, message: string) => void }) {
  const [budget, setBudget] = useState(String(plan.brief.budget));
  const [guests, setGuests] = useState(String(plan.brief.guests));
  const [error, setError] = useState("");

  function apply() {
    const nextBudget = Number(budget);
    const nextGuests = Number(guests);
    const minimum = plan.brief.currency === "INR" ? 5000 : 50;
    if (!Number.isInteger(nextBudget) || nextBudget < minimum || nextBudget > 100_000_000) {
      setError(plan.brief.currency === "INR" ? "Use a whole budget of at least ₹5,000." : "Use a whole budget of at least 50.");
      return;
    }
    if (!Number.isInteger(nextGuests) || nextGuests < 1 || nextGuests > 5000) {
      setError("Guest count needs to be a whole number from 1 to 5,000.");
      return;
    }
    setError("");
    onChange(withAdjustments(plan, { budget: nextBudget, guests: nextGuests }), "Budget and guest count updated.");
  }

  return (
    <div>
      <h2>Budget</h2>
      <p>
        {formatMoney(plan.budget.total, plan.budget.currency)} across {plan.budget.categories.length} categories. The rows
        below are a starting split, not a quote.
      </p>
      <BudgetBar categories={plan.budget.categories} />
      <div className="adjust">
        <label className="field" htmlFor="adjust-budget">
          Working budget
          <input id="adjust-budget" inputMode="numeric" value={budget} onChange={(event) => setBudget(event.target.value)} />
        </label>
        <label className="field" htmlFor="adjust-guests">
          Guests
          <input id="adjust-guests" inputMode="numeric" value={guests} onChange={(event) => setGuests(event.target.value)} />
        </label>
        <button className="btn btn-primary" type="button" onClick={apply}>
          Recalculate
        </button>
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        {plan.budget.categories.map((category, index) => (
          <article className="category" key={category.id}>
            <span className="swatch" style={{ background: categoryColor(index) }} aria-hidden="true" />
            <div>
              <h3>{category.label}</h3>
              <p>{category.note}</p>
            </div>
            <p className="amount">
              {formatMoney(category.amount, plan.budget.currency)}
              <small>{formatPercent(category.share)}</small>
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
