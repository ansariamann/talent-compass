let authToken: string | null = null;

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string): void {
  authToken = token;
}

export function clearAuthToken(): void {
  authToken = null;
}
