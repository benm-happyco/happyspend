import type { IconSvgObject } from '@hugeicons-pro/core-stroke-rounded'
import {
  Bug01Icon,
  CleanIcon,
  CleaningBucketIcon,
  Door02Icon,
  ElectricPlugsIcon,
  Fan01Icon,
  FireIcon,
  GasPipeIcon,
  Leaf01Icon,
  PaintBrush01Icon,
  RefrigeratorIcon,
  ToolsIcon,
  UserShield02Icon,
  Wrench01Icon,
} from '@hugeicons-pro/core-stroke-rounded'

export const CATEGORY_ICON_MAP: Record<string, IconSvgObject> = {
  appliances: RefrigeratorIcon,
  electrical: ElectricPlugsIcon,
  plumbing: Wrench01Icon,
  gas: GasPipeIcon,
  hvac: Fan01Icon,
  heating: Fan01Icon,
  cooling: Fan01Icon,
  pest: Bug01Icon,
  pests: Bug01Icon,
  cleaning: CleaningBucketIcon,
  housekeeping: CleanIcon,
  grounds: Leaf01Icon,
  landscaping: Leaf01Icon,
  exterior: Leaf01Icon,
  safety: FireIcon,
  fire: FireIcon,
  security: UserShield02Icon,
  doors: Door02Icon,
  door: Door02Icon,
  paint: PaintBrush01Icon,
  painting: PaintBrush01Icon,
  general: ToolsIcon,
  maintenance: ToolsIcon,
}

const normalizeCategory = (value: string) => value.toLowerCase().replace(/[\s_-]+/g, '')

export const getCategoryIcon = (category?: string | null): IconSvgObject => {
  if (!category) return ToolsIcon
  const normalized = normalizeCategory(category)
  return CATEGORY_ICON_MAP[normalized] ?? ToolsIcon
}
