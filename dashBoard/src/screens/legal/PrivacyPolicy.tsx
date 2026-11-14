import { LegalLayout, LEGAL_EMAIL } from './LegalLayout'

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        Xylozen CRM ("we", "us") is an internal business management application operated by Xylozen
        Technologies. This policy explains what information we handle and how we use it.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>Account details: name, email, phone number, username and role.</li>
        <li>Business data entered in the CRM: clients, projects, invoices, expenses, reports and files.</li>
        <li>Usage and security logs: login activity, actions performed and IP/device information.</li>
      </ul>

      <h2>2. Google user data</h2>
      <p>
        The CRM connects to Google Drive and Google Sheets using an authorised Google account to store
        files and to import client rows from a spreadsheet you link. We access only the files and
        spreadsheets needed for these features. Google data is used solely to provide these features,
        is not sold, is not used for advertising, and is not shared with third parties. Our use of
        information received from Google APIs adheres to the Google API Services User Data Policy,
        including the Limited Use requirements.
      </p>

      <h2>3. How we use information</h2>
      <ul>
        <li>To authenticate users and control access.</li>
        <li>To operate, maintain and improve the CRM.</li>
        <li>To keep records, generate reports and protect against misuse.</li>
      </ul>

      <h2>4. Sharing</h2>
      <p>
        We do not sell personal data. Data is shared only with service providers needed to run the
        application (such as hosting and Google), or when required by law.
      </p>

      <h2>5. Security and retention</h2>
      <p>
        Passwords are stored hashed, access is role-based, and traffic is encrypted in transit. We keep
        data while it is needed for business purposes or legal obligations, then delete it.
      </p>

      <h2>6. Your choices</h2>
      <p>
        You may request access, correction or deletion of your data, or revoke Google access at
        myaccount.google.com/permissions, by contacting us.
      </p>

      <h2>7. Changes</h2>
      <p>We may update this policy; the date above shows the latest revision.</p>

      <h2>8. Contact</h2>
      <p>{LEGAL_EMAIL}</p>
    </LegalLayout>
  )
}
