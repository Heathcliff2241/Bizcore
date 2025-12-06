/* eslint-disable @typescript-eslint/no-explicit-any */
import { HeaderSection } from './HeaderSection'
import { HeaderGlass } from './HeaderGlass'
import { HeroGlass } from './HeroGlass'
import { GlassElement } from './GlassElement'
import { BlankHeaderSection } from './BlankHeaderSection'
import { HeroSection } from './HeroSection'
import { AboutSection } from './AboutSection'
import { ProductGrid } from './ProductGrid'
import { ProductCarousel } from './ProductCarousel'
import { CTASection } from './CTASection'
import { TextBlock } from './TextBlock'
import { NewsletterSection } from './NewsletterSection'
import { FooterSection } from './FooterSection'
import { FooterGlass } from './FooterGlass'
import { TestimonialsSection } from './TestimonialsSection'
import { BlankSection } from './BlankSection'
import { ImageBlock } from './ImageBlock'
import { ButtonBlock } from './ButtonBlock'
import { SpacerBlock } from './SpacerBlock'
import { DividerBlock } from './DividerBlock'
import { CartItems } from './CartItems'
import { CheckoutSummary } from './CheckoutSummary'
import { CheckoutForm } from './CheckoutForm'
import ProductDetail from './ProductDetail'
import CartView from './CartView'
import { ContactForm } from './ContactForm'
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
  'header-glass': HeaderGlass,
  'blank-header': BlankHeaderSection,
  'blank-header-default': BlankHeaderSection,
  
  // Hero variants
  'hero': HeroSection,
  'hero-default': HeroSection,
  'hero-split': HeroSection,
  'hero-minimal': HeroSection,
  'hero-video': HeroSection,
  'hero-glass': HeroGlass,

  // About section
  'about': AboutSection,
  'about-default': AboutSection,
  'about-left-image': AboutSection,
  'about-right-image': AboutSection,
  
  // Product displays
  'product-grid': ProductGrid,
  'product-carousel': ProductCarousel,
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
  'glass-shape': GlassElement,
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
  'blank': BlankSection,
  
  // Layout
  'footer': FooterSection,
  'footer-default': FooterSection,
  'footer-minimal': FooterSection,
  'footer-detailed': FooterSection,
  'footer-glass': FooterGlass,

  // Commerce primitives
  'cart-items': CartItems,
  'checkout-summary': CheckoutSummary,
  'checkout-form': CheckoutForm,

  // Account experience
  'account-navigation': AccountNavigation,
  'account-content': AccountContent,

  // Auth
  'login-form': LoginForm,
  'signup-form': SignUpForm,
  'auth-container': AuthContainer,
  'product-detail': ProductDetail,
  'cart-view': CartView,
  'contact-form': ContactForm,
  'contact-form-default': ContactForm,
  'contact-form-simple': ContactForm,
  
  // Additional ecommerce components (can be added later)
  'cart-summary': TextBlock, // Placeholder
  // 'contact-form': TextBlock, // Placeholder - Already defined above
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
  HeaderSection,
  HeaderGlass,
  BlankHeaderSection,
  HeroSection,
  AboutSection,
  ProductGrid,
  ProductCarousel,
  CTASection,
  TextBlock,
  NewsletterSection,
  FooterSection,
  FooterGlass,
  TestimonialsSection,
  BlankSection,
  ImageBlock,
  ButtonBlock,
  SpacerBlock,
  DividerBlock,
  CartItems,
  CheckoutSummary,
  CheckoutForm,
  AccountNavigation,
  AccountContent,
  LoginForm,
  SignUpForm,
  AuthContainer,
  FreeformText,
  FreeformImage,
  FreeformButton,
  ProductDetail,
  CartView,
  ContactForm,
  RectangleShape,
  CircleShape,
  LineShape
}
