import FaqItem from '@/components/FaqItem';

// A list of your questions and answers
const faqs = [
  {
    question: "How do I receive payments?",
    answer: "To receive payments, you must first connect your Stripe account from the 'Payments' tab. Once connected, funds from your supporters will be sent directly to your Stripe account balance and paid out to your linked bank account based on your payout schedule."
  },
  {
    question: "What are the fees?",
    answer: "TributeToro charges a 15% + $1 platform fee on each transaction. Our payment processor, Stripe, also charges a standard processing fee (typically 2.9% + $0.30). These fees are automatically deducted from the total amount a supporter pays."
  },
  {
    question: "How do I change my payout schedule?",
    answer: "You can manage your payout schedule directly from your Stripe Express Dashboard. In your TributeToro 'Payments' dashboard, click the 'Manage on Stripe' button to securely log in and adjust your payout settings from daily to weekly, or monthly."
  },
  {
    question: "Is my personal information safe?",
    answer: "Yes. All personal identification and bank account information is handled directly by Stripe, a certified PCI Level 1 Service Provider. This information is never stored on our servers."
  },
  {
    question: "How can I contact support for other issues?",
    answer: "If your question isn't answered here, you can always email us directly. We will get back to you as soon as possible."
  }
];

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">
        Support & FAQ
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Find answers to common questions below.
      </p>
      
      {/* --- THIS IS THE NEW LINE --- */}
      <p className="mb-8 text-gray-600 dark:text-gray-300">
        For further assistance, you can reach us at:{' '}
        <a 
          href="mailto:contact.tributetoro@gmail.com" 
          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          contact.tributetoro@gmail.com
        </a>
      </p>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        {faqs.map((faq, index) => (
          <FaqItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  );
}