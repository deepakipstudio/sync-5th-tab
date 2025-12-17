export function useTenant() {
  const tenant = useState<string>('tenant', () => 'demo')
  return { tenant }
}
