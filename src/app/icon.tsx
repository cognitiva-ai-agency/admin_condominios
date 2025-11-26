import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 256,
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '128px',
        }}
      >
        AC
      </div>
    ),
    {
      ...size,
    }
  )
}
