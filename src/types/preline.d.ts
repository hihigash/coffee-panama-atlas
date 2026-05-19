type PrelineStaticMethods = typeof import('preline').HSStaticMethods

export {}

declare global {
  interface Window {
    HSStaticMethods?: PrelineStaticMethods
  }
}
