import type { Plan } from "@/lib/types";

export function IdeaSpread({ plan }: { plan: Plan }) {
  const blocks: Array<{ title: string; items: string[] }> = [
    { title: "Décor", items: plan.ideas.decor },
    { title: "Menu", items: plan.ideas.menu },
    { title: "The day", items: plan.ideas.activities },
    { title: "Moments to protect", items: plan.ideas.moments },
    { title: "Care", items: plan.ideas.care },
  ];
  return (
    <div>
      <h2>Ideas</h2>
      <p className="kicker">{plan.ideas.theme}</p>
      <p>{plan.invitationLine}</p>
      <ul className="palette">
        {plan.ideas.palette.map((swatch) => (
          <li key={swatch.name}>
            <span className="swatch" style={{ background: swatch.hex }} aria-hidden="true" />
            <span>
              {swatch.name} <span className="sr-only">{swatch.hex}</span>
            </span>
          </li>
        ))}
      </ul>
      <p>
        <strong>Music. </strong>
        {plan.ideas.music}
      </p>
      <div className="idea-grid">
        {blocks.map((block) => (
          <article key={block.title}>
            <h3>{block.title}</h3>
            <ul>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
