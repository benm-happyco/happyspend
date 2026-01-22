import { Box } from '@mantine/core'
import joyIcon from '../../assets/joyai/joy-icon.svg'

export function JoyAiIcon() {
  return (
    <Box
      component="img"
      src={joyIcon}
      alt=""
      w={16}
      h={16}
      style={{ display: 'block', flexShrink: 0 }}
    />
  )
}
