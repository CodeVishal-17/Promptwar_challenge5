"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import { DIET_LABEL, EVENT_BLURB, EVENT_LABEL, PRIORITY_LABEL, SETTING_LABEL, SOURCE_LABEL, VIBE_LABEL } from "@/lib/labels";
import { sampleBriefs } from "@/lib/sample-briefs";
import { readBrief } from "@/lib/schema";
import { savePlan } from "@/lib/storage";
import {
  CURRENCIES,
  DIETS,
  EVENT_TYPES,
  PRIORITIES,
  SETTINGS,
  VIBES,
  type Brief,
  type Currency,
  type Diet,
  type EventType,
  type FieldError,
  type Plan,
  type Priority,
  type Setting,
  type Source,
  type Vibe,
} from "@/lib/types";

const SUGGESTED: Record<EventType, Vibe> = {
  wedding: "intimate",
  birthday: "playful",
  community: "eco",
};

type Draft = {
  eventType: EventType;
  title: string;
  honoree: string;
  date: string;
  city: string;
  guests: string;
  setting: Setting;
  vibe: Vibe;
  culture: string;
  dietary: Diet[];
  budget: string;
  currency: Currency;
  priorities: Priority[];
  mustHaves: string;
  constraints: string;
  age: string;
};

function emptyDraft(eventType: EventType): Draft {
  return {
    eventType,
    title: "",
    honoree: "",
    date: "",
    city: "",
    guests: "",
    setting: "mixed",
    vibe: SUGGESTED[eventType],
    culture: "",
    dietary: [],
    budget: "",
    currency: "INR",
    priorities: ["food"],
    mustHaves: "",
    constraints: "",
    age: "",
  };
}

function fromBrief(brief: Brief): Draft {
  return {
    ...brief,
    guests: String(brief.guests),
    budget: String(brief.budget),
    age: brief.age ? String(brief.age) : "",
    culture: brief.culture,
    mustHaves: brief.mustHaves,
    constraints: brief.constraints,
  };
}

