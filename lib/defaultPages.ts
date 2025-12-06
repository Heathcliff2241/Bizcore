// Default page templates that get created for new tenants
export interface DefaultPageTemplate {
  id: string
  name: string
  slug: string
  title: string
  description: string
  components: PageComponent[]
  isHomePage: boolean
  order: number
}

export interface PageComponent {
  id: string
  type: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  locked: boolean
  props: Record<string, unknown>
  children?: PageComponent[]
  zIndex?: number
  hidden?: boolean
}

// Create a professional homepage template
function createHomePage(businessName: string): DefaultPageTemplate {
  return {
    id: 'default-home',
    name: 'Home',
  slug: 'home',
    title: `${businessName} - Welcome`,
    description: `Welcome to ${businessName}. Discover our amazing products and services.`,
    isHomePage: true,
    order: 1,
    components: [
      // Header Section
      {
        id: 'home-header',
        type: 'header-default',
        position: { x: 0, y: 0 },
        size: { width: 1440, height: 80 },
        rotation: 0,
        locked: false,
        props: {
          backgroundColor: '#ffffff',
          textColor: '#0f172a',
          logoText: businessName,
          navigationLinks: [
            { label: 'Menu', url: '/menu' },
            { label: 'Cart', url: '/cart' },
            { label: 'My Account', url: '/account' },
            { label: 'Sign Up', url: '/signup' }
          ],
          showCart: true,
          cartItemCount: 0,
          sticky: true
        },
        children: []
      },
      // Hero Section
      {
        id: 'home-hero',
        type: 'hero-default',
        position: { x: 0, y: 80 },
        size: { width: 1440, height: 600 },
        rotation: 0,
        locked: false,
        props: {
          heading: `Experience ${businessName}`,
          subheading: 'Crafted with seasonal ingredients, delivered with hospitality.',
          ctaText: 'Explore the Menu',
          ctaUrl: '/menu',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
          alignment: 'center',
          height: 600
        },
        children: []
      },
      // Featured Title
      {
        id: 'home-featured-title',
        type: 'text',
        position: { x: 120, y: 720 },
        size: { width: 1200, height: 60 },
        rotation: 0,
        locked: false,
        props: {
          text: 'Signature Picks',
          fontSize: 36,
          fontWeight: '700',
          textAlign: 'center',
          color: '#0f172a'
        },
        children: []
      },
      // Product Grid Preview
      {
        id: 'home-product-grid',
        type: 'product-grid',
        position: { x: 120, y: 800 },
        size: { width: 1200, height: 720 },
        rotation: 0,
        locked: false,
        props: {
          columns: 3,
          showPrice: true,
          showRating: true,
          title: 'Popular This Week',
          backgroundColor: '#ffffff'
        },
        children: []
      },
      // CTA Section
      {
        id: 'home-cta',
        type: 'cta-default',
        position: { x: 0, y: 1560 },
        size: { width: 1440, height: 320 },
        rotation: 0,
        locked: false,
        props: {
          heading: 'Planning something special?',
          subheading: 'Let our team curate a menu tailored to your guests.',
          buttonText: 'Plan Catering',
          buttonUrl: '/contact',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
          buttonColor: '#ffffff'
        },
        children: []
      },
      // Newsletter Section
      {
        id: 'home-newsletter',
        type: 'newsletter-default',
        position: { x: 0, y: 1900 },
        size: { width: 1440, height: 320 },
        rotation: 0,
        locked: false,
        props: {
          heading: 'Stay in the loop',
          subheading: 'Be first to hear about seasonal drops and exclusive offers.',
          buttonText: 'Subscribe',
          backgroundColor: '#f1f5f9',
          textColor: '#0f172a'
        },
        children: []
      },
      // Footer Section
      {
        id: 'home-footer',
        type: 'footer-default',
        position: { x: 0, y: 2240 },
        size: { width: 1440, height: 360 },
        rotation: 0,
        locked: false,
        props: {
          companyName: businessName,
          tagline: 'Crafted daily. Served with care.',
          backgroundColor: '#0f172a',
          textColor: '#ffffff',
          columns: [
            {
              title: 'Visit',
              links: [
                { label: 'Our Locations', url: '/locations' },
                { label: 'Hours', url: '/hours' },
                { label: 'Gift Cards', url: '/gift-cards' }
              ]
            },
            {
              title: 'Support',
              links: [
                { label: 'Help Center', url: '/support' },
                { label: 'Shipping & Returns', url: '/shipping' },
                { label: 'Contact', url: '/contact' }
              ]
            },
            {
              title: 'Account',
              links: [
                { label: 'Sign In', url: '/login' },
                { label: 'Create Account', url: '/signup' },
                { label: 'Track Orders', url: '/account/orders' }
              ]
            }
          ]
        },
        children: []
      }
    ]
  }
}

