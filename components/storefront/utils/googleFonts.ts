
export interface FontOption {
  name: string
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace'
  weights: number[]
  popular?: boolean
}

export const GOOGLE_FONTS: FontOption[] = [
  // Sans-serif fonts (Modern, clean)
  { name: 'Inter', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], popular: true },
  { name: 'Roboto', category: 'sans-serif', weights: [100, 300, 400, 500, 700, 900], popular: true },
  { name: 'Open Sans', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800], popular: true },
  { name: 'Lato', category: 'sans-serif', weights: [100, 300, 400, 700, 900], popular: true },
  { name: 'Montserrat', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], popular: true },
  { name: 'Poppins', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], popular: true },
  { name: 'Raleway', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Nunito', category: 'sans-serif', weights: [200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Ubuntu', category: 'sans-serif', weights: [300, 400, 500, 700] },
  { name: 'Work Sans', category: 'sans-serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Nunito Sans', category: 'sans-serif', weights: [200, 300, 400, 600, 700, 800, 900] },
  { name: 'Rubik', category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800, 900] },
  { name: 'DM Sans', category: 'sans-serif', weights: [400, 500, 700] },
  { name: 'Manrope', category: 'sans-serif', weights: [200, 300, 400, 500, 600, 700, 800] },
  { name: 'Plus Jakarta Sans', category: 'sans-serif', weights: [200, 300, 400, 500, 600, 700, 800] },

  // Serif fonts (Classic, elegant)
  { name: 'Playfair Display', category: 'serif', weights: [400, 500, 600, 700, 800, 900], popular: true },
  { name: 'Merriweather', category: 'serif', weights: [300, 400, 700, 900], popular: true },
  { name: 'Lora', category: 'serif', weights: [400, 500, 600, 700], popular: true },
  { name: 'PT Serif', category: 'serif', weights: [400, 700] },
  { name: 'Crimson Text', category: 'serif', weights: [400, 600, 700] },
  { name: 'EB Garamond', category: 'serif', weights: [400, 500, 600, 700, 800] },
  { name: 'Libre Baskerville', category: 'serif', weights: [400, 700] },
  { name: 'Bitter', category: 'serif', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] },
  { name: 'Cormorant', category: 'serif', weights: [300, 400, 500, 600, 700] },
  { name: 'Spectral', category: 'serif', weights: [200, 300, 400, 500, 600, 700, 800] },

  // Display fonts (Headers, impact)
  { name: 'Bebas Neue', category: 'display', weights: [400], popular: true },
  { name: 'Oswald', category: 'display', weights: [200, 300, 400, 500, 600, 700], popular: true },
  { name: 'Archivo Black', category: 'display', weights: [400] },
  { name: 'Righteous', category: 'display', weights: [400] },
  { name: 'Anton', category: 'display', weights: [400] },
  { name: 'Fjalla One', category: 'display', weights: [400] },
  { name: 'Staatliches', category: 'display', weights: [400] },
  { name: 'Teko', category: 'display', weights: [300, 400, 500, 600, 700] },
  { name: 'Russo One', category: 'display', weights: [400] },
  { name: 'Bungee', category: 'display', weights: [400] },

  // Handwriting fonts (Personal, creative)
  { name: 'Pacifico', category: 'handwriting', weights: [400], popular: true },
  { name: 'Dancing Script', category: 'handwriting', weights: [400, 500, 600, 700] },
  { name: 'Caveat', category: 'handwriting', weights: [400, 500, 600, 700] },
  { name: 'Satisfy', category: 'handwriting', weights: [400] },
  { name: 'Great Vibes', category: 'handwriting', weights: [400] },
  { name: 'Permanent Marker', category: 'handwriting', weights: [400] },
  { name: 'Indie Flower', category: 'handwriting', weights: [400] },
  { name: 'Shadows Into Light', category: 'handwriting', weights: [400] },

  // Monospace fonts (Code, technical)
  { name: 'JetBrains Mono', category: 'monospace', weights: [100, 200, 300, 400, 500, 600, 700, 800], popular: true },
  { name: 'Fira Code', category: 'monospace', weights: [300, 400, 500, 600, 700] },
  { name: 'IBM Plex Mono', category: 'monospace', weights: [100, 200, 300, 400, 500, 600, 700] },
  { name: 'Roboto Mono', category: 'monospace', weights: [100, 200, 300, 400, 500, 600, 700] },
  { name: 'Source Code Pro', category: 'monospace', weights: [200, 300, 400, 500, 600, 700, 900] },
]

// Load a Google Font dynamically
export function loadGoogleFont(fontName: string, weights: number[] = [400]): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  return new Promise((resolve) => {
    // Create font face CSS URL
    const weightsParam = weights.join(';')
    const fontUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@${weightsParam}&display=swap`

    // Check if link already exists
    const existingLink = document.querySelector(`link[href*="${fontName.replace(/ /g, '+')}"]`)
    if (existingLink) {
      resolve()
      return
    }

    // Create and append link element
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = fontUrl
    link.crossOrigin = 'anonymous' // Add crossOrigin attribute
    
    link.onload = () => {
      // Give browser time to parse the CSS
      setTimeout(() => {
        // Check if fonts are actually available
        const fontCheck = `${weights[0] || 400} 16px "${fontName}"`
        document.fonts.load(fontCheck).then(() => {
          resolve()
        }).catch(() => {
          // Fallback: resolve anyway after short delay
          setTimeout(() => resolve(), 100)
        })
      }, 50)
    }
    
    link.onerror = () => {
      console.error(`Failed to load font: ${fontName}`)
      resolve()
    }

    document.head.appendChild(link)
  })
}
