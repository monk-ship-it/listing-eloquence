import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  /** Recipient first name or full name, optional. */
  name?: string
  /** Plan name the user was on, e.g. "Pro". */
  planName?: string
  /** Human-readable effective cancellation date, e.g. "5 July 2026". */
  effectiveDate?: string
  /** Absolute URL back to the subscription page so they can resubscribe. */
  resubscribeUrl?: string
}

const BRAND = {
  navy: '#101a2e',
  blue: '#3a8ddb',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#e5e7eb',
  surface: '#f6f8fb',
}

const APP_NAME = 'Quill'
const LOGO_URL =
  'https://listing-eloquence.lovable.app/logo.png'

const Email = ({ name, planName, effectiveDate, resubscribeUrl }: Props) => {
  const greeting = name ? `Hi ${name},` : 'Hi there,'
  const plan = planName ? `${planName} plan` : 'subscription'
  const dateText = effectiveDate ?? 'the end of your current billing period'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Your {APP_NAME} subscription has been cancelled — access continues until{' '}
        {dateText}.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={LOGO_URL}
              width="40"
              height="40"
              alt={APP_NAME}
              style={logo}
            />
            <Text style={brandName}>{APP_NAME}</Text>
          </Section>

          <Section style={card}>
            <Heading style={heading}>Subscription cancelled</Heading>
            <Text style={paragraph}>{greeting}</Text>
            <Text style={paragraph}>
              We're confirming that your {APP_NAME} {plan} has been cancelled.
              You won't be charged again.
            </Text>

            <Section style={dateBox}>
              <Text style={dateLabel}>Access continues until</Text>
              <Text style={dateValue}>{dateText}</Text>
            </Section>

            <Text style={paragraph}>
              You'll keep full access to all features until that date. After it
              passes, your account moves to a free state and your saved listings
              remain available to view.
            </Text>

            {resubscribeUrl ? (
              <Text style={paragraph}>
                Changed your mind? You can{' '}
                <Link href={resubscribeUrl} style={link}>
                  reactivate your subscription
                </Link>{' '}
                any time.
              </Text>
            ) : null}

            <Hr style={hr} />
            <Text style={footnote}>
              If you didn't request this cancellation, please contact us at{' '}
              <Link href="mailto:domenico@copybymonk.com" style={link}>
                domenico@copybymonk.com
              </Link>
              .
            </Text>
          </Section>

          <Text style={footer}>
            {APP_NAME} · AI listing copy for UK estate agents
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: ({ effectiveDate }: Props) =>
    effectiveDate
      ? `Your ${APP_NAME} subscription is cancelled — access until ${effectiveDate}`
      : `Your ${APP_NAME} subscription has been cancelled`,
  displayName: 'Subscription cancelled',
  previewData: {
    name: 'Alex',
    planName: 'Pro',
    effectiveDate: '5 July 2026',
    resubscribeUrl: 'https://listing-eloquence.lovable.app/subscription',
  },
} satisfies TemplateEntry

export default Email

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
    "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: '24px 0',
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0 16px',
}

const header: React.CSSProperties = {
  textAlign: 'center',
  padding: '8px 0 20px',
}

const logo: React.CSSProperties = {
  display: 'inline-block',
  verticalAlign: 'middle',
  borderRadius: '8px',
}

const brandName: React.CSSProperties = {
  display: 'inline-block',
  verticalAlign: 'middle',
  margin: '0 0 0 10px',
  fontSize: '20px',
  fontWeight: 700,
  color: BRAND.navy,
  fontFamily: "'Fraunces', Georgia, serif",
}

const card: React.CSSProperties = {
  backgroundColor: BRAND.surface,
  border: `1px solid ${BRAND.border}`,
  borderRadius: '14px',
  padding: '32px',
}

const heading: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: '24px',
  fontWeight: 700,
  color: BRAND.navy,
  fontFamily: "'Fraunces', Georgia, serif",
}

const paragraph: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: '15px',
  lineHeight: '24px',
  color: BRAND.text,
}

const dateBox: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: `1px solid ${BRAND.border}`,
  borderLeft: `4px solid ${BRAND.blue}`,
  borderRadius: '10px',
  padding: '16px 20px',
  margin: '4px 0 20px',
}

const dateLabel: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: BRAND.muted,
}

const dateValue: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: '20px',
  fontWeight: 700,
  color: BRAND.navy,
  fontFamily: "'Fraunces', Georgia, serif",
}

const link: React.CSSProperties = {
  color: BRAND.blue,
  textDecoration: 'underline',
}

const hr: React.CSSProperties = {
  border: 'none',
  borderTop: `1px solid ${BRAND.border}`,
  margin: '24px 0 16px',
}

const footnote: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  lineHeight: '20px',
  color: BRAND.muted,
}

const footer: React.CSSProperties = {
  textAlign: 'center',
  margin: '20px 0 0',
  fontSize: '12px',
  color: BRAND.muted,
}
