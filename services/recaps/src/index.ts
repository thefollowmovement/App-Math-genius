export { adviceFacts, mostSkippedWeekday, standardAdvice } from './advice';
export {
  deliverRecap,
  gatewayCoach,
  localDate,
  monthAdvice,
  readDelivery,
  recapPdfLink,
  unsubscribedText,
  type Coach,
  type DeliveryDeps,
  type DeliveryResult,
  type DeliveryStore,
  type RecapDelivery,
  type Recipient,
  type ServerRpc,
} from './deliver';
export { monthlyEmail, weeklyEmail, type EmailLinks, type RenderedEmail } from './email';
export { shownMistake, type ShownMistake } from './examples';
export { monthlyPdf } from './pdf/monthly';
export { resendMailer, toBase64, type Mailer, type OutgoingEmail } from './resend';
export { RECAPS_BUCKET, pdfPath, supabaseStorage, type Storage } from './storage';
export { fr, textsFor, type RecapTexts } from './texts';
