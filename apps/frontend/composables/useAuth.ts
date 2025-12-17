export function useAuth() {
  const role = useState<'admin'|'customer'|null>('role', () => null)
  const tenant = useState<string|null>('tenant', () => null)
  const userId = useState<string|null>('userId', () => null)
  const preferredLocationId = useState<string|undefined>('preferredLocationId')
  return { role, tenant, userId, preferredLocationId }
}
