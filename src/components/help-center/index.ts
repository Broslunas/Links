// Exportar componentes
export { SearchBox } from './SearchBox';
export { CategoryCard } from './CategoryCard';
export { FAQItem, FAQList } from './FAQItem';
export { GuideCard, GuideList } from './GuideCard';

// Re-exportar tipos de datos
export type {
  FAQItem as FAQItemType,
  HelpCategory,
  Guide,
  GuideStep
} from '@/data/help-center/faq-data';

// Re-exportar funciones de utilidad
export {
  searchFAQ,
  getFAQByCategory,
  getGuidesByCategory,
  helpCategories,
  faqData,
  guides
} from '@/data/help-center/faq-data';