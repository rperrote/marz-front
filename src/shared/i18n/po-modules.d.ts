declare module '*.po' {
  type Messages = Record<string, string>
  export const messages: Messages
}
