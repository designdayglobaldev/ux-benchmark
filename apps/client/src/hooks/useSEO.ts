import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
}

export function useSEO({ title, description, image }: SEOProps) {
  useEffect(() => {
    // Update title
    document.title = `${title} | BenchmarX`;

    // Update meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    }

    // Update Open Graph tags (optional but good for SEO)
    const updateOgTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateOgTag('og:title', title);
    if (description) updateOgTag('og:description', description);
    if (image) updateOgTag('og:image', image);

    // Cleanup function not strictly necessary for SPAs unless we want to revert,
    // but usually, it's fine to leave them for the next route to overwrite.
  }, [title, description, image]);
}
