"use client";

interface CancelBookingButtonProps {
  bookingId: number;
  lang: string;
  label: string;
  confirmLabel: string;
}

export function CancelBookingButton({
  bookingId,
  lang,
  label,
  confirmLabel,
}: CancelBookingButtonProps) {
  return (
    <form
      action={`/api/bookings/${bookingId}/cancel`}
      method="POST"
      onSubmit={(e) => {
        if (!window.confirm(confirmLabel)) e.preventDefault();
      }}
    >
      <input type="hidden" name="lang" value={lang} />
      <button
        type="submit"
        className="mt-3 rounded-full border border-navy-200 px-4 py-1.5 text-xs font-semibold text-navy-600 transition-colors hover:border-rose-300 hover:text-rose-600"
      >
        {label}
      </button>
    </form>
  );
}