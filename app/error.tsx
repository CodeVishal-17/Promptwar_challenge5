"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="wrap page empty">
      <h1>Something went wrong.</h1>
      <p>The studio hit an unexpected error. You can try again.</p>
      <button className="btn btn-primary" type="button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
