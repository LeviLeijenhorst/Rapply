import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import checkmarkCircleIcon from "@/home/checkmark-circle.svg";

const freePlanFeatures = [
  "Alle functies",
  "Een account op proef",
  "Geen creditcard nodig",
];

const paidPlanFeatures = [
  "Volledige toegang",
  "Onbeperkt aantal sessies",
  "Ondersteuning per mail",
];

export default function PricingSection() {
  return (
    <SectionContainer className="bg-[#B90061]">
      {/* Pricing content */}
      <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        {/* Pricing intro */}
        <div className="flex w-full flex-col gap-4 text-white lg:max-w-md">
          {/* Pricing title */}
          <h3 className="text-3xl font-semibold md:text-4xl">
            Een plan dat bij jou past
          </h3>
          {/* Pricing description */}
          <p className="text-base font-normal text-white/90">
            We bieden eenvoudige keuzes zodat jij direct kunt starten. Kies een
            plan dat past bij jouw behoeften.
          </p>
        </div>
        {/* Pricing cards */}
        <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-stretch">
          {/* Free plan */}
          <div className="flex h-full w-full flex-col gap-6 rounded-2xl bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.12)] lg:min-h-[320px] lg:w-72">
            {/* Free plan title */}
            <h4 className="text-xl font-semibold text-black">Begin gratis</h4>
            {/* Free plan list */}
            <div className="flex w-full flex-col gap-3">
              {freePlanFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  {/* Feature icon */}
                  <Image
                    src={checkmarkCircleIcon}
                    alt=""
                    width={18}
                    height={18}
                  />
                  {/* Feature label */}
                  <span className="text-sm font-normal text-black/70">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
            {/* Free plan action */}
            <div className="mt-auto flex w-full">
              <Button
                label="Probeer Gratis"
                destination="https://app.coachscribe.nl"
                variant="primary"
                showArrow
                className="font-normal"
              />
            </div>
          </div>
          {/* Paid plan */}
          <div className="flex h-full w-full flex-col gap-6 rounded-2xl bg-white p-6 shadow-[0_8px_20px_rgba(15,23,42,0.12)] lg:min-h-[320px] lg:w-72">
            {/* Paid plan title */}
            <div className="flex w-full flex-col gap-2">
              {/* Paid plan header */}
              <h4 className="text-xl font-semibold text-black">Premium plan</h4>
            </div>
            {/* Paid plan list */}
            <div className="flex w-full flex-col gap-3">
              {paidPlanFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  {/* Feature icon */}
                  <Image
                    src={checkmarkCircleIcon}
                    alt=""
                    width={18}
                    height={18}
                  />
                  {/* Feature label */}
                  <span className="text-sm font-normal text-black/70">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
            {/* Paid plan action */}
            <div className="mt-auto flex w-full">
              <Button
                label="Neem contact op"
                destination="mailto:contact@coachscribe.nl"
                variant="secondary"
                className="font-normal"
              />
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
