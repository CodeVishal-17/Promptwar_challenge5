"use client";

import { formatLong, parseISODate } from "@/lib/dates";
import { STATUS_LABEL } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import { VENDOR_STATUSES, type Plan, type VendorStatus } from "@/lib/types";

export function VendorList({ plan, onChange }: { plan: Plan; onChange: (plan: Plan, message: string) => void }) {
  function setStatus(id: string, status: VendorStatus) {
    const vendor = plan.vendors.find((item) => item.id === id);
    const next = {
      ...plan,
      vendors: plan.vendors.map((item) => (item.id === id ? { ...item, status } : item)),
    };
    onChange(next, `${vendor?.role ?? "Vendor"} marked ${STATUS_LABEL[status].toLowerCase()}.`);
  }

  return (
    <div>
      <h2>Vendors</h2>
      <p>These are roles, not businesses. The estimate is that role&apos;s share of the budget.</p>
      <div className="idea-grid">
        {plan.vendors.map((vendor) => {
          const book = parseISODate(vendor.bookBy);
          return (
            <article className="vendor" key={vendor.id}>
              <div className="vendor-top">
                <div>
                  <p className="kicker">{vendor.category}</p>
                  <h3>{vendor.role}</h3>
                </div>
                <label>
                  <span className="sr-only">Status for {vendor.role}</span>
                  <select value={vendor.status} onChange={(event) => setStatus(vendor.id, event.target.value as VendorStatus)}>
                    {VENDOR_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p>{vendor.brief}</p>
              <p>
                {formatMoney(vendor.estimate, plan.brief.currency)} · book by{" "}
                <time dateTime={vendor.bookBy}>{book ? formatLong(book) : vendor.bookBy}</time>
                {vendor.urgent ? <span className="urgent"> · book now</span> : null}
              </p>
              <ul>
                {vendor.questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
