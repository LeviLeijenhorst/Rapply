export const shadows = {
  cardHover: "0 2px 8px rgba(0,0,0,0.04)",
  menu: "0 2px 8px rgba(0,0,0,0.04)",
  modal: "0 2px 8px rgba(0,0,0,0.04)",
  buttonHover: "0 2px 8px rgba(0,0,0,0.04)",
  buttonFilledHover:
    "0 2px 8px rgba(0,0,0,0.04)",
} as const;

export const rnShadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
} as const
