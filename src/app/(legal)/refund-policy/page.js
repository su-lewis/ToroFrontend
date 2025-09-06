export const metadata = {
  title: 'Refund Policy',
};

export default function RefundPolicyPage() {
  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="prose prose-invert mx-auto">
          <h1>TributeToro Refund Policy</h1>
          <p className="lead">VERSION 1.1 | LAST REVISED ON: [Date, e.g., JUNE 01, 2024]</p>

          <h2>1. Our Philosophy on Support</h2>
          <p>At TributeToro, we are committed to fostering a community where financial contributions are recognized as direct and voluntary acts of support for creators. This Refund Policy is designed to be clear and fair, protecting both the supporter and the creator. By making a payment on TributeToro, you acknowledge and agree to the terms of this policy.</p>

          <div className="py-4" />
          <h2>2. One-Time Gifts Are Final and Non-Refundable</h2>
          <p>All one-time payments, referred to as "tips" or "gifts," made to a creator through the TributeToro platform are considered final and are <strong>non-refundable</strong>.</p>
          <p>These contributions are not transactions for goods or services. They are voluntary gestures of appreciation and support. This policy is essential to protect creators from the potential for fraud and the abuse of financial systems like chargebacks.</p>

          <div className="py-4" />
          <h2>3. Exceptions to the Policy</h2>
          <p>While our policy is firm, there are two specific exceptions:</p>
          <ul>
            <li><strong>Refunds Issued by the Creator:</strong> A creator may choose to issue a refund at their sole discretion. Supporters who wish to request a refund must contact the creator directly to discuss the matter. Please note that a creator can only process a refund if the funds have not yet been paid out from their Stripe balance to their bank account. TributeToro does not mediate these refund requests between supporters and creators.</li>
            <li><strong>Confirmed Fraudulent Activity:</strong> In clear and evident cases of fraudulent transactions (e.g., unauthorized use of a credit card), TributeToro will investigate the claim. If fraud is confirmed, we will intervene to reverse the transaction.</li>
          </ul>

          <div className="py-4" />
          <h2>4. A Note on Chargebacks</h2>
          <p>Initiating a chargeback through your bank or payment provider for a completed one-time gift is a violation of our Terms of Service. A "chargeback" is the reversal of a payment made on your card by your bank.</p>
          <p>Unless a chargeback is initiated for a legitimate case of unauthorized card use, it will be considered an invalid attempt to bypass this Refund Policy. We will actively dispute fraudulent chargebacks and reserve the right to suspend or terminate the accounts of any user who misuses this process.</p>
          
          <div className="py-4" />
          <h2>5. Policy Changes</h2>
          <p>TributeToro reserves the right to modify this Refund Policy at any time. Any changes will be effective immediately upon being posted on our Site. Your continued use of the Service after such changes constitutes your acceptance of the new policy.</p>
          
          <div className="py-4" />
          <h2>6. Contact Us</h2>
          <p>If you have questions regarding this Refund Policy, please contact our support team at <a href="mailto:contact.tributetoro@gmail.com">contact.tributetoro@gmail.com</a>.</p>
        </div>
      </div>
    </div>
  );
}