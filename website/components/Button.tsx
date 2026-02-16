import Image from "next/image";
import Link from "next/link";
import arrowRightIcon from "@/veiligheid/arrow-right.svg";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = {
  label: string;
  destination: string;
  variant?: ButtonVariant;
  className?: string;
  showArrow?: boolean;
  openInNewTab?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-2 border-[#BD0265] bg-[#BD0265] text-white hover:border-[#A00256] hover:bg-[#A00256]",
  secondary:
    "border border-[#BD0265] bg-white text-[#BD0265] hover:bg-[#FBE8F1]",
};

export default function Button({
  label,
  destination,
  variant = "primary",
  className,
  showArrow = false,
  openInNewTab = false,
}: ButtonProps) {
  return (
    <>
      {/* Button */}
      <Link
        href={destination}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${variantClasses[variant]} ${className ?? ""}`}
      >
        <span>{label}</span>
        {showArrow ? (
          <Image
            src={arrowRightIcon}
            alt=""
            width={20}
            height={20}
          />
        ) : null}
      </Link>
    </>
  );
}
