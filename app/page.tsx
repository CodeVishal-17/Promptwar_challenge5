import Link from "next/link";
import { BudgetBar } from "@/components/BudgetBar";
import { BRAND } from "@/lib/brand";
import { EVENT_BLURB, EVENT_LABEL } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import { buildSample } from "@/lib/samples";
import { EVENT_TYPES } from "@/lib/types";

const previewNow = new Date(2026, 9, 20);

export default function HomePage() {
  const preview = buildSample("sample-wedding", previewNow);
  if (!preview) return null;
  const food = preview.budget.categories.find((category) => category.id === "food");

  return (
    <>
      <section className="wrap hero">
        <div>
          <p className="eyebrow">Celebration atelier</p>
          <h1>A plan for the wedding, the birthday, and the block party.</h1>
          <p className="lede">
            {BRAND.name} turns a few honest details into a budget that adds up, a timeline you can run, a vendor checklist,
            and ideas written for the people you actually invited.
          </p>
          <div className="actions">
            <Link className="btn btn-primary" href="/new">
              Compose a plan
            </Link>
            <Link className="btn btn-ghost" href="/plan/sample-wedding">
              Open the Udaipur wedding
            </Link>
          </div>
        </div>
        <article className="invite">
          <p className="eyebrow">Working sample</p>
          <h2>{preview.brief.title}</h2>
          <p>{preview.invitationLine}</p>
          <div className="invite-meta">
            <p>
              <span>When</span>
              {preview.brief.date}
            </p>
            <p>
              <span>Where</span>
              {preview.brief.city}
            </p>
            <p>
              <span>Budget</span>
              {formatMoney(preview.budget.total, preview.budget.currency)}
            </p>
          </div>
          <BudgetBar categories={preview.budget.categories} />
          <p className="invite-note">
            {food ? `${formatMoney(food.amount, preview.budget.currency)} set aside for food. ` : ""}
            <Link href="/plan/sample-wedding">Read the full plan</Link>
          </p>
        </article>
      </section>

      <section className="wrap band" aria-labelledby="kinds">
        <div className="section-head">
          <h2 id="kinds">Three kinds of gathering</h2>
        </div>
        <div className="event-grid">
          {EVENT_TYPES.map((type) => (
            <Link key={type} className="event-card" href={`/new?type=${type}`}>
              <div>
                <p className="kicker">Start here</p>
                <strong>{EVENT_LABEL[type]}</strong>
                <p>{EVENT_BLURB[type]}</p>
              </div>
              <span className="text-link">Compose this plan</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap band" aria-labelledby="leave">
        <h2 id="leave">What you walk away with</h2>
        <div className="deliver-grid">
          <article>
            <h3>A budget</h3>
            <p>Categories that sum to the number you named, with more weight on the two things you care about.</p>
          </article>
          <article>
            <h3>A timeline</h3>
            <p>Dates counted back from the event. If the day is close, the plan compresses instead of pretending you have a year.</p>
          </article>
          <article>
            <h3>A vendor checklist</h3>
            <p>Roles, the question to ask, a booking date, and a place to mark shortlisted, booked, or paid.</p>
          </article>
          <article>
            <h3>Ideas with a point of view</h3>
            <p>A theme, a palette, a menu that respects the dietary rules, and care notes for the people in the room.</p>
          </article>
        </div>
      </section>

      <section className="wrap band studio-notes" aria-labelledby="notes">
        <div>
          <h2 id="notes">How a plan is made</h2>
          <ol>
            <li>You describe the people, the place, the date, and the money.</li>
            <li>{BRAND.name} calculates the split, the dates, and the checklist.</li>
            <li>Gemini or OpenAI may write the invitation, menu, and care notes. Without a key, the {BRAND.writer} writes them.</li>
          </ol>
        </div>
        <div className="note-card">
          <p className="kicker">From the sample</p>
          <h3>{preview.ideas.theme}</h3>
          <p>{preview.summary}</p>
          <p>
            <Link className="text-link" href="/plan/sample-birthday">
              Birthday sample
            </Link>
            {" · "}
            <Link className="text-link" href="/plan/sample-community">
              Community sample
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
