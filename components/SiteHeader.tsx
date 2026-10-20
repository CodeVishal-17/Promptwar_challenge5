import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap bar">
        <Link className="wordmark" href="/">
          {BRAND.name}
        </Link>
        <nav aria-label="Primary">
          <Link href="/new">New plan</Link>
          <Link href="/saved">Saved</Link>
          <Link href="/plan/sample-wedding">Sample</Link>
        </nav>
      </div>
    </header>
  );
}
