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
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#BD0265] text-white border-2 border-[#BD0265] hover:text-white hover:shadow-[inset_0_0_0_2px_#ffffff,inset_0_0_0_999px_#BD0265]",
  secondary:
    "bg-white text-[#BD0265] border border-[#BD0265] hover:text-white hover:shadow-[inset_0_0_0_2px_#ffffff,inset_0_0_0_999px_#BD0265]",
};

export default function Button({
  label,
  destination,
  variant = "primary",
  className,
  showArrow = false,
}: ButtonProps) {
  return (
    <>
      {/* Button */}
      <Link
        href={destination}
        className={`group inline-flex h-12 items-center justify-center gap-2 rounded-full p-3 text-base font-semibold transition-all ${variantClasses[variant]} ${className ?? ""}`}
      >
        <span>{label}</span>
        {showArrow ? (
          <Image
            src={arrowRightIcon}
            alt=""
            width={20}
            height={20}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        ) : null}
      </Link>
    </>
  );
}
