'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FAQItem as FAQData } from '@/data/help-center/faq-data';

interface FAQItemProps {
  faq: FAQData;
  className?: string;
  defaultOpen?: boolean;
}

export function FAQItem({ faq, className, defaultOpen = false }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn(
      "border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden",
      "bg-white dark:bg-gray-800",
      className
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-6 py-4 text-left flex items-center justify-between",
          "hover:bg-gray-50 dark:hover:bg-gray-700/50",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
          "transition-colors duration-200"
        )}
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white pr-4">
          {faq.question}
        </h3>
        <div className={cn(
          "flex-shrink-0 transition-transform duration-200",
          isOpen ? "transform rotate-180" : ""
        )}>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-6 pb-4">
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {faq.answer}
            </p>
            
            {/* Tags */}
            {faq.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {faq.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para lista de FAQs
interface FAQListProps {
  faqs: FAQData[];
  className?: string;
  showCategory?: boolean;
}

export function FAQList({ faqs, className, showCategory = false }: FAQListProps) {
  if (faqs.length === 0) {
    return (
      <div className={cn(
        "text-center py-12",
        className
      )}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No se encontraron preguntas
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Intenta con otros términos de búsqueda o explora las categorías.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {faqs.map((faq) => (
        <div key={faq.id}>
          {showCategory && (
            <div className="mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {faq.category}
              </span>
            </div>
          )}
          <FAQItem faq={faq} />
        </div>
      ))}
    </div>
  );
}