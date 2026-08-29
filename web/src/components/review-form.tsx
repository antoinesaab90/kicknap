"use client";

import { useState } from "react";

interface ReviewLabels {
  ratingLabel: string;
  commentPlaceholder: string;
  submit: string;
  thanks: string;
  notBooked: string;
  failed: string;
}

interface ReviewFormProps {
  spaceId: number;
  labels: ReviewLabels;
}

export function ReviewForm({ spaceId, labels }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error" | "notbooked">("idle");

  async function submit() {
    if (rating === 0) return;
    setState("sending");
    try {
      const res = await fetch(`/api/spaces/${spaceId}/reviews`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      if (res.status === 201) setState("done");
      else if (res.status === 403) setState("notbooked");
      else setState("error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return <p className="text-sm font-medium text-emerald-700">{labels.thanks}</p>;
  }

  return (
    <div>
      <p className="text-sm font-medium text-navy-800">{labels.ratingLabel}</p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value} star`}
            className={`text-2xl transition-colors ${
              value <= rating ? "text-gold-600" : "text-navy-200 hover:text-gold-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={labels.commentPlaceholder}
        maxLength={2000}
        rows={3}
        className="mt-3 w-full rounded-2xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-navy-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={submit}
        disabled={rating === 0 || state === "sending"}
        className="mt-3 rounded-full bg-navy-800 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-40"
      >
        {labels.submit}
      </button>
      {state === "error" && (
        <p className="mt-2 text-sm font-medium text-rose-600">{labels.failed}</p>
      )}
      {state === "notbooked" && (
        <p className="mt-2 text-sm font-medium text-rose-600">{labels.notBooked}</p>
      )}
    </div>
  );
}