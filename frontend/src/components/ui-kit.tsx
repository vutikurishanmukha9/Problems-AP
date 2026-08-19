import { cva, type VariantProps } from "class-variance-authority";
import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white shadow-sm hover:bg-accent-hover hover:shadow active:scale-[0.99]",
        secondary:
          "bg-surface text-ink border border-line-strong shadow-xs hover:bg-surface-2 hover:border-ink/40 active:scale-[0.99]",
        quiet: "text-ink-2 hover:text-ink hover:bg-surface-2",
      },
      size: {
        md: "h-10 px-4 text-sm",
        sm: "h-8.5 px-3 text-xs sm:text-sm",
        lg: "h-11.5 px-5 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type BtnVariants = VariantProps<typeof buttonStyles>;

export function Button({
  className,
  variant,
  size,
  ...props
}: ComponentProps<"button"> & BtnVariants) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ComponentProps<typeof Link> & BtnVariants) {
  return <Link className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-7 sm:py-10", className)}>
      <div className="container-ap">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h2>
            {description && (
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-ink-2">{description}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border border-line bg-surface shadow-xs transition-shadow hover:shadow-sm", className)}
      {...props}
    />
  );
}
