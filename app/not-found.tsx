import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap page empty">
      <h1>That page is not in the studio.</h1>
      <p>The plan you want may still be saved in this browser.</p>
      <div className="actions">
        <Link className="btn btn-primary" href="/">
          Home
        </Link>
        <Link className="btn btn-ghost" href="/saved">
          Saved plans
        </Link>
      </div>
    </section>
  );
}
