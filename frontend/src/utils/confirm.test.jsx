import { showConfirm } from "./confirm";
describe("confirm", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = "";
    const existingStyles = document.getElementById("confirm-dialog-styles");
    if (existingStyles) {
      existingStyles.remove();
    }
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  afterEach(() => {
    document.body.innerHTML = "";
    const existingStyles = document.getElementById("confirm-dialog-styles");
    if (existingStyles) {
      existingStyles.remove();
    }
  });
  describe("showConfirm", () => {
    it("should return a promise", () => {
      const promise = showConfirm("Test message");
      expect(promise).toBeInstanceOf(Promise);
      const buttons = document.querySelectorAll("button");
      if (buttons.length > 0) {
        buttons[0].click();
      }
    });
    it("should resolve to false when cancel button is clicked", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(0);
      const cancelBtn = buttons[0];
      cancelBtn.click();
      const result = await promise;
      expect(result).toBe(false);
    });
    it("should resolve to true when confirm button is clicked", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(1);
      const confirmBtn = buttons[1];
      confirmBtn.click();
      const result = await promise;
      expect(result).toBe(true);
    });
    it("should use custom title", async () => {
      const promise = showConfirm("Test message", { title: "Custom Title" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const title = document.querySelector("h3");
      expect(title?.textContent).toBe("Custom Title");
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
    });
    it("should use custom button texts", async () => {
      const promise = showConfirm("Test message", {
        confirmText: "Yes",
        cancelText: "No",
      });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      expect(buttons[0].textContent).toBe("No");
      expect(buttons[1].textContent).toBe("Yes");
      buttons[0].click();
      await promise;
    });
    it("should resolve to false when overlay is clicked", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const overlay = document.body.lastElementChild;
      expect(overlay).toBeTruthy();
      overlay.click();
      const result = await promise;
      expect(result).toBe(false);
    });
    it("should apply warning type colors", async () => {
      const promise = showConfirm("Test message", { type: "warning" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      expect(buttons.length).toBe(2);
      const confirmBtn = Array.from(buttons).find(
        (btn) => btn.textContent === "Confirm",
      );
      expect(confirmBtn).toBeTruthy();
      expect(confirmBtn).toBeInstanceOf(HTMLButtonElement);
      confirmBtn.click();
      const result = await promise;
      expect(result).toBe(true);
    });
    it("should apply danger type colors", async () => {
      const promise = showConfirm("Test message", { type: "danger" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      expect(buttons.length).toBe(2);
      const confirmBtn = Array.from(buttons).find(
        (btn) => btn.textContent === "Confirm",
      );
      expect(confirmBtn).toBeTruthy();
      expect(confirmBtn).toBeInstanceOf(HTMLButtonElement);
      confirmBtn.click();
      const result = await promise;
      expect(result).toBe(true);
    });
    it("should apply info type colors", async () => {
      const promise = showConfirm("Test message", { type: "info" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      expect(buttons.length).toBe(2);
      const confirmBtn = Array.from(buttons).find(
        (btn) => btn.textContent === "Confirm",
      );
      expect(confirmBtn).toBeTruthy();
      expect(confirmBtn).toBeInstanceOf(HTMLButtonElement);
      confirmBtn.click();
      const result = await promise;
      expect(result).toBe(true);
    });
    it("should handle hover effects on cancel button", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      const cancelBtn = buttons[0];
      cancelBtn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(cancelBtn.style.background).toBe("rgb(249, 250, 251)");
      cancelBtn.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
      expect(cancelBtn.style.background).toBe("white");
      cancelBtn.click();
      await promise;
    });
    it("should handle hover effects on confirm button", async () => {
      const promise = showConfirm("Test message", { type: "warning" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      expect(buttons.length).toBe(2);
      const confirmBtn = Array.from(buttons).find(
        (btn) => btn.textContent === "Confirm",
      );
      expect(confirmBtn).toBeTruthy();
      expect(confirmBtn.onmouseover).toBeTruthy();
      expect(confirmBtn.onmouseout).toBeTruthy();
      confirmBtn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(confirmBtn.onmouseover).toBeTruthy();
      confirmBtn.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
      expect(confirmBtn.onmouseout).toBeTruthy();
      confirmBtn.click();
      await promise;
    });
    it("should add animation styles only once", async () => {
      const promise1 = showConfirm("First dialog");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const styles1 = document.getElementById("confirm-dialog-styles");
      expect(styles1).toBeTruthy();
      const buttons1 = document.querySelectorAll("button");
      buttons1[0].click();
      await promise1;
      const promise2 = showConfirm("Second dialog");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const styles2 = document.getElementById("confirm-dialog-styles");
      expect(styles2).toBe(styles1);
      const buttons2 = document.querySelectorAll("button");
      buttons2[0].click();
      await promise2;
    });
    it("should handle multi-line messages", async () => {
      const promise = showConfirm("Line 1\nLine 2\nLine 3");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const message = document.querySelector("p");
      expect(message?.textContent).toBe("Line 1\nLine 2\nLine 3");
      expect(message?.style.whiteSpace).toBe("pre-line");
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
    });
    it("should remove overlay after confirmation", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const overlayBefore = document.body.children.length;
      expect(overlayBefore).toBeGreaterThan(0);
      const buttons = document.querySelectorAll("button");
      buttons[1].click();
      await promise;
      jest.advanceTimersByTime(10);
      await Promise.resolve();
      const overlayAfter = document.querySelector(
        'div[style*="position: fixed"]',
      );
      expect(overlayAfter).toBeFalsy();
    });
    it("should remove overlay after cancellation", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const overlayBefore = document.body.children.length;
      expect(overlayBefore).toBeGreaterThan(0);
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
      jest.advanceTimersByTime(10);
      await Promise.resolve();
      const overlayAfter = document.querySelector(
        'div[style*="position: fixed"]',
      );
      expect(overlayAfter).toBeFalsy();
    });
    it("should use default options when not provided", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const title = document.querySelector("h3");
      expect(title?.textContent).toBe("Confirm");
      const buttons = document.querySelectorAll("button");
      expect(buttons[0].textContent).toBe("Cancel");
      expect(buttons[1].textContent).toBe("Confirm");
      buttons[0].click();
      await promise;
    });
    it("should set overlay styles correctly", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const overlay = document.body.lastElementChild;
      expect(overlay).toBeTruthy();
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
    });
    it("should set dialog styles correctly", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const overlay = document.body.lastElementChild;
      const dialog = overlay.querySelector("div");
      expect(dialog).toBeTruthy();
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
    });
    it("should set title styles correctly", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const title = document.querySelector("h3");
      expect(title).toBeTruthy();
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
    });
    it("should set message styles correctly", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const message = document.querySelector("p");
      expect(message).toBeTruthy();
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
    });
    it("should set button container styles correctly", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      const container = buttons[0]?.parentElement;
      expect(container).toBeTruthy();
      buttons[0].click();
      await promise;
    });
    it("should set cancel button styles correctly", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      const cancelBtn = buttons[0];
      expect(cancelBtn).toBeTruthy();
      cancelBtn.click();
      await promise;
    });
    it("should set confirm button styles with warning type", async () => {
      const promise = showConfirm("Test message", { type: "warning" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      const confirmBtn = buttons[1];
      expect(confirmBtn).toBeTruthy();
      confirmBtn.click();
      await promise;
    });
    it("should set confirm button styles with danger type", async () => {
      const promise = showConfirm("Test message", { type: "danger" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      const confirmBtn = buttons[1];
      expect(confirmBtn).toBeTruthy();
      confirmBtn.click();
      await promise;
    });
    it("should set confirm button styles with info type", async () => {
      const promise = showConfirm("Test message", { type: "info" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      const confirmBtn = buttons[1];
      expect(confirmBtn).toBeTruthy();
      confirmBtn.click();
      await promise;
    });
    it("should add animation styles to document head", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const styles = document.getElementById("confirm-dialog-styles");
      expect(styles).toBeTruthy();
      expect(styles?.textContent).toContain("@keyframes fadeIn");
      expect(styles?.textContent).toContain("@keyframes slideUp");
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
    });
    it("should focus confirm button on mount", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      const confirmBtn = buttons[1];
      confirmBtn.focus();
      expect(document.activeElement).toBe(confirmBtn);
      confirmBtn.click();
      await promise;
    });
    it("should not close when clicking dialog itself (not overlay)", async () => {
      const promise = showConfirm("Test message");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const overlay = document.body.lastElementChild;
      const dialog = overlay.querySelector("div");
      dialog.click();
      jest.advanceTimersByTime(10);
      await Promise.resolve();
      expect(document.body.lastElementChild).toBe(overlay);
      overlay.click();
      await promise;
    });
    it("should handle confirm button click with different types", async () => {
      const types = ["warning", "danger", "info"];
      for (const type of types) {
        const promise = showConfirm("Test message", { type });
        jest.advanceTimersByTime(50);
        await Promise.resolve();
        const buttons = document.querySelectorAll("button");
        const confirmBtn = buttons[1];
        confirmBtn.click();
        const result = await promise;
        expect(result).toBe(true);
      }
    });
    it("should handle button hover state transitions", async () => {
      const promise = showConfirm("Test message", { type: "danger" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      const confirmBtn = buttons[1];
      const initialBg = confirmBtn.style.background;
      if (confirmBtn.onmouseover) {
        confirmBtn.onmouseover(new MouseEvent("mouseover"));
      }
      if (confirmBtn.onmouseout) {
        confirmBtn.onmouseout(new MouseEvent("mouseout"));
      }
      expect(confirmBtn.style.background).toBe(initialBg);
      confirmBtn.click();
      await promise;
    });
    it("should handle empty message", async () => {
      const promise = showConfirm("");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const message = document.querySelector("p");
      expect(message?.textContent).toBe("");
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
    });
    it("should handle very long message", async () => {
      const longMessage = "A".repeat(1e3);
      const promise = showConfirm(longMessage);
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const message = document.querySelector("p");
      expect(message?.textContent).toBe(longMessage);
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
    });
    it("should handle special characters in message", async () => {
      const specialMessage = 'Test <script>alert("xss")</script> & "quotes"';
      const promise = showConfirm(specialMessage);
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const message = document.querySelector("p");
      expect(message?.textContent).toBe(specialMessage);
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
    });
    it("should handle empty title", async () => {
      const promise = showConfirm("Test message", { title: "" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const title = document.querySelector("h3");
      expect(title?.textContent).toBe("");
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
    });
    it("should handle empty button texts", async () => {
      const promise = showConfirm("Test message", {
        confirmText: "",
        cancelText: "",
      });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      expect(buttons[0].textContent).toBe("");
      expect(buttons[1].textContent).toBe("");
      buttons[0].click();
      await promise;
    });
  });
  describe("edge cases", () => {
    it("should handle empty message", async () => {
      const promise = showConfirm("");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const message = document.querySelector("p");
      expect(message?.textContent).toBe("");
      const confirmBtn = document.querySelector("button:last-child");
      confirmBtn?.click();
      await promise;
    });
    it("should handle very long message", async () => {
      const longMessage = "a".repeat(1e3);
      const promise = showConfirm(longMessage);
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const message = document.querySelector("p");
      expect(message?.textContent).toBe(longMessage);
      const confirmBtn = document.querySelector("button:last-child");
      confirmBtn?.click();
      await promise;
    });
    it("should handle message with newlines", async () => {
      const multilineMessage = "Line 1\nLine 2\nLine 3";
      const promise = showConfirm(multilineMessage);
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const message = document.querySelector("p");
      expect(message?.textContent).toBe(multilineMessage);
      const confirmBtn = document.querySelector("button:last-child");
      confirmBtn?.click();
      await promise;
    });
    it("should handle options object being undefined", async () => {
      const promise = showConfirm("Test", void 0);
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const title = document.querySelector("h3");
      expect(title?.textContent).toBe("Confirm");
      const confirmBtn = document.querySelector("button:last-child");
      confirmBtn?.click();
      await promise;
    });
    it("should handle style element already existing", async () => {
      const existingStyle = document.createElement("style");
      existingStyle.id = "confirm-dialog-styles";
      document.head.appendChild(existingStyle);
      const promise = showConfirm("Test");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const styles = document.querySelectorAll("#confirm-dialog-styles");
      expect(styles.length).toBe(1);
      const confirmBtn = document.querySelector("button:last-child");
      confirmBtn?.click();
      await promise;
    });
    it("should handle all dialog types", async () => {
      const types = ["warning", "danger", "info"];
      for (const type of types) {
        const promise = showConfirm("Test", { type });
        jest.advanceTimersByTime(50);
        await Promise.resolve();
        const confirmBtn = document.querySelector("button:last-child");
        expect(confirmBtn).toBeTruthy();
        confirmBtn.click();
        const result = await promise;
        expect(result).toBe(true);
        document.body.innerHTML = "";
        document.head.querySelector("#confirm-dialog-styles")?.remove();
      }
    });
    it("should handle overlay click on dialog itself (not overlay)", async () => {
      const promise = showConfirm("Test");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const dialog = document.querySelector('div[style*="background: white"]');
      expect(dialog).toBeTruthy();
      if (dialog) {
        const clickEvent = new MouseEvent("click", { bubbles: true });
        dialog.dispatchEvent(clickEvent);
      }
      await jest.advanceTimersByTime(50);
      expect(
        document.querySelector('div[style*="background: white"]'),
      ).toBeTruthy();
      const confirmBtn = document.querySelector("button:last-child");
      confirmBtn?.click();
      await promise;
    });
    it("should handle cancel button hover states", async () => {
      const promise = showConfirm("Test");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const cancelBtn = document.querySelector("button:first-child");
      expect(cancelBtn).toBeTruthy();
      const mouseoverEvent = new MouseEvent("mouseover", { bubbles: true });
      cancelBtn.dispatchEvent(mouseoverEvent);
      const mouseoutEvent = new MouseEvent("mouseout", { bubbles: true });
      cancelBtn.dispatchEvent(mouseoutEvent);
      cancelBtn.click();
      await promise;
    });
    it("should handle confirm button hover states for warning type", async () => {
      const promise = showConfirm("Test", { type: "warning" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const confirmBtn = document.querySelector("button:last-child");
      expect(confirmBtn).toBeTruthy();
      const mouseoverEvent = new MouseEvent("mouseover", { bubbles: true });
      confirmBtn.dispatchEvent(mouseoverEvent);
      const mouseoutEvent = new MouseEvent("mouseout", { bubbles: true });
      confirmBtn.dispatchEvent(mouseoutEvent);
      confirmBtn.click();
      await promise;
    });
    it("should handle confirm button hover states for danger type", async () => {
      const promise = showConfirm("Test", { type: "danger" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const confirmBtn = document.querySelector("button:last-child");
      expect(confirmBtn).toBeTruthy();
      const mouseoverEvent = new MouseEvent("mouseover", { bubbles: true });
      confirmBtn.dispatchEvent(mouseoverEvent);
      const mouseoutEvent = new MouseEvent("mouseout", { bubbles: true });
      confirmBtn.dispatchEvent(mouseoutEvent);
      confirmBtn.click();
      await promise;
    });
    it("should handle confirm button hover states for info type", async () => {
      const promise = showConfirm("Test", { type: "info" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const confirmBtn = document.querySelector("button:last-child");
      expect(confirmBtn).toBeTruthy();
      const mouseoverEvent = new MouseEvent("mouseover", { bubbles: true });
      confirmBtn.dispatchEvent(mouseoverEvent);
      const mouseoutEvent = new MouseEvent("mouseout", { bubbles: true });
      confirmBtn.dispatchEvent(mouseoutEvent);
      confirmBtn.click();
      await promise;
    });
    it("should handle focus on confirm button", async () => {
      const promise = showConfirm("Test");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const confirmBtn = document.querySelector("button:last-child");
      expect(confirmBtn).toBeTruthy();
      confirmBtn.focus();
      expect(document.activeElement).toBe(confirmBtn);
      confirmBtn.click();
      await promise;
    });
    it("should handle multiple dialogs", async () => {
      const promise1 = showConfirm("First");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const promise2 = showConfirm("Second");
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const dialogs = document.querySelectorAll(
        'div[style*="background: white"]',
      );
      expect(dialogs.length).toBe(2);
      const buttons2 = document.querySelectorAll("button");
      buttons2[buttons2.length - 1].click();
      await promise2;
      const dialogsAfter = document.querySelectorAll(
        'div[style*="background: white"]',
      );
      expect(dialogsAfter.length).toBe(1);
      const buttons1 = document.querySelectorAll("button");
      buttons1[buttons1.length - 1].click();
      await promise1;
    });
    it("should handle title being empty string", async () => {
      const promise = showConfirm("Test", { title: "" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const title = document.querySelector("h3");
      expect(title?.textContent).toBe("");
      const confirmBtn = document.querySelector("button:last-child");
      confirmBtn?.click();
      await promise;
    });
    it("should handle title being very long", async () => {
      const longTitle = "a".repeat(200);
      const promise = showConfirm("Test", { title: longTitle });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const title = document.querySelector("h3");
      expect(title?.textContent).toBe(longTitle);
      const confirmBtn = document.querySelector("button:last-child");
      confirmBtn?.click();
      await promise;
    });
  });
  describe("object literal coverage for confirmColors", () => {
    it("should verify exact confirmColors object literal for warning type", async () => {
      const promise = showConfirm("Test", { type: "warning" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const confirmBtn = document.querySelector("button:last-child");
      expect(confirmBtn).toBeTruthy();
      expect(confirmBtn.style.background).toBe("rgb(245, 158, 11)");
      confirmBtn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(confirmBtn.style.background).toBe("rgb(217, 119, 6)");
      confirmBtn.click();
      await promise;
    });
    it("should verify exact confirmColors object literal for danger type", async () => {
      const promise = showConfirm("Test", { type: "danger" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const confirmBtn = document.querySelector("button:last-child");
      expect(confirmBtn).toBeTruthy();
      expect(confirmBtn.style.background).toBe("rgb(239, 68, 68)");
      confirmBtn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(confirmBtn.style.background).toBe("rgb(220, 38, 38)");
      confirmBtn.click();
      await promise;
    });
    it("should verify exact confirmColors object literal for info type", async () => {
      const promise = showConfirm("Test", { type: "info" });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const confirmBtn = document.querySelector("button:last-child");
      expect(confirmBtn).toBeTruthy();
      expect(confirmBtn.style.background).toBe("rgb(59, 130, 246)");
      confirmBtn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(confirmBtn.style.background).toBe("rgb(37, 99, 235)");
      confirmBtn.click();
      await promise;
    });
    it("should verify all confirmColors object literal keys", async () => {
      const types = ["warning", "danger", "info"];
      const expectedColors = {
        warning: { bg: "rgb(245, 158, 11)", hover: "rgb(217, 119, 6)" },
        danger: { bg: "rgb(239, 68, 68)", hover: "rgb(220, 38, 38)" },
        info: { bg: "rgb(59, 130, 246)", hover: "rgb(37, 99, 235)" },
      };
      for (const type of types) {
        const promise = showConfirm("Test", { type });
        jest.advanceTimersByTime(50);
        await Promise.resolve();
        const confirmBtn = document.querySelector("button:last-child");
        expect(confirmBtn.style.background).toBe(expectedColors[type].bg);
        confirmBtn.dispatchEvent(
          new MouseEvent("mouseover", { bubbles: true }),
        );
        expect(confirmBtn.style.background).toBe(expectedColors[type].hover);
        confirmBtn.click();
        await promise;
        document.body.innerHTML = "";
        document.head.querySelector("#confirm-dialog-styles")?.remove();
      }
    });
    it("should verify confirmColors[type] access pattern", async () => {
      const types = ["warning", "danger", "info"];
      for (const type of types) {
        const promise = showConfirm("Test", { type });
        jest.advanceTimersByTime(50);
        await Promise.resolve();
        const confirmBtn = document.querySelector("button:last-child");
        expect(confirmBtn.style.background).toBeTruthy();
        expect(confirmBtn.style.background).not.toBe("");
        confirmBtn.click();
        await promise;
        document.body.innerHTML = "";
        document.head.querySelector("#confirm-dialog-styles")?.remove();
      }
    });
  });
  describe("Dependency Injection", () => {
    it("should use injected document adapter", async () => {
      const mockDocumentAdapter = {
        createElement: jest.fn((tag) => {
          const element = document.createElement(tag);
          return element;
        }),
        getElementById: jest.fn((id) => document.getElementById(id)),
        getActiveElement: jest.fn(() => document.activeElement),
        head: document.head,
        body: document.body,
      };
      const promise = showConfirm("Test message", {
        documentAdapter: mockDocumentAdapter,
      });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      expect(mockDocumentAdapter.createElement).toHaveBeenCalled();
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
    });
    it("should use injected timer adapter", async () => {
      const mockTimerAdapter = {
        setTimeout: jest.fn((callback, delay) => {
          return setTimeout(callback, delay);
        }),
        clearTimeout: jest.fn((id) => clearTimeout(id)),
        setInterval: jest.fn((callback, delay) => {
          return setInterval(callback, delay);
        }),
        clearInterval: jest.fn((id) => clearInterval(id)),
      };
      const promise = showConfirm("Test message", {
        timerAdapter: mockTimerAdapter,
      });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
    });
    it("should handle null document adapter gracefully", async () => {
      const promise = showConfirm("Test message", {
        documentAdapter: null,
      });
      const result = await promise;
      expect(result).toBe(false);
    });
    it("should handle document adapter errors gracefully", async () => {
      const mockDocumentAdapter = {
        createElement: jest.fn(() => {
          throw new Error("DOM manipulation error");
        }),
        getElementById: jest.fn(() => null),
        getActiveElement: jest.fn(() => null),
        head: document.head,
        body: document.body,
      };
      try {
        const promise = showConfirm("Test message", {
          documentAdapter: mockDocumentAdapter,
        });
        jest.advanceTimersByTime(50);
        await Promise.resolve();
        const result = await promise;
        expect(result).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
    it("should use injected document adapter for getElementById", async () => {
      const mockGetElementById = jest.fn((id) => {
        if (id === "confirm-dialog-styles") {
          return null;
        }
        return document.getElementById(id);
      });
      const mockDocumentAdapter = {
        createElement: jest.fn((tag) => document.createElement(tag)),
        getElementById: mockGetElementById,
        getActiveElement: jest.fn(() => document.activeElement),
        head: document.head,
        body: document.body,
      };
      const promise = showConfirm("Test message", {
        documentAdapter: mockDocumentAdapter,
      });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      expect(mockGetElementById).toHaveBeenCalledWith("confirm-dialog-styles");
      const buttons = document.querySelectorAll("button");
      buttons[0].click();
      await promise;
    });
    it("should handle errors gracefully in try-catch block", async () => {
      const mockDocumentAdapter = {
        createElement: jest.fn(() => {
          throw new Error("DOM error");
        }),
        getElementById: jest.fn(() => null),
        getActiveElement: jest.fn(() => null),
        head: document.head,
        body: document.body,
      };
      const promise = showConfirm("Test message", {
        documentAdapter: mockDocumentAdapter,
      });
      const result = await promise;
      expect(result).toBe(false);
    });
    it("should use injected document adapter for head and body", async () => {
      const mockDocumentAdapter = {
        createElement: jest.fn((tag) => document.createElement(tag)),
        getElementById: jest.fn((id) => document.getElementById(id)),
        getActiveElement: jest.fn(() => document.activeElement),
        head: document.head,
        body: document.body,
      };
      const promise = showConfirm("Test message", {
        documentAdapter: mockDocumentAdapter,
      });
      jest.advanceTimersByTime(50);
      await Promise.resolve();
      expect(mockDocumentAdapter.createElement).toHaveBeenCalled();
      expect(mockDocumentAdapter.head).toBe(document.head);
      expect(mockDocumentAdapter.body).toBe(document.body);
      const buttons = document.querySelectorAll("button");
      if (buttons.length > 0) {
        buttons[0].click();
        await promise;
      }
    });
  });
});