// Create menu/products page template
function createMenuPage(businessName: string): DefaultPageTemplate {
  return {
    id: 'default-menu',
    name: 'Menu',
  slug: 'menu',
    title: `${businessName} - Menu`,
    description: `Browse our delicious menu and place your order.`,
    isHomePage: false,
    order: 2,
    components: [
      // Header Section
      {
        id: 'header-menu',
        type: 'header-default',
        position: { x: 0, y: 0 },
        size: { width: 1440, height: 80 },
        rotation: 0,
        locked: false,
        props: {
          backgroundColor: '#ffffff',
          logo: businessName,
          showNav: true,
          navItems: ['Home', 'Menu', 'Cart', 'Account']
        },
        children: []
      },
      // Page Title
      {
        id: 'menu-title',
        type: 'text',
        position: { x: 120, y: 120 },
        size: { width: 1200, height: 80 },
        rotation: 0,
        locked: false,
        props: {
          text: 'Our Menu',
          fontSize: 48,
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#2d3748'
        },
        children: []
      },
      // Product Grid Container
      {
        id: 'product-grid',
        type: 'product-grid',
        position: { x: 120, y: 220 },
        size: { width: 1200, height: 800 },
        rotation: 0,
        locked: false,
        props: {
          columns: 3,
          gap: 24,
          showPrices: true,
          showDescriptions: true,
          backgroundColor: 'transparent'
        },
        children: []
      }
    ]
  }
}

// Create cart page template  
function createCartPage(businessName: string): DefaultPageTemplate {
  return {
    id: 'default-cart',
    name: 'Cart',
  slug: 'cart',
    title: `${businessName} - Shopping Cart`,
    description: `Review your order and proceed to checkout.`,
    isHomePage: false,
    order: 3,
    components: [
      // Header Section
      {
        id: 'header-cart',
        type: 'header-default',
        position: { x: 0, y: 0 },
        size: { width: 1440, height: 80 },
        rotation: 0,
        locked: false,
        props: {
          backgroundColor: '#ffffff',
          logo: businessName,
          showNav: true,
          navItems: ['Home', 'Menu', 'Cart', 'Account']
        },
        children: []
      },
      // Page Title
      {
        id: 'cart-title',
        type: 'text',
        position: { x: 120, y: 120 },
        size: { width: 1200, height: 60 },
        rotation: 0,
        locked: false,
        props: {
          text: 'Shopping Cart',
          fontSize: 36,
          fontWeight: 'bold',
          color: '#2d3748'
        },
        children: []
      },
      // Cart Items Container
      {
        id: 'cart-items',
        type: 'cart-items',
        position: { x: 120, y: 200 },
        size: { width: 800, height: 400 },
        rotation: 0,
        locked: false,
        props: {
          backgroundColor: '#f7fafc',
          borderRadius: 8,
          padding: 24
        },
        children: []
      },
      // Checkout Section
      {
        id: 'checkout-summary',
        type: 'checkout-summary',
        position: { x: 940, y: 200 },
        size: { width: 380, height: 400 },
        rotation: 0,
        locked: false,
        props: {
          backgroundColor: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          padding: 24
        },
        children: []
      }
    ]
  }
}

// Create account page template
function createAccountPage(businessName: string): DefaultPageTemplate {
  return {
    id: 'default-account',
    name: 'My Account',
  slug: 'account',
    title: `${businessName} - My Account`,
    description: `Manage your account, view orders, and update preferences.`,
    isHomePage: false,
    order: 4,
    components: [
      // Header Section
      {
        id: 'header-account',
        type: 'header-default',
        position: { x: 0, y: 0 },
        size: { width: 1440, height: 80 },
        rotation: 0,
        locked: false,
        props: {
          backgroundColor: '#ffffff',
          logo: businessName,
          showNav: true,
          navItems: ['Home', 'Menu', 'Cart', 'Account']
        },
        children: []
      },
      // Page Title
      {
        id: 'account-title',
        type: 'text',
        position: { x: 120, y: 120 },
        size: { width: 1200, height: 60 },
        rotation: 0,
        locked: false,
        props: {
          text: 'My Account',
          fontSize: 36,
          fontWeight: 'bold',
          color: '#2d3748'
        },
        children: []
      },
      // Account Navigation
      {
        id: 'account-nav',
        type: 'account-navigation',
        position: { x: 120, y: 200 },
        size: { width: 300, height: 400 },
        rotation: 0,
        locked: false,
        props: {
          backgroundColor: '#f7fafc',
          borderRadius: 8,
          padding: 24,
          sections: ['Profile', 'Orders', 'Addresses', 'Preferences']
        },
        children: []
      },
      // Account Content
      {
        id: 'account-content',
        type: 'account-content',
        position: { x: 440, y: 200 },
        size: { width: 880, height: 600 },
        rotation: 0,
        locked: false,
        props: {
          backgroundColor: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          padding: 24
        },
        children: []
      }
    ]
  }
}

