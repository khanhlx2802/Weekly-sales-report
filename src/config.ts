export const config = {
  activitiesDataSourceId: "c38e8e415bae82c6ad01874268008095",
  reportParentPageId: "3dce8e415bae80789eefc6be506cf22d",
  geminiModel: "gemini-3.6-flash",
  geminiEndpoint: "https://generativelanguage.googleapis.com/v1beta/interactions",
  geminiAuthEndpoint: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1",
  geminiMaxAttempts: 2,
  geminiAttemptTimeoutMs: 70_000,
  geminiRetryDelayMs: 5_000,
} as const
