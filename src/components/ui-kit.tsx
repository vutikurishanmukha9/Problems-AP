import { cva, type VariantProps } from "class-variance-authority";
import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-[0.9375rem] font-medium transition-colors select-none disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-accent-hover active:bg-accent-hover",
        secondary:
          "bg-surface text-ink border border-line-strong hover:bg-surface-2 active:bg-surface-2",
        quiet: "text-ink-2 hover:text-ink hover:bg-surface-2",
      },
      size: {
        md: "h-11 px-4",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-5",
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
  return (
    <button className={cn(buttonStyles({ variant, size }), className)} {...props} />
  );
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
    <section className={cn("py-14 sm:py-20", className)}>
      <div className="container-ap">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <h2 className="text-[1.375rem] font-semibold sm:text-2xl">{title}</h2>
            {description && (
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border border-line bg-surface", className)}
      {...props}
    />
  );
}
