import { Box } from '@mantine/core'
import type { ReactNode } from 'react'
import inspectionsIcon from '../../assets/figma/81cad58f62e79699d7f5ed569a44bde8836dfe01.svg'
import tasksIcon from '../../assets/figma/45805cfed7c260308c4d5c096934aa01401ba830.svg'
import projectsIcon from '../../assets/figma/259d193aa8671a9d1600b9e64366f7cc873326db.svg'
import callLeftIcon from '../../assets/figma/b647dce8c5cbcbd941813d768df60b02cc4cdc95.svg'
import callRightIcon from '../../assets/figma/02dd7a28a1b59022b2a6710afdb32cc2679e9add.svg'
import insightsIcon from '../../assets/figma/44d4c9d5ff54b181f9248f54bdfbd498c037588a.svg'
import inventoryIcon from '../../assets/figma/bdc1af0ddfe5b4276d223347a1ffb0b3dc41d1e5.svg'

export type HpyAppIconType = 'Inspections' | 'Tasks' | 'Projects' | 'Call Management' | 'Insights' | 'Inventory'

type HpyAppIconProps = {
  type: HpyAppIconType
  size?: number
  radius?: number
}

const APP_ICON_CONFIG: Record<
  HpyAppIconType,
  {
    background: string
    render: () => ReactNode
  }
> = {
  Inspections: {
    background: 'rgba(18, 184, 134, 0.1)',
    render: () => (
      <Box
        style={{
          position: 'absolute',
          top: '33.88%',
          bottom: '33.89%',
          left: '12.01%',
          right: '10.45%',
        }}
      >
        <img src={inspectionsIcon} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
      </Box>
    ),
  },
  Tasks: {
    background: 'rgba(255, 112, 51, 0.15)',
    render: () => (
      <Box style={{ position: 'absolute', top: '30.32%', bottom: '30.32%', left: '12.78%', right: '12.78%' }}>
        <img src={tasksIcon} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
      </Box>
    ),
  },
  Projects: {
    background: 'rgba(99, 91, 255, 0.1)',
    render: () => (
      <Box style={{ position: 'absolute', top: '25.11%', bottom: '25.11%', left: '22.17%', right: '22.17%' }}>
        <img src={projectsIcon} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
      </Box>
    ),
  },
  'Call Management': {
    background: 'rgba(0, 180, 187, 0.15)',
    render: () => (
      <Box style={{ position: 'relative', width: '100%', height: '100%' }}>
        <img
          src={callLeftIcon}
          alt=""
          style={{
            position: 'absolute',
            top: '24.71%',
            bottom: '24.72%',
            left: '21.87%',
            width: '24.03%',
            height: '50.57%',
            objectFit: 'contain',
          }}
        />
        <img
          src={callRightIcon}
          alt=""
          style={{
            position: 'absolute',
            top: '24.71%',
            bottom: '24.72%',
            left: '54%',
            width: '24.03%',
            height: '50.57%',
            objectFit: 'contain',
            transform: 'rotate(180deg)',
          }}
        />
      </Box>
    ),
  },
  Insights: {
    background: 'rgba(250, 82, 82, 0.1)',
    render: () => (
      <Box style={{ position: 'absolute', inset: '28.52%' }}>
        <img src={insightsIcon} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
      </Box>
    ),
  },
  Inventory: {
    background: 'rgba(0, 148, 199, 0.15)',
    render: () => (
      <Box
        style={{
          position: 'absolute',
          width: '62.44%',
          height: '59.95%',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <img src={inventoryIcon} alt="" style={{ width: '100%', height: '100%', display: 'block' }} />
      </Box>
    ),
  },
}

export function HpyAppIcon({ type, size = 24, radius = 4 }: HpyAppIconProps) {
  const config = APP_ICON_CONFIG[type]

  return (
    <Box
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: config.background,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {config.render()}
    </Box>
  )
}

