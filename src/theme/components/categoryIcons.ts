import generalIcon from '../../assets/category-icons/general.svg'
import applianceIcon from '../../assets/category-icons/appliance.svg'
import housekeepingIcon from '../../assets/category-icons/housekeeping.svg'
import heatingCoolingIcon from '../../assets/category-icons/heating-cooling.svg'
import interiorIcon from '../../assets/category-icons/interior.svg'
import plumbingIcon from '../../assets/category-icons/plumbing.svg'
import roofingIcon from '../../assets/category-icons/roofing.svg'
import commonAreaIcon from '../../assets/category-icons/commonarea.svg'
import electricalIcon from '../../assets/category-icons/electrical.svg'
import windowsIcon from '../../assets/category-icons/windows.svg'
import flooringIcon from '../../assets/category-icons/flooring.svg'
import groundsIcon from '../../assets/category-icons/grounds.svg'
import doorsIcon from '../../assets/category-icons/doors.svg'
import exteriorIcon from '../../assets/category-icons/exterior.svg'
import safetyIcon from '../../assets/category-icons/safety.svg'
import toolsIcon from '../../assets/category-icons/tools.svg'

export const CATEGORY_ICON_MAP: Record<string, string> = {
  general: generalIcon,
  tools: toolsIcon,
  tool: toolsIcon,
  appliance: applianceIcon,
  appliances: applianceIcon,
  housekeeping: housekeepingIcon,
  heatingcooling: heatingCoolingIcon,
  heating: heatingCoolingIcon,
  cooling: heatingCoolingIcon,
  hvac: heatingCoolingIcon,
  interior: interiorIcon,
  plumbing: plumbingIcon,
  roofing: roofingIcon,
  commonarea: commonAreaIcon,
  commonareas: commonAreaIcon,
  electrical: electricalIcon,
  windows: windowsIcon,
  window: windowsIcon,
  flooring: flooringIcon,
  grounds: groundsIcon,
  doors: doorsIcon,
  door: doorsIcon,
  exterior: exteriorIcon,
  safety: safetyIcon,
}

const normalizeCategory = (value: string) => value.toLowerCase().replace(/[\s_-]+/g, '')

export const getCategoryIconSrc = (category?: string | null): string => {
  if (!category) return generalIcon
  const normalized = normalizeCategory(category)
  return CATEGORY_ICON_MAP[normalized] ?? generalIcon
}
