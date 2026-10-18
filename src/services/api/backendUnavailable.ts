export function backendUnavailable(domain: string): never {
  throw new Error(`${domain} backend integration is not implemented in this frontend.`);
}
