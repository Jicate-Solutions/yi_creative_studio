import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Yi Brand Colors
const YI_BLUE = '#005B96'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          background: YI_BLUE,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '6px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Yi
      </div>
    ),
    {
      ...size,
    }
  )
}
