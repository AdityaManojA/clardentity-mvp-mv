import Link from "next/link";
import { MaskIcon } from "@/components/ui/MaskIcon";
import { cx } from "@/components/ui/primitives";

/** The name with its mark, for the pages outside the app shell: sign in, sign
 *  up, the password flows, the welcome questions, the legal pages.
 *
 *  Those all showed the word on its own, which is the one place the product
 *  introduces itself to someone who has not seen it before - and introduced
 *  itself without its face. The mark is painted from the accent, so it is the
 *  same mark the sidebar and the marketing page draw. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cx(
        "inline-flex items-center gap-[3.7px] text-[18.563px] text-ink",
        className,
      )}
    >
      <MaskIcon
        src="/ui/logo-dots.svg"
        className="h-[22.275px] w-[23.029px] text-brand"
      />
      Clardentity
    </Link>
  );
}
