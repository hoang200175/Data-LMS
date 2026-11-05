import { onRequestGet as __api_feedback_ts_onRequestGet } from "/home/claude/data-lms/functions/api/feedback.ts"
import { onRequestPost as __api_feedback_ts_onRequestPost } from "/home/claude/data-lms/functions/api/feedback.ts"

export const routes = [
    {
      routePath: "/api/feedback",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_feedback_ts_onRequestGet],
    },
  {
      routePath: "/api/feedback",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_feedback_ts_onRequestPost],
    },
  ]