// Create login page template
function createLoginPage(businessName: string): DefaultPageTemplate {
  return {
    id: 'default-login',
    name: 'Login',
  slug: 'login',
    title: `${businessName} - Login`,
    description: `Sign in to your account to place orders and track purchases.`,
    isHomePage: false,
    order: 5,
    components: [
      // Header Section (simplified)
      {
        id: 'header-login',
        type: 'header-simple',
        position: { x: 0, y: 0 },
        size: { width: 1440, height: 80 },
        rotation: 0,
        locked: false,
        props: {
          backgroundColor: '#ffffff',
          logo: businessName,
          showBackLink: true,
          backText: 'Back to Home'
        },
        children: []
      },
      // Login Form Container
      {
        id: 'login-container',
        type: 'auth-container',
        position: { x: 520, y: 160 },
        size: { width: 400, height: 500 },
        rotation: 0,
        locked: false,
        props: {
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          padding: 40,
          shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        children: [
          {
            id: 'login-title',
            type: 'text',
            position: { x: 20, y: 20 },
            size: { width: 280, height: 40 },
            rotation: 0,
            locked: false,
            props: {
              text: 'Welcome Back',
              fontSize: 24,
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#2d3748'
            },
            children: []
          },
          {
            id: 'login-form',
            type: 'login-form',
            position: { x: 20, y: 80 },
            size: { width: 280, height: 300 },
            rotation: 0,
            locked: false,
            props: {
              fields: ['email', 'password'],
              submitText: 'Sign In',
              showForgotPassword: true,
              showSignUpLink: true
            },
            children: []
          }
        ]
      },
      // (title & form are children of login-container)
    ]
  }
}

// Create sign up page template
function createSignUpPage(businessName: string): DefaultPageTemplate {
  return {
    id: 'default-signup',
    name: 'Sign Up',
  slug: 'signup',
    title: `${businessName} - Create Account`,
    description: `Create your account to start ordering and enjoy exclusive benefits.`,
    isHomePage: false,
    order: 6,
    components: [
      // Header Section (simplified)
      {
        id: 'header-signup',
        type: 'header-simple',
        position: { x: 0, y: 0 },
        size: { width: 1440, height: 80 },
        rotation: 0,
        locked: false,
        props: {
          backgroundColor: '#ffffff',
          logo: businessName,
          showBackLink: true,
          backText: 'Back to Home'
        },
        children: []
      },
      // Sign Up Form Container
      {
        id: 'signup-container',
        type: 'auth-container',
        position: { x: 520, y: 140 },
        size: { width: 400, height: 600 },
        rotation: 0,
        locked: false,
        props: {
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          padding: 40,
          shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        children: [
          {
            id: 'signup-title',
            type: 'text',
            position: { x: 20, y: 20 },
            size: { width: 280, height: 40 },
            rotation: 0,
            locked: false,
            props: {
              text: 'Create Account',
              fontSize: 24,
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#2d3748'
            },
            children: []
          },
          {
            id: 'signup-form',
            type: 'signup-form',
            position: { x: 20, y: 80 },
            size: { width: 280, height: 300 },
            rotation: 0,
            locked: false,
            props: {
              fields: ['firstName', 'lastName', 'email', 'password', 'confirmPassword'],
              submitText: 'Create Account',
              showLoginLink: true,
              requireTerms: true
            },
            children: []
          }
        ]
      },
      // (title & form are children of signup-container)
    ]
  }
}

// Generate all default pages for a new tenant
export function generateDefaultPages(businessName: string): DefaultPageTemplate[] {
  return [
    createHomePage(businessName),
    createMenuPage(businessName),
    createCartPage(businessName),
    createAccountPage(businessName),
    createLoginPage(businessName),
    createSignUpPage(businessName)
  ]
}

// Convert template to database page format
export function templateToPageData(template: DefaultPageTemplate, tenantId: number) {
  const componentsJson = JSON.parse(JSON.stringify(template.components)) as import('@prisma/client').Prisma.InputJsonValue
  return {
    tenantId,
    slug: template.slug,
    title: template.title,
    description: template.description,
    content: componentsJson,
    publishedContent: componentsJson,
    template: template.isHomePage ? 'homepage' : 'custom',
    isPublished: true,
    isDraft: false,
    publishedAt: new Date()
  }
}