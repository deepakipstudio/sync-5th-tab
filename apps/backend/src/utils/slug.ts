import { prisma } from '../prisma';

/**
 * Generate a URL-friendly slug from a name
 * Converts to lowercase, replaces spaces and special chars with hyphens
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Ensure slug is unique per tenant, excluding soft-deleted categories
 * Auto-appends numbers for duplicates (e.g., category-name-2)
 * @returns Object with final slug and wasModified flag
 */
export async function ensureUniqueSlug(
  slug: string,
  tenantId: string,
  excludeId?: string
): Promise<{ slug: string; wasModified: boolean }> {
  let finalSlug = slug;
  let wasModified = false;
  let counter = 1;

  while (true) {
    const existing = await prisma.category.findFirst({
      where: {
        tenantId,
        slug: finalSlug,
        deletedAt: null, // Exclude soft-deleted categories
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (!existing) {
      break;
    }

    // Slug exists, append counter
    wasModified = true;
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  return { slug: finalSlug, wasModified };
}

/**
 * Rewrite slug for soft delete by appending timestamp
 * Format: original-slug-deleted-{timestamp}
 * This frees up the original slug for reuse
 */
export function rewriteSlugForSoftDelete(slug: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  return `${slug}-deleted-${timestamp}`;
}

