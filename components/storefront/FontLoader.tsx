'use client'

import { useEffect } from 'react'
import { loadGoogleFont, GOOGLE_FONTS } from './utils/googleFonts'

interface ComponentData {
  id: string
  type: string
  props: Record<string, unknown>
  children?: ComponentData[]
}

interface FontLoaderProps {
  components: ComponentData[]
}

export function FontLoader({ components }: FontLoaderProps) {
  useEffect(() => {
    const fontsToLoad = new Set<string>()

    const traverse = (items: ComponentData[]) => {
      items.forEach(item => {
        // Check props for fontFamily
        if (item.props) {
            if (typeof item.props.fontFamily === 'string') {
                fontsToLoad.add(item.props.fontFamily)
            }
            
            // Check nested config object if it exists (FreeformText uses this structure)
            // The text prop can be a string or an object with config
            if (item.props.text && typeof item.props.text === 'object') {
                const textConfig = item.props.text as Record<string, unknown>
                // Sometimes the config is directly in the text object, or nested?
                // Looking at FreeformText.tsx: resolveTextValue returns { text: string, config: value }
                // So if props.text is the value, it might have fontFamily directly.
                if (typeof textConfig.fontFamily === 'string') {
                    fontsToLoad.add(textConfig.fontFamily)
                }
            }
        }

        if (item.children) {
          traverse(item.children)
        }
      })
    }

    traverse(components)

    fontsToLoad.forEach(fontName => {
      // Check if it's a Google Font
      const googleFont = GOOGLE_FONTS.find(gf => gf.name === fontName)
      if (googleFont) {
        // Load with all weights to ensure it looks right
        loadGoogleFont(fontName, googleFont.weights)
      }
    })
  }, [components])

  return null
}
