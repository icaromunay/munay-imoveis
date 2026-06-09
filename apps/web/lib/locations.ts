export const featuredCities = [
  { slug: 'tijucas', name: 'Tijucas' },
  { slug: 'itapema', name: 'Itapema' },
  { slug: 'porto-belo', name: 'Porto Belo' }
];

export function citySlugToName(slug: string) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
