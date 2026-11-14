import { LegalLayout, LEGAL_EMAIL } from './LegalLayout'

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service">
      <p>
        By accessing or using Xylozen CRM ("the Service"), operated by Xylozen Technologies, you agree
        to these terms. If you do not agree, do not use the Service.
      </p>

      <h2>1. Access</h2>
      <p>
        The Service is for authorised users only. Accounts are issued by an administrator. You are
        responsible for keeping your credentials confidential and for all activity under your account.
      </p>

      <h2>2. Acceptable use</h2>
      <ul>
        <li>Use the Service only for legitimate business purposes.</li>
        <li>Do not attempt to access data or features you are not permitted to use.</li>
        <li>Do not disrupt, reverse engineer or misuse the Service or its integrations.</li>
      </ul>

      <h2>3. Your data</h2>
      <p>
        You retain ownership of the data you enter. You grant us the right to store and process it to
        provide the Service. See our Privacy Policy for details.
      </p>

      <h2>4. Third-party services</h2>
      <p>
        The Service integrates with third parties such as Google Drive and Google Sheets. Your use of
        those services is subject to their own terms.
      </p>

      <h2>5. Availability and changes</h2>
      <p>
        The Service is provided "as is" without warranties. We may modify, suspend or discontinue
        features at any time.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        To the extent permitted by law, Xylozen Technologies is not liable for indirect or
        consequential losses arising from use of the Service.
      </p>

      <h2>7. Termination</h2>
      <p>We may suspend or terminate access at any time for breach of these terms.</p>

      <h2>8. Changes and contact</h2>
      <p>We may update these terms. Questions: {LEGAL_EMAIL}</p>
    </LegalLayout>
  )
}
