// Validation utilities will be added here
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidSlug = (slug: string): boolean => {
  const slugRegex = /^[a-zA-Z0-9-_]+$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
};
