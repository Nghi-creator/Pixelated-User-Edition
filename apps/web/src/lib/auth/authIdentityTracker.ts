export type AuthIdentity = string | null;

export function createAuthIdentityTracker(onIdentityChange: () => void) {
  let currentIdentity: AuthIdentity | undefined;

  return (nextIdentity: AuthIdentity) => {
    if (currentIdentity === undefined) {
      currentIdentity = nextIdentity;
      return false;
    }
    if (currentIdentity === nextIdentity) return false;

    currentIdentity = nextIdentity;
    onIdentityChange();
    return true;
  };
}
