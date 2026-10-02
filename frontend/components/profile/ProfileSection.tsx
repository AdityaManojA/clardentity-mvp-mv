import type { ReactNode } from "react";
import { cx } from "@/components/ui/primitives";

/** One band of the profile page, the way the design builds it: a 28px
 *  heading over a 20px line, whatever control belongs to the band on the
 *  right of that row, the band's own content underneath, and a hairline
 *  closing it off. No cards - the rule is the only separation on this page. */
export function ProfileSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("border-b border-hairline py-9", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* flex-1 as well as min-w-0: without it the description sets this
            block's intrinsic width, which is wide enough to push the button
            onto its own line on every screen. */}
        <div className="min-w-0 flex-1">
          <h2 className="text-[28px] font-medium leading-[normal] text-ink">{title}</h2>
          <p className="text-[20px] leading-[normal] text-ink-secondary">{description}</p>
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      {children && <div className="mt-9">{children}</div>}
    </section>
  );
}

/** The design's one button shape outside the brand pills: 42px tall, a
 *  hairline, no fill. Used for Rebuild, Add Aspect and Delete Account, which
 *  is the only one that wears the warning colour. */
export function OutlineButton({
  children,
  onClick,
  disabled,
  danger,
  autoFocus,
  onBlur,
  title,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  autoFocus?: boolean;
  onBlur?: () => void;
  title?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      autoFocus={autoFocus}
      onBlur={onBlur}
      title={title}
      aria-label={ariaLabel}
      className={cx(
        "flex h-[42px] shrink-0 items-center gap-2 rounded-[34px] border px-[21px] text-[20px] leading-[normal] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        danger
          ? "border-band-low-border text-band-low hover:bg-band-low-bg"
          : "border-hairline-strong text-ink hover:bg-surface-hover",
      )}
    >
      {children}
    </button>
  );
}
