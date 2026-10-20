import { formatLong, parseISODate } from "@/lib/dates";
import type { Plan } from "@/lib/types";

export function TimelineRail({ plan }: { plan: Plan }) {
  return (
    <div>
      <h2>Timeline</h2>
      <p>
        {plan.timeline.rush
          ? "The event is soon, so earlier milestones are folded into this week."
          : `${plan.timeline.daysUntil} days out. Dates are counted back from ${plan.brief.date}.`}
      </p>
      <ol className="rail">
        {plan.timeline.milestones.map((milestone) => {
          const date = parseISODate(milestone.date);
          return (
            <li className="mile" key={milestone.id}>
              <div>
                <p className="kicker">{milestone.phase}</p>
                <time dateTime={milestone.date}>{date ? formatLong(date) : milestone.date}</time>
              </div>
              <div>
                <h3>{milestone.title}</h3>
                <p>{milestone.detail}</p>
                <ul>
                  {milestone.tasks.map((task) => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
