import { Box } from '@mantine/core'

type CategoryIconProps = {
  src: string
  size?: number
}

export function CategoryIcon({ src, size = 24 }: CategoryIconProps) {
  return (
    <Box
      w={size}
      h={size}
      style={{
        backgroundColor: 'var(--mantine-color-text)',
        maskImage: `url(${src})`,
        maskRepeat: 'no-repeat',
        maskSize: 'contain',
        maskPosition: 'center',
        WebkitMaskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain',
        WebkitMaskPosition: 'center',
      }}
    />
  )
}
