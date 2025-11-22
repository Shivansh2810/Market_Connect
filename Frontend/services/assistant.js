import api from "./axios";

export const sendAssistantQuery = async ({ message, sessionId }) => {
  const payload = {
    message,
    session_id: sessionId,
  };

  const response = await api.post("/assistant/chat", payload);
  return response.data;
};

export const getAssistantCategories = async () => {
  const response = await api.get("/assistant/categories");
  return response.data;
};

export const getAssistantConversation = async (sessionId) => {
  const response = await api.get(`/assistant/sessions/${sessionId}`);
  return response.data;
};
