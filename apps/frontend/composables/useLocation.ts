export function useLocation() {
  const preferredLocationId = useState<string|undefined>('preferredLocationId')
  return { preferredLocationId }
}
