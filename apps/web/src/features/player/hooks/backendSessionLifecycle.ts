export type BackendSession = { id: string; token: string };

type CreatedBackendSession = {
  sessionId: string;
  sessionToken: string;
};

export function claimCreatedBackendSession(
  createdSession: CreatedBackendSession,
  isCurrentLaunch: boolean,
  release: (session: BackendSession) => unknown,
) {
  const session = {
    id: createdSession.sessionId,
    token: createdSession.sessionToken,
  };

  if (!isCurrentLaunch) {
    release(session);
    return null;
  }

  return session;
}
