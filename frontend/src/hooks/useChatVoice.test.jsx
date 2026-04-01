/**
 * @jest-environment jsdom
 */
import { jsx } from "react/jsx-runtime";
import { renderHook, act } from "@testing-library/react";
import {
  usePushToTalk,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speakChatMessage,
  stopSpeaking,
} from "./useChatVoice";

describe("useChatVoice helpers", () => {
  beforeEach(() => {
    global.SpeechSynthesisUtterance = function MockUtterance(text) {
      this.text = text;
      this.lang = "";
      this.rate = 1;
      this.pitch = 1;
      this.volume = 1;
    };
    window.speechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      resume: jest.fn(),
      getVoices: jest.fn(() => []),
    };
  });

  it("isSpeechSynthesisSupported is true when speechSynthesis exists", () => {
    expect(isSpeechSynthesisSupported()).toBe(true);
  });

  it("speakChatMessage cancels and calls speak with trimmed text", () => {
    speakChatMessage("  hello  ");
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    const utterance = window.speechSynthesis.speak.mock.calls[0][0];
    expect(utterance.text).toBe("hello");
    expect(utterance.lang).toBe("en-US");
  });

  it("speakChatMessage does nothing for empty text", () => {
    speakChatMessage("   ");
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it("stopSpeaking calls cancel", () => {
    stopSpeaking();
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });
});

describe("usePushToTalk", () => {
  let lastRecognition;

  afterEach(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    lastRecognition = null;
    class MockSR {
      constructor() {
        this.continuous = false;
        this.interimResults = false;
        this.lang = "";
        this.start = jest.fn();
        this.stop = jest.fn();
        this.abort = jest.fn();
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
        lastRecognition = this;
      }
    }
    window.SpeechRecognition = MockSR;
    window.webkitSpeechRecognition = MockSR;
  });

  afterEach(() => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
  });

  it("reports supported when SpeechRecognition exists", () => {
    expect(isSpeechRecognitionSupported()).toBe(true);
  });

  it("startListening calls recognition.start", () => {
    const setInput = jest.fn();
    const { result } = renderHook(() =>
      usePushToTalk({
        getInput: () => "",
        setInput,
        logger: { warn: jest.fn() },
      })
    );

    act(() => {
      result.current.onPushStart();
    });

    expect(lastRecognition.start).toHaveBeenCalled();
    expect(result.current.isListening).toBe(true);
  });

  it("onresult updates input with prefix and transcript", () => {
    const setInput = jest.fn();
    const { result } = renderHook(() =>
      usePushToTalk({
        getInput: () => "Hi",
        setInput,
        logger: { warn: jest.fn() },
      })
    );

    act(() => {
      result.current.onPushStart();
    });

    const resultLine = { transcript: "there" };
    const ev = {
      results: {
        length: 1,
        0: {
          0: resultLine,
          length: 1,
        },
      },
    };
    act(() => {
      lastRecognition.onresult(ev);
    });

    expect(setInput).toHaveBeenCalledWith("Hi there");
  });

  it("onPushEnd calls stop when listening", () => {
    const setInput = jest.fn();
    const { result } = renderHook(() =>
      usePushToTalk({
        getInput: () => "",
        setInput,
        logger: { warn: jest.fn() },
      })
    );

    act(() => {
      result.current.onPushStart();
    });
    act(() => {
      result.current.onPushEnd();
    });

    expect(lastRecognition.stop).toHaveBeenCalled();
  });

  it("calls onSessionEnd with full transcript after onend when speech was captured", () => {
    jest.useFakeTimers();
    const setInput = jest.fn();
    const onSessionEnd = jest.fn();
    const { result } = renderHook(() =>
      usePushToTalk({
        getInput: () => "",
        setInput,
        logger: { warn: jest.fn() },
        onSessionEnd,
      })
    );

    act(() => {
      result.current.onPushStart();
    });

    const ev = {
      results: {
        length: 1,
        0: {
          0: { transcript: "hello" },
          length: 1,
        },
      },
    };
    act(() => {
      lastRecognition.onresult(ev);
    });
    act(() => {
      result.current.onPushEnd();
    });
    act(() => {
      lastRecognition.onend();
    });
    act(() => {
      jest.runAllTimers();
    });

    expect(onSessionEnd).toHaveBeenCalledWith("hello");
    jest.useRealTimers();
  });

  it("does not call onSessionEnd when recognition ends without speech", () => {
    jest.useFakeTimers();
    const onSessionEnd = jest.fn();
    const { result } = renderHook(() =>
      usePushToTalk({
        getInput: () => "",
        setInput: jest.fn(),
        logger: { warn: jest.fn() },
        onSessionEnd,
      })
    );

    act(() => {
      result.current.onPushStart();
    });
    act(() => {
      result.current.onPushEnd();
    });
    act(() => {
      lastRecognition.onend();
    });
    act(() => {
      jest.runAllTimers();
    });

    expect(onSessionEnd).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
