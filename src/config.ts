export const config = {
  activitiesDataSourceId: "350e8e415bae800fb087000b02929a68",
  leadershipCalendarDataSourceId: "9c957142efe94d76810e679bf1237afc",
  leadershipCalendarDatabaseId: "4a22802c26cc49f8821421a78f85c117",
  leadershipCalendarViewId: "6bf6f3a3b27d469c857ba5c0b3cdc2ae",
  leadershipCalendarViewUrl: "https://www.notion.so/4a22802c26cc49f8821421a78f85c117?v=6bf6f3a3b27d469c857ba5c0b3cdc2ae",
  reportParentPageId: "3dce8e415bae80789eefc6be506cf22d",
  geminiModel: "gemini-3.6-flash",
  geminiEndpoint: "https://generativelanguage.googleapis.com/v1beta/interactions",
  geminiAuthEndpoint: "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1",
  geminiAttemptTimeoutMs: 70_000,
  geminiMaxAttempts: 2,
  geminiRetryDelayMs: 15_000,
} as const
