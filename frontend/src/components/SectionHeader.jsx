export default function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-traveloop-clay">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-2xl font-semibold text-traveloop-midnight sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-traveloop-midnight/70">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
