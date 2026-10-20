import { BRAND } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-bar">
        <p>
          Plans stay in this browser. Totals, dates, and the vendor checklist are calculated here. A model may write the
          wording when an API key is set; otherwise the {BRAND.writer} does.
        </p>
        <p>{BRAND.name}</p>
      </div>
    </footer>
  );
}
