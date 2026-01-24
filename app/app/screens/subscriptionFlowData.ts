export type SubscriptionScreenKey = "plans" | "cancel" | "tips"

export type SubscriptionPlanKey = "basis" | "professioneel" | "fulltime" | "praktijk"

import { subscriptionPlanProductIdsByPlanKey } from "@/services/subscriptionCatalog"

export type SubscriptionCancelReasonKey =
  | "app-werkt-niet-goed"
  | "te-duur"
  | "andere-tool"
  | "geen-waarde"
  | "anders"

export const subscriptionPlans = [
  {
    key: "basis" as const,
    name: "Starter",
    priceSuffix: "/maand",
    productId: subscriptionPlanProductIdsByPlanKey.basis.monthly,
    features: [
      { icon: "coachees" as const, label: "Tot 3 coachees" },
      { icon: "clock" as const, label: "10 uur per maand" },
    ],
  },
  {
    key: "professioneel" as const,
    name: "Professioneel",
    priceSuffix: "/maand",
    productId: subscriptionPlanProductIdsByPlanKey.professioneel.monthly,
    features: [
      { icon: "coachees" as const, label: "Tot 20 coachees" },
      { icon: "clock" as const, label: "40 uur per maand" },
    ],
  },
  {
    key: "fulltime" as const,
    name: "Fulltime",
    priceSuffix: "/maand",
    productId: subscriptionPlanProductIdsByPlanKey.fulltime.monthly,
    features: [
      { icon: "coachees" as const, label: "Onbeperkt coachees" },
      { icon: "clock" as const, label: "100 uur per maand" },
    ],
  },
  {
    key: "praktijk" as const,
    name: "Praktijk",
    price: "Op aanvraag",
    priceSuffix: "",
    features: [
      { icon: "coachees" as const, label: "Voor praktijken en teams" },
      { icon: "clock" as const, label: "Afgestemd op behoefte" },
    ],
  },
] as const

export const subscriptionCancelReasons = [
  { key: "app-werkt-niet-goed" as const, title: "De app werkt niet goed" },
  { key: "te-duur" as const, title: "Ik vind het te duur" },
  { key: "andere-tool" as const, title: "Ik ben overgestapt naar een andere transcriptietool" },
  { key: "geen-waarde" as const, title: "Ik vind het geen goede toegevoegde waarde leveren" },
  { key: "anders" as const, title: "Anders, namelijk..." },
] as const


