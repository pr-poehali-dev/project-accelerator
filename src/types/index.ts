import type { ReactNode } from "react"

export interface Section {
  id: string
  title: string
  subtitle?: ReactNode
  content?: string
  showButton?: boolean
  buttonText?: string
}

export interface SectionProps extends Section {
  isActive: boolean
}

export interface MenuDay {
  date: string
  day: string
  standard: string
  standard_plus: string
  premium: string
}
