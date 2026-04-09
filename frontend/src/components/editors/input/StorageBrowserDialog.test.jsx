import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StorageBrowserDialog from "./StorageBrowserDialog";

describe("StorageBrowserDialog", () => {
  it("shows parent folder row when navigation up is allowed", async () => {
    const fetchPage = jest.fn().mockResolvedValue({
      prefixes: [],
      objects: [{ name: "/tmp/a.txt", display_name: "a.txt", size: 1 }],
      canGoUp: true,
    });
    render(
      <StorageBrowserDialog
        isOpen
        onClose={() => {}}
        title="Test picker"
        variant="localDirectory"
        initialLocation="/tmp/sub"
        prereqError=""
        fetchPage={fetchPage}
        onSelectFile={() => {}}
      />,
    );
    await waitFor(() => {
      expect(screen.getByLabelText("Open parent folder")).toBeInTheDocument();
    });
  });

  it("navigates up when parent folder row is activated", async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce({
        prefixes: ["/tmp/sub/nested/"],
        objects: [],
        canGoUp: true,
      })
      .mockResolvedValue({
        prefixes: [],
        objects: [],
        canGoUp: false,
      });
    render(
      <StorageBrowserDialog
        isOpen
        onClose={() => {}}
        title="Test picker"
        variant="localDirectory"
        initialLocation="/tmp/sub"
        prereqError=""
        fetchPage={fetchPage}
        onSelectFile={() => {}}
      />,
    );
    await waitFor(() => {
      expect(screen.getByLabelText("Open parent folder")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Open parent folder"));
    await waitFor(() => {
      expect(fetchPage.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("uses listPathLabel and listAriaLabel for bucketList variant when set", async () => {
    const fetchPage = jest.fn().mockResolvedValue({
      prefixes: [],
      objects: [{ name: "projects/p/topics/t1", display_name: "t1", size: 0 }],
    });
    render(
      <StorageBrowserDialog
        isOpen
        onClose={() => {}}
        title="Select Pub/Sub topic"
        variant="bucketList"
        initialLocation=""
        prereqError=""
        fetchPage={fetchPage}
        onSelectFile={() => {}}
        listPathLabel="Topics in project"
        listAriaLabel="Pub/Sub topics"
      />,
    );
    await waitFor(() => {
      expect(screen.getByTitle("Topics in project")).toBeInTheDocument();
    });
    expect(screen.getByRole("list", { name: "Pub/Sub topics" })).toBeInTheDocument();
  });

  it("combines folder and typed file name in newInDirectory mode", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const fetchPage = jest.fn().mockResolvedValue({
      prefixes: [],
      objects: [],
      canGoUp: false,
      currentDirectory: "/srv/out",
    });
    render(
      <StorageBrowserDialog
        isOpen
        onClose={() => {}}
        title="Write"
        variant="localDirectory"
        localPickTarget="newInDirectory"
        initialLocation=""
        initialFilenameSuggestion=""
        prereqError=""
        fetchPage={fetchPage}
        onSelectFile={onSelect}
        selectButtonLabel="Use path"
      />,
    );
    const nameInput = screen.getByLabelText(
      "Output file name in the selected folder",
    );
    await waitFor(() => {
      expect(screen.getByTitle("/srv/out")).toBeInTheDocument();
    });
    await user.clear(nameInput);
    await user.type(nameInput, "newfile.txt");
    await user.click(screen.getByRole("button", { name: "Use path" }));
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith("/srv/out/newfile.txt");
    });
  });
});
