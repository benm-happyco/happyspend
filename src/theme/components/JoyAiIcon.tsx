import { Box } from '@mantine/core'
import joyBlueLg from '../../assets/joyai/joy-blue-lg.svg'
import joyBlueSm from '../../assets/joyai/joy-blue-sm.svg'
import joyGreen from '../../assets/joyai/joy-green.svg'
import joySmile from '../../assets/joyai/joy-smile.svg'

export function JoyAiIcon() {
  return (
    <Box
      w={16}
      h={16}
      style={{
        position: 'relative',
        borderRadius: 4,
        backgroundColor: 'var(--mantine-color-blurple-6)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <Box
        style={{
          position: 'absolute',
          inset: '38.09% -11.91% -61.91% -11.91%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box style={{ width: 19.812, height: 19.812, transform: 'rotate(180deg)' }}>
          <Box style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Box
              component="img"
              src={joyBlueLg}
              alt=""
              style={{ position: 'absolute', inset: '-54.33%' }}
            />
          </Box>
        </Box>
      </Box>
      <Box
        style={{
          position: 'absolute',
          inset: '7.29% -29.17% 15.63% 52.08%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box style={{ width: 12.333, height: 12.333, transform: 'rotate(180deg)' }}>
          <Box style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Box
              component="img"
              src={joyBlueSm}
              alt=""
              style={{ position: 'absolute', inset: '-87.27%' }}
            />
          </Box>
        </Box>
      </Box>
      <Box
        style={{
          position: 'absolute',
          inset: '51.82% -48.18% -48.18% 51.82%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box style={{ width: 15.417, height: 15.417, transform: 'rotate(180deg)' }}>
          <Box style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Box
              component="img"
              src={joyGreen}
              alt=""
              style={{ position: 'absolute', inset: '-69.82%' }}
            />
          </Box>
        </Box>
      </Box>
      <Box
        component="img"
        src={joySmile}
        alt=""
        style={{
          position: 'absolute',
          top: '56.25%',
          left: '25%',
          right: '25%',
          bottom: '25%',
        }}
      />
    </Box>
  )
}
