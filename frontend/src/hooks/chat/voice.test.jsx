import {
  usePushToTalk,
  isSpeechSynthesisSupported,
  speakChatMessage,
  stopSpeaking,
} from "./voice";

describe("hooks/chat/voice re-exports", () => {
  it("re-exports useChatVoice members", () => {
    expect(typeof usePushToTalk).toBe("function");
    expect(typeof isSpeechSynthesisSupported).toBe("function");
    expect(typeof speakChatMessage).toBe("function");
    expect(typeof stopSpeaking).toBe("function");
  });
});
