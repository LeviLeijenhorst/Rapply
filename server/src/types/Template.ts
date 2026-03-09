export type TemplateSection = {
  id: string
  title: string
  description: string
}

export type TemplateCategory = "gespreksverslag" | "ander-verslag"

export type Template = {
  id: string
  name: string
  category: TemplateCategory
  description: string
  sections: TemplateSection[]
  isSaved: boolean
  isDefault: boolean
  createdAtUnixMs: number
  updatedAtUnixMs: number
}
