const SWATCHES = ["#7a2f3b", "#e39a2b", "#2f5d4a", "#355c6b", "#c46b4a", "#1a1612", "#8a7a68", "#d7b4a8"];

export function categoryColor(index: number): string {
  return SWATCHES[index % SWATCHES.length];
}

export function BudgetBar({
  categories,
}: {
  categories: Array<{ id: string; share: number }>;
}) {
  return (
    <div className="stack" aria-hidden="true">
      {categories.map((category, index) => (
        <span
          key={category.id}
          style={{ flex: `${Math.max(Math.round(category.share * 1000), 1)} 1 0`, background: categoryColor(index) }}
        />
      ))}
    </div>
  );
}
