import { formatLong, parseISODate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Plan } from "@/lib/types";

export function Overview({ plan }: { plan: Plan }) {
  const next = plan.timeline.milestones[0];
  const openVendors = plan.vendors.filter((vendor) => vendor.status === "todo" || vendor.status === "shortlist").slice(0, 3);
  return (
    <div>
      <h2>Overview</h2>
      <p className="summary">{plan.summary}</p>
      <div className="stat-grid">
        <article className="stat">
          <span className="kicker">Per guest</span>
          <strong>{formatMoney(plan.budget.perGuest, plan.budget.currency)}</strong>
        </article>
        <article className="stat">
          <span className="kicker">Food per guest</span>
          <strong>{formatMoney(plan.budget.foodPerGuest, plan.budget.currency)}</strong>
        </article>
        <article className="stat">
          <span className="kicker">Days until</span>
          <strong>{plan.timeline.daysUntil}</strong>
        </article>
        <article className="stat">
          <span className="kicker">Theme</span>
          <strong>{plan.ideas.theme}</strong>
        </article>
      </div>
      {plan.timeline.rush ? (
        <p className="notice">This date is close, so the timeline is compressed to what you can still confirm.</p>
      ) : null}
      {next ? (
        <article className="note-card">
          <p className="kicker">Next</p>
          <h3>{next.title}</h3>
          <p>
            <time dateTime={next.date}>{formatLong(parseISODate(next.date) ?? new Date())}</time>
          </p>
          <ul>
            {next.tasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        </article>
      ) : null}
      {openVendors.length > 0 ? (
        <div style={{ marginTop: "1rem" }}>
          <h3>Still open</h3>
          <ul>
            {openVendors.map((vendor) => (
              <li key={vendor.id}>
                {vendor.role} — book by <time dateTime={vendor.bookBy}>{formatLong(parseISODate(vendor.bookBy) ?? new Date())}</time>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Every vendor on this list is booked or paid.</p>
      )}
    </div>
  );
}
