/* eslint-disable @typescript-eslint/no-explicit-any */
import { HeaderSection } from './HeaderSection'
import { HeroSection } from './HeroSection'
import { ProductGrid } from './ProductGrid'
import { CTASection } from './CTASection'
import { TextBlock } from './TextBlock'
import { NewsletterSection } from './NewsletterSection'
import { FooterSection } from './FooterSection'
import { TestimonialsSection } from './TestimonialsSection'
import { ImageBlock } from './ImageBlock'
import { ButtonBlock } from './ButtonBlock'
import { SpacerBlock } from './SpacerBlock'
import { DividerBlock } from './DividerBlock'
import { CartItems } from './CartItems'
import { CheckoutSummary } from './CheckoutSummary'
import { AccountNavigation } from './AccountNavigation'
import { AccountContent } from './AccountContent'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'
import { AuthContainer } from './AuthContainer'
import { FreeformText } from './FreeformText'
import { FreeformImage } from './FreeformImage'
import { FreeformButton } from './FreeformButton'
import { RectangleShape } from './RectangleShape'
import { CircleShape } from './CircleShape'
import { LineShape } from './LineShape'

// Component type mapping for dynamic rendering
export const componentMap: Record<string, React.ComponentType<any>> = {
  // Header
  'header': HeaderSection,
  'header-default': HeaderSection,
  'header-simple': HeaderSection,
  
  // Hero variants
  'hero': HeroSection,
  'hero-default': HeroSection,
  'hero-split': HeroSection,
  'hero-minimal': HeroSection,
  'hero-video': HeroSection,
  
  // Product displays
  'product-grid': ProductGrid,
  'product-carousel': ProductGrid,
  'product-featured': ProductGrid,
  'product-categories': ProductGrid,
  
  // Content blocks
  'text': FreeformText,
  'text-block': TextBlock,
  'image-block': ImageBlock,
  'image': FreeformImage,
  'button-block': ButtonBlock,
  'button': FreeformButton,
  'rectangle': RectangleShape,
  'circle': CircleShape,
  'line': LineShape,
  'spacer-block': SpacerBlock,
  'spacer': SpacerBlock,
  'divider-block': DividerBlock,
  'divider': DividerBlock,
  
  // Sections
  'cta': CTASection,
  'cta-default': CTASection,
  'cta-split': CTASection,
  'cta-banner': CTASection,
  'newsletter-default': NewsletterSection,
  'newsletter': NewsletterSection,
  'testimonials-carousel': TestimonialsSection,
  'testimonials-grid': TestimonialsSection,
  'testimonials': TestimonialsSection,
  
  // Layout
  'footer': FooterSection,
  'footer-default': FooterSection,
  'footer-minimal': FooterSection,
  'footer-detailed': FooterSection,

  // Commerce primitives
  'cart-items': CartItems,
  'checkout-summary': CheckoutSummary,

  // Account experience
  'account-navigation': AccountNavigation,
  'account-content': AccountContent,

  // Auth
  'login-form': LoginForm,
  'signup-form': SignUpForm,
  'auth-container': AuthContainer,
  
  // Additional ecommerce components (can be added later)
  'cart-summary': TextBlock, // Placeholder
  'checkout-form': TextBlock, // Placeholder
  'contact-form': TextBlock, // Placeholder
  'faq-accordion': TextBlock, // Placeholder
  'pricing-table': TextBlock, // Placeholder
  'team-grid': TestimonialsSection, // Reuse testimonials structure
  'logo-cloud': ImageBlock, // Reuse image block
}

// Helper to check if component type exists
export function hasComponent(type: string): boolean {
  return type in componentMap
}

// Export all components for direct use
export {
  HeroSection,
  ProductGrid,
  CTASection,
  TextBlock,
  NewsletterSection,
  FooterSection,
  TestimonialsSection,
  ImageBlock,
  ButtonBlock,
  SpacerBlock,
  DividerBlock,
  CartItems,
  CheckoutSummary,
  AccountNavigation,
  AccountContent,
  LoginForm,
  SignUpForm,
  AuthContainer,
  FreeformText,
  FreeformImage,
  FreeformButton,
  RectangleShape,
  CircleShape,
  LineShape
}
