import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import checkmarkCircleIcon from "@/home/checkmark-circle.svg";

const freePlanFeatures = [
  "Alle functies",
  "90 transcriptie minuten",
  "Geen creditcard nodig",
];

const paidPlanFeatures = [
  "Volledige toegang",
  "Onbeperkt aantal sessies",
  "Ondersteuning per mail",
];

export default function PricingSection() {
  return (
    <SectionContainer className="bg-[#B90061]" contentClassName="md:py-[80px]">
      {/* Pricing content */}
      <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        {/* Pricing intro */}
        <div className="flex w-full flex-col gap-4 text-white lg:max-w-md lg:self-center">
          {/* Pricing title */}
          <h3 className="font-[var(--font-catamaran)] text-[64px] font-medium leading-[120%] text-white">
            Een plan
            <br />
            dat bij jou past
          </h3>
          {/* Pricing description */}
          <p className="text-[16px] font-medium text-white/90">
            We houden rekening met coaches en praktijken van alle formaten. Kijk
            rustig even rond, we hebben vast een plan
            <br />
            dat perfect aansluit op jouw behoeften!
          </p>
        </div>
        {/* Pricing cards */}
        <div className="flex w-full flex-col gap-10 lg:flex-row lg:items-stretch">
          {/* Free plan */}
          <div className="flex h-full w-full flex-col gap-0 rounded-2xl bg-white px-8 py-8 shadow-[0_8px_20px_rgba(15,23,42,0.12)] lg:min-h-[336px] lg:w-[288px]">
            {/* Free plan title */}
            <h4 className="font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-black">
              Begin gratis
            </h4>
            <p className="mt-4 text-[16px] font-medium text-black/70">
              Krijg toegang tot:
            </p>
            {/* Free plan list */}
            <div className="mt-3 flex w-full flex-col gap-3">
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
                  <span className="text-[16px] font-medium text-black/70">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
            {/* Free plan action */}
            <div className="mt-3 flex w-full justify-center lg:mt-auto">
              <Button
                label="Wachtlijst"
                destination="/wachtlijst"
                variant="primary"
                showArrow
                className="font-normal"
              />
            </div>
          </div>
          {/* Paid plan */}
          <div className="flex h-full w-full flex-col gap-0 rounded-2xl bg-white px-8 py-8 shadow-[0_8px_20px_rgba(15,23,42,0.12)] lg:min-h-[336px] lg:w-[288px]">
            {/* Paid plan title */}
            <div className="flex w-full flex-col gap-0">
              {/* Paid plan header */}
              <h4 className="font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-black">
                Premium
              </h4>
              <p className="mt-4 text-[16px] font-medium text-black/70">
                Krijg toegang tot:
              </p>
            </div>
            {/* Paid plan list */}
            <div className="mt-3 flex w-full flex-col gap-3">
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
                  <span className="text-[16px] font-medium text-black/70">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
            {/* Paid plan action */}
            <div className="mt-3 flex w-full justify-center lg:mt-auto">
              <Button
                label="Neem contact op"
                destination="/contact"
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
