import { proxyToMarianatek } from './proxy';

export interface Location {
  id: string;
  name: string;
}

/**
 * Fetch locations from Marianatek Admin API
 * 
 * @param mtSubdomain - The Marianatek subdomain
 * @param accessToken - The OAuth access token for Marianatek API
 * @returns Array of locations with id and name
 */
export async function fetchLocationsForTenant(
  mtSubdomain: string,
  accessToken: string
): Promise<Location[]> {
  try {
    // Fetch from Marianatek Admin API
    const response = await proxyToMarianatek('locations/', {
      mtSubdomain,
      audience: 'admin',
      accessToken,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Marianatek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extract locations from JSON:API format
    // Response format: { results: [{ id, name, ... }] } or { data: [{ id, type, attributes: { name, ... } }] }
    let locations: Location[] = [];

    if (data.results && Array.isArray(data.results)) {
      // Standard REST API format
      locations = data.results.map((loc: any) => ({
        id: String(loc.id),
        name: loc.name || 'Unnamed Location',
      }));
    } else if (data.data && Array.isArray(data.data)) {
      // JSON:API format
      locations = data.data.map((item: any) => ({
        id: String(item.id),
        name: item.attributes?.name || item.name || 'Unnamed Location',
      }));
    }

    return locations;
  } catch (error: any) {
    console.error(`[fetchLocationsForTenant] Error fetching locations:`, error);
    throw error;
  }
}


