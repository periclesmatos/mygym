import { createContext, useContext } from 'react'

export const FeedbackContext = createContext(null)

/** Toasts e confirmações; o provedor fica em Feedback.jsx. */
export function useFeedback() {
  return useContext(FeedbackContext)
}