export function BriefForm({ initialType }: { initialType: EventType }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(initialType));
  const [vibeTouched, setVibeTouched] = useState(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [engine, setEngine] = useState<Source | "">("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/health", { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: { ai?: Source }) => {
        if (payload.ai) setEngine(payload.ai);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function changeType(eventType: EventType) {
    setDraft((current) => ({
      ...current,
      eventType,
      vibe: vibeTouched ? current.vibe : SUGGESTED[eventType],
    }));
  }

  function toggleDiet(diet: Diet) {
    setDraft((current) => ({
      ...current,
      dietary: current.dietary.includes(diet) ? current.dietary.filter((item) => item !== diet) : [...current.dietary, diet],
    }));
  }

  function togglePriority(priority: Priority) {
    setDraft((current) => {
      if (current.priorities.includes(priority)) {
        return { ...current, priorities: current.priorities.filter((item) => item !== priority) };
      }
      if (current.priorities.length >= 2) return current;
      return { ...current, priorities: [...current.priorities, priority] };
    });
  }

  function errorFor(field: string): string | undefined {
    return errors.find((error) => error.field === field)?.message;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const payload = {
      ...draft,
      guests: draft.guests,
      budget: draft.budget,
      age: draft.eventType === "birthday" && draft.age ? Number(draft.age) : undefined,
    };
    const read = readBrief(payload);
    if (!read.ok) {
      setErrors(read.errors);
      queueMicrotask(() => document.getElementById("form-errors")?.focus());
      return;
    }
    setErrors([]);
    setPending(true);
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(read.brief),
      });
      const body = (await response.json()) as { plan?: Plan; errors?: FieldError[]; error?: string };
      if (!response.ok || !body.plan) {
        if (body.errors) {
          setErrors(body.errors);
          queueMicrotask(() => document.getElementById("form-errors")?.focus());
        } else {
          setFormError(body.error || `${BRAND.name} could not compose a plan. Try again in a moment.`);
        }
        return;
      }
      savePlan(body.plan);
      router.push(`/plan/${body.plan.id}`);
    } catch {
      setFormError(`${BRAND.name} could not be reached. Check your connection and try again.`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="wrap page">
      <div className="page-intro">
        <p className="eyebrow">New plan</p>
        <h1>Tell {BRAND.name} who is gathering.</h1>
        <p className="lede">
          A name, a date, a city, a guest count, and a budget are enough. The rest makes the ideas more particular.
        </p>
        {engine ? (
          <p className="hint">
            Wording: {SOURCE_LABEL[engine]}. The budget, dates, and checklist are calculated here.
          </p>
        ) : null}
      </div>

      <div className="sample-row">
        <span className="hint">Or start from a filled brief:</span>
        {Object.entries(sampleBriefs).map(([id, brief]) => (
          <button key={id} type="button" className="btn btn-ghost" onClick={() => setDraft(fromBrief(brief))}>
            {brief.title}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate>
        {errors.length > 0 ? (
          <div id="form-errors" className="banner" role="alert" tabIndex={-1}>
            <strong>Fix the fields below before composing the plan.</strong>
            <ul>
              {errors.map((error) => (
                <li key={error.field}>
                  <a href={`#field-${error.field.split(".")[0]}`}>{error.message}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {formError ? (
          <div className="banner" role="alert">
            {formError}
          </div>
        ) : null}

        <fieldset className="form-section">
          <legend>The occasion</legend>
          <div className="choice-grid" role="radiogroup" aria-label="Event type">
            {EVENT_TYPES.map((type) => (
              <label key={type} className="choice">
                <input
                  type="radio"
                  name="eventType"
                  value={type}
                  checked={draft.eventType === type}
                  onChange={() => changeType(type)}
                />
                <span>
                  {EVENT_LABEL[type]}
                  <small>{EVENT_BLURB[type]}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>People and place</legend>
          <div className="form-grid">
            <label className="field" htmlFor="field-title">
              Event name
              <input id="field-title" value={draft.title} maxLength={80} onChange={(event) => update("title", event.target.value)} required />
              {errorFor("title") ? <span className="field-error">{errorFor("title")}</span> : <span className="hint">Asha & Rohan, Maya turns 8, Riverside reading festival.</span>}
            </label>
            <label className="field" htmlFor="field-honoree">
              Who it is for
              <input id="field-honoree" value={draft.honoree} maxLength={80} onChange={(event) => update("honoree", event.target.value)} required />
              {errorFor("honoree") ? <span className="field-error">{errorFor("honoree")}</span> : null}
            </label>
            <label className="field" htmlFor="field-date">
              Date
              <input id="field-date" type="date" value={draft.date} onChange={(event) => update("date", event.target.value)} required />
              {errorFor("date") ? <span className="field-error">{errorFor("date")}</span> : <span className="hint">Today or later, within three years.</span>}
            </label>
            <label className="field" htmlFor="field-city">
              City
              <input id="field-city" value={draft.city} maxLength={80} onChange={(event) => update("city", event.target.value)} required />
              {errorFor("city") ? <span className="field-error">{errorFor("city")}</span> : null}
            </label>
            <label className="field" htmlFor="field-guests">
              Guests
              <input id="field-guests" inputMode="numeric" value={draft.guests} onChange={(event) => update("guests", event.target.value)} required />
              {errorFor("guests") ? <span className="field-error">{errorFor("guests")}</span> : null}
            </label>
            {draft.eventType === "birthday" ? (
              <label className="field" htmlFor="field-age">
                Age
                <input id="field-age" inputMode="numeric" value={draft.age} onChange={(event) => update("age", event.target.value)} />
                {errorFor("age") ? <span className="field-error">{errorFor("age")}</span> : <span className="hint">Used to scale games, music, and the length of the party.</span>}
              </label>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>The feeling</legend>
          <div className="choice-grid" style={{ marginBottom: "0.8rem" }}>
            {SETTINGS.map((setting) => (
              <label key={setting} className="choice">
                <input type="radio" name="setting" checked={draft.setting === setting} onChange={() => update("setting", setting)} />
                <span>{SETTING_LABEL[setting]}</span>
              </label>
            ))}
          </div>
          <div className="choice-grid compact">
            {VIBES.map((vibe) => (
              <label key={vibe} className="choice">
                <input
                  type="radio"
                  name="vibe"
                  checked={draft.vibe === vibe}
                  onChange={() => {
                    setVibeTouched(true);
                    update("vibe", vibe);
                  }}
                />
                <span>{VIBE_LABEL[vibe]}</span>
              </label>
            ))}
          </div>
          <div className="form-grid" style={{ marginTop: "0.9rem" }}>
            <label className="field span-2" htmlFor="field-culture">
              Ceremony, language, or tradition to leave room for
              <input id="field-culture" value={draft.culture} maxLength={240} onChange={(event) => update("culture", event.target.value)} />
              <span className="hint">Optional. Example: a quiet morning ceremony, a nikah before the reception.</span>
            </label>
          </div>
          <p id="diet-hint" className="hint">Dietary needs. Leave these clear if the table is open.</p>
          <div className="choice-grid compact" role="group" aria-describedby="diet-hint">
            {DIETS.map((diet) => (
              <label key={diet} className="choice">
                <input type="checkbox" checked={draft.dietary.includes(diet)} onChange={() => toggleDiet(diet)} />
                <span>{DIET_LABEL[diet]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>The money</legend>
          <div className="form-grid">
            <label className="field" htmlFor="field-budget">
              Working budget
              <input id="field-budget" inputMode="numeric" value={draft.budget} onChange={(event) => update("budget", event.target.value)} required />
              {errorFor("budget") ? <span className="field-error">{errorFor("budget")}</span> : <span className="hint">A whole number. INR plans start at 5,000.</span>}
            </label>
            <label className="field" htmlFor="field-currency">
              Currency
              <select id="field-currency" value={draft.currency} onChange={(event) => update("currency", event.target.value as Currency)}>
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p id="priority-hint" className="hint">Choose one or two places the money should lean.</p>
          {errorFor("priorities") ? <p className="field-error">{errorFor("priorities")}</p> : null}
          <div className="choice-grid" role="group" aria-describedby="priority-hint">
            {PRIORITIES.map((priority) => {
              const checked = draft.priorities.includes(priority);
              return (
                <label key={priority} className="choice">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!checked && draft.priorities.length >= 2}
                    onChange={() => togglePriority(priority)}
                  />
                  <span>{PRIORITY_LABEL[priority]}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Notes</legend>
          <div className="form-grid">
            <label className="field" htmlFor="field-mustHaves">
              Do not lose this
              <textarea id="field-mustHaves" maxLength={400} value={draft.mustHaves} onChange={(event) => update("mustHaves", event.target.value)} />
            </label>
            <label className="field" htmlFor="field-constraints">
              Limits
              <textarea id="field-constraints" maxLength={400} value={draft.constraints} onChange={(event) => update("constraints", event.target.value)} />
              <span className="hint">End time, no alcohol, step-free access, a sound curfew.</span>
            </label>
          </div>
        </fieldset>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Composing the plan…" : "Compose the plan"}
          </button>
          <span className="hint" role="status">
            {pending ? "Checking the brief and writing the plan." : "You can edit the numbers after the plan opens."}
          </span>
        </div>
      </form>
    </div>
  );
}
