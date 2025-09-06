import FaqItem from '@/components/FaqItem';

// A curated list of the most important questions for new users.
const faqs = [
  {
    question: "What is TributeToro?",
    answer: "TributeToro is a platform that allows content creators to receive financial support from their audience through a simple, elegant 'link-in-bio' style page. You can share your links and accept tips directly from your fans."
  },
  {
    question: "How do I get paid?",
    answer: "We use Stripe, a world-class payment processor, to handle all transactions. You simply connect your Stripe account during setup, and any tips you receive are transferred to your Stripe balance and paid out to your bank account."
  },
  {
    question: "What are the fees?",
    answer: "TributeToro is free to use. We charge a transparent 15% platform fee on each successful transaction, which is added on top of the amount a fan chooses to give. This means you always receive the full intended amount."
  },
  {
    question: "Is it secure?",
    answer: "Absolutely. All payment and personal information is handled directly by Stripe, which is certified to the highest industry standards. We never store your sensitive financial data on our servers."
  }
];

export default function FaqSection() {
  return (
    <div id="faq" className="bg-gray-100 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Have questions? We have answers. If you can't find what you're looking for, feel free to contact us.
          </p>
        </div>
        <div className="mt-12">
          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <FaqItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}