import SectionContainer from "@/components/home/SectionContainer";
import SectionHeading from "@/components/home/SectionHeading";

const testimonials = [
  {
    quote:
      "Het geeft een fijn rust gevoel omdat Rapply alle verslaglegging voor mij doet.",
    name: "Claudia Heringa",
    role: "Teamcoach",
  },
  {
    quote:
      "Het werkt snel en de verslagen zijn overzichtelijk. Mijn clienten zijn ook enthousiast.",
    name: "Christa van Lissum",
    role: "Loopbaancoach",
  },
  {
    quote:
      "Ik heb meer aandacht voor het gesprek en minder stress over de administratie.",
    name: "Ari Slozen",
    role: "Jongerencoach",
  },
  {
    quote:
      "De opzet is duidelijk en ik kan mijn eigen structuur makkelijk toepassen.",
    name: "Ria Smit",
    role: "Coach",
  },
];

export default function TestimonialsSection() {
  return (
    <SectionContainer className="bg-white">
      {/* Testimonials content */}
      <div className="flex w-full flex-col gap-8">
        {/* Testimonials heading */}
        <SectionHeading
          title="Ervaringen van coaches"
          description="Coaches gebruiken Rapply elke dag om overzicht en rust te houden."
          alignment="center"
        />
        {/* Testimonials list */}
        <div className="grid w-full gap-6 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="flex w-full flex-col gap-6 rounded-2xl border border-black/10 bg-white p-6 shadow-[0_6px_16px_rgba(15,23,42,0.08)]"
            >
              {/* Testimonial quote */}
              <p className="text-base font-normal text-black/80">
                "{testimonial.quote}"
              </p>
              {/* Testimonial author */}
              <div className="flex w-full flex-col gap-1">
                {/* Testimonial name */}
                <span className="text-sm font-semibold text-black">
                  {testimonial.name}
                </span>
                {/* Testimonial role */}
                <span className="text-sm font-normal text-black/60">
                  {testimonial.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
