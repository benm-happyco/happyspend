import { Box } from '@mantine/core'
import joyIcon from '../../assets/joyai/joy-icon.svg'

type JoyAiIconProps = {
  size?: number
  alt?: string
}

export function JoyAiIcon({ size = 16, alt = '' }: JoyAiIconProps) {
  return (
    <Box
      component="img"
      src={joyIcon}
      alt={alt}
      w={size}
      h={size}
      style={{ display: 'block', flexShrink: 0 }}
    />
  )
}
