"use client";

import { usePathname } from "next/navigation";

type PageEnterTransitionProps = {
  children: React.ReactNode;
};

export default function PageEnterTransition({
  children,
}: PageEnterTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-enter-animation">
      {children}
    </div>
  );
}
