import Image from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import phoneAndLaptopImage from "@/home/phone-and-laptop.png";

export default function AvailabilitySection() {
  return (
    <SectionContainer className="bg-white">
      {/* Availability content */}
      <div className="flex w-full flex-col items-center gap-6 rounded-3xl bg-[#C7B6FF] p-6 md:flex-row md:items-center md:justify-between">
        {/* Availability media */}
        <div className="flex w-full items-center justify-center md:w-1/2">
          {/* Availability image */}
          <Image
            src={phoneAndLaptopImage}
            alt="CoachScribe on mobile and desktop"
            className="h-auto w-full max-w-md object-contain"
          />
        </div>
        {/* Availability text */}
        <div className="flex w-full flex-col items-center gap-6 text-center md:w-1/2 md:items-start md:text-left">
          {/* Availability title */}
          <h3 className="text-2xl font-semibold text-white md:text-3xl">
            Binnenkort ook op Android en iOS
          </h3>
          {/* Availability description */}
          <p className="text-base font-normal text-white/90">
            Gebruik CoachScribe op je laptop, tablet of telefoon. Alles blijft
            gesynchroniseerd.
          </p>
        </div>
      </div>
    </SectionContainer>
  );
}
