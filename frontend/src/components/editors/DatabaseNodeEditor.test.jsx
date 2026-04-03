import { render, screen, fireEvent } from "@testing-library/react";
import DatabaseNodeEditor from "./DatabaseNodeEditor";
describe("DatabaseNodeEditor", () => {
  const mockOnConfigUpdate = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const createMockNode = (overrides = {}) => ({
    id: "test-db",
    type: "database",
    position: {
      x: 0,
      y: 0,
    },
    data: {
      name: "Test Database",
      input_config: {
        database_type: "postgresql",
        mode: "read",
        connection_string: "",
        host: "localhost",
        port: 5432,
        database_name: "testdb",
        username: "user",
        password: "",
        query: "SELECT * FROM users",
        ssl_mode: "prefer",
        ...overrides,
      },
    },
  });
  it("should render database configuration fields", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    expect(screen.getByLabelText(/Database Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Connection Mode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Connection String/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Host/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Port/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Database Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Query/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/SSL Mode/i)).toBeInTheDocument();
  });
  it("should display default database type of postgresql when missing", () => {
    const node = createMockNode({
      database_type: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const typeSelect = screen.getByLabelText(/Database Type/i);
    expect(typeSelect.value).toBe("postgresql");
  });
  it("should display default mode of read when missing", () => {
    const node = createMockNode({
      mode: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const modeSelect = screen.getByLabelText(/Connection Mode/i);
    expect(modeSelect.value).toBe("read");
  });
  it("should display empty string when connection_string is missing", () => {
    const node = createMockNode({
      connection_string: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const connectionStringInput = screen.getByLabelText(/Connection String/i);
    expect(connectionStringInput.value).toBe("");
  });
  it("should display empty string when host is missing", () => {
    const node = createMockNode({
      host: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const hostInput = screen.getByLabelText(/Host/i);
    expect(hostInput.value).toBe("");
  });
  it("should display current database type value", () => {
    const node = createMockNode({
      database_type: "mysql",
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const typeSelect = screen.getByLabelText(/Database Type/i);
    expect(typeSelect.value).toBe("mysql");
  });
  it("should call onConfigUpdate when database type changes", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const typeSelect = screen.getByLabelText(/Database Type/i);
    fireEvent.change(typeSelect, {
      target: {
        value: "mysql",
      },
    });
    expect(mockOnConfigUpdate).toHaveBeenCalledWith(
      "input_config",
      "database_type",
      "mysql",
    );
  });
  it("should call onConfigUpdate when mode changes", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const modeSelect = screen.getByLabelText(/Connection Mode/i);
    fireEvent.change(modeSelect, {
      target: {
        value: "write",
      },
    });
    expect(mockOnConfigUpdate).toHaveBeenCalledWith(
      "input_config",
      "mode",
      "write",
    );
  });
  it("should call onConfigUpdate when connection string changes", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const connectionStringInput = screen.getByLabelText(/Connection String/i);
    fireEvent.change(connectionStringInput, {
      target: {
        value: "postgresql://user:pass@host:5432/db",
      },
    });
    expect(mockOnConfigUpdate).toHaveBeenCalledWith(
      "input_config",
      "connection_string",
      "postgresql://user:pass@host:5432/db",
    );
  });
  it("should call onConfigUpdate when host changes", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const hostInput = screen.getByLabelText(/Host/i);
    fireEvent.change(hostInput, {
      target: {
        value: "example.com",
      },
    });
    expect(mockOnConfigUpdate).toHaveBeenCalledWith(
      "input_config",
      "host",
      "example.com",
    );
  });
  it("should call onConfigUpdate when port changes", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const portInput = screen.getByLabelText(/Port/i);
    fireEvent.change(portInput, {
      target: {
        value: "3306",
      },
    });
    expect(mockOnConfigUpdate).toHaveBeenCalledWith(
      "input_config",
      "port",
      3306,
    );
  });
  it("should call onConfigUpdate with undefined when port is cleared", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const portInput = screen.getByLabelText(/Port/i);
    fireEvent.change(portInput, {
      target: {
        value: "",
      },
    });
    expect(mockOnConfigUpdate).toHaveBeenCalledWith(
      "input_config",
      "port",
      void 0,
    );
  });
  it("should call onConfigUpdate when database name changes", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const dbNameInput = screen.getByLabelText(/Database Name/i);
    fireEvent.change(dbNameInput, {
      target: {
        value: "newdb",
      },
    });
    expect(mockOnConfigUpdate).toHaveBeenCalledWith(
      "input_config",
      "database_name",
      "newdb",
    );
  });
  it("should call onConfigUpdate when username changes", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const usernameInput = screen.getByLabelText(/Username/i);
    fireEvent.change(usernameInput, {
      target: {
        value: "newuser",
      },
    });
    expect(mockOnConfigUpdate).toHaveBeenCalledWith(
      "input_config",
      "username",
      "newuser",
    );
  });
  it("should call onConfigUpdate when password changes", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const passwordInput = screen.getByLabelText(/Password/i);
    fireEvent.change(passwordInput, {
      target: {
        value: "secret123",
      },
    });
    expect(mockOnConfigUpdate).toHaveBeenCalledWith(
      "input_config",
      "password",
      "secret123",
    );
  });
  it("should call onConfigUpdate when query changes", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const queryInput = screen.getByLabelText(/Query/i);
    fireEvent.change(queryInput, {
      target: {
        value: "SELECT * FROM products",
      },
    });
    expect(mockOnConfigUpdate).toHaveBeenCalledWith(
      "input_config",
      "query",
      "SELECT * FROM products",
    );
  });
  it("should call onConfigUpdate when SSL mode changes", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const sslModeSelect = screen.getByLabelText(/SSL Mode/i);
    fireEvent.change(sslModeSelect, {
      target: {
        value: "require",
      },
    });
    expect(mockOnConfigUpdate).toHaveBeenCalledWith(
      "input_config",
      "ssl_mode",
      "require",
    );
  });
  it("should display default values when input_config is empty", () => {
    const node = createMockNode({});
    node.data.input_config = {};
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const typeSelect = screen.getByLabelText(/Database Type/i);
    expect(typeSelect.value).toBe("postgresql");
    const modeSelect = screen.getByLabelText(/Connection Mode/i);
    expect(modeSelect.value).toBe("read");
    const sslModeSelect = screen.getByLabelText(/SSL Mode/i);
    expect(sslModeSelect.value).toBe("prefer");
  });
  it("should display all database type options", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const typeSelect = screen.getByLabelText(/Database Type/i);
    const options = Array.from(typeSelect.querySelectorAll("option")).map(
      (opt) => opt.value,
    );
    expect(options).toContain("postgresql");
    expect(options).toContain("mysql");
    expect(options).toContain("sqlite");
    expect(options).toContain("mongodb");
    expect(options).toContain("mssql");
    expect(options).toContain("oracle");
  });
  it("should display all SSL mode options", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const sslModeSelect = screen.getByLabelText(/SSL Mode/i);
    const options = Array.from(sslModeSelect.querySelectorAll("option")).map(
      (opt) => opt.value,
    );
    expect(options).toContain("disable");
    expect(options).toContain("allow");
    expect(options).toContain("prefer");
    expect(options).toContain("require");
    expect(options).toContain("verify-ca");
    expect(options).toContain("verify-full");
  });
  it("should handle null input_config", () => {
    const node = createMockNode({});
    node.data.input_config = null;
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const typeSelect = screen.getByLabelText(/Database Type/i);
    expect(typeSelect.value).toBe("postgresql");
  });
  it("should handle undefined input_config", () => {
    const node = createMockNode({});
    node.data.input_config = void 0;
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const typeSelect = screen.getByLabelText(/Database Type/i);
    expect(typeSelect.value).toBe("postgresql");
  });
  it("should verify all logical OR operators use correct fallback values", () => {
    const node = createMockNode({
      database_type: void 0,
      mode: void 0,
      connection_string: void 0,
      host: void 0,
      port: void 0,
      database_name: void 0,
      username: void 0,
      password: void 0,
      query: void 0,
      ssl_mode: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    expect(screen.getByLabelText(/Database Type/i).value).toBe("postgresql");
    expect(screen.getByLabelText(/Connection Mode/i).value).toBe("read");
    expect(screen.getByLabelText(/Connection String/i).value).toBe("");
    expect(screen.getByLabelText(/Host/i).value).toBe("");
    expect(screen.getByLabelText(/Port/i).value).toBe("");
    expect(screen.getByLabelText(/Database Name/i).value).toBe("");
    expect(screen.getByLabelText(/Username/i).value).toBe("");
    expect(screen.getByLabelText(/Password/i).value).toBe("");
    expect(screen.getByLabelText(/Query/i).value).toBe("");
    expect(screen.getByLabelText(/SSL Mode/i).value).toBe("prefer");
  });
  it("should verify database_type fallback uses exact postgresql string", () => {
    const node = createMockNode({
      database_type: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const typeSelect = screen.getByLabelText(/Database Type/i);
    expect(typeSelect.value).toBe("postgresql");
    expect(typeSelect.value).not.toBe("mysql");
    expect(typeSelect.value).not.toBe("");
  });
  it("should verify mode fallback uses exact read string", () => {
    const node = createMockNode({
      mode: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const modeSelect = screen.getByLabelText(/Connection Mode/i);
    expect(modeSelect.value).toBe("read");
    expect(modeSelect.value).not.toBe("write");
    expect(modeSelect.value).not.toBe("");
  });
  it("should verify ssl_mode fallback uses exact prefer string", () => {
    const node = createMockNode({
      ssl_mode: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const sslModeSelect = screen.getByLabelText(/SSL Mode/i);
    expect(sslModeSelect.value).toBe("prefer");
    expect(sslModeSelect.value).not.toBe("disable");
    expect(sslModeSelect.value).not.toBe("");
  });
  it("should verify connection_string fallback uses exact empty string", () => {
    const node = createMockNode({
      connection_string: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const connectionStringInput = screen.getByLabelText(/Connection String/i);
    expect(connectionStringInput.value).toBe("");
    expect(connectionStringInput.value.length).toBe(0);
  });
  it("should verify host fallback uses exact empty string", () => {
    const node = createMockNode({
      host: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const hostInput = screen.getByLabelText(/Host/i);
    expect(hostInput.value).toBe("");
    expect(hostInput.value.length).toBe(0);
  });
  it("should verify port fallback uses exact empty string", () => {
    const node = createMockNode({
      port: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const portInput = screen.getByLabelText(/Port/i);
    expect(portInput.value).toBe("");
    expect(portInput.value.length).toBe(0);
  });
  it("should verify database_name fallback uses exact empty string", () => {
    const node = createMockNode({
      database_name: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const databaseNameInput = screen.getByLabelText(/Database Name/i);
    expect(databaseNameInput.value).toBe("");
    expect(databaseNameInput.value.length).toBe(0);
  });
  it("should verify username fallback uses exact empty string", () => {
    const node = createMockNode({
      username: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const usernameInput = screen.getByLabelText(/Username/i);
    expect(usernameInput.value).toBe("");
    expect(usernameInput.value.length).toBe(0);
  });
  it("should verify password fallback uses exact empty string", () => {
    const node = createMockNode({
      password: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const passwordInput = screen.getByLabelText(/Password/i);
    expect(passwordInput.value).toBe("");
    expect(passwordInput.value.length).toBe(0);
  });
  it("should verify query fallback uses exact empty string", () => {
    const node = createMockNode({
      query: void 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const queryInput = screen.getByLabelText(/Query/i);
    expect(queryInput.value).toBe("");
    expect(queryInput.value.length).toBe(0);
  });
  it("should verify input_config fallback to empty object uses correct fallback", () => {
    const node = createMockNode({});
    node.data.input_config = null;
    const { container } = render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    expect(container.querySelector("h4")).toHaveTextContent(
      "Database Configuration",
    );
  });
  it("should handle empty string database_type", () => {
    const node = createMockNode({
      database_type: "",
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const typeSelect = screen.getByLabelText(/Database Type/i);
    expect(typeSelect.value).toBe("postgresql");
  });
  it("should handle null database_type", () => {
    const node = createMockNode({
      database_type: null,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const typeSelect = screen.getByLabelText(/Database Type/i);
    expect(typeSelect.value).toBe("postgresql");
  });
  it("should handle empty string mode", () => {
    const node = createMockNode({
      mode: "",
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const modeSelect = screen.getByLabelText(/Connection Mode/i);
    expect(modeSelect.value).toBe("read");
  });
  it("should handle null mode", () => {
    const node = createMockNode({
      mode: null,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const modeSelect = screen.getByLabelText(/Connection Mode/i);
    expect(modeSelect.value).toBe("read");
  });
  it("should handle null connection_string", () => {
    const node = createMockNode({
      connection_string: null,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const connectionStringInput = screen.getByLabelText(/Connection String/i);
    expect(connectionStringInput.value).toBe("");
  });
  it("should handle null host", () => {
    const node = createMockNode({
      host: null,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const hostInput = screen.getByLabelText(/Host/i);
    expect(hostInput.value).toBe("");
  });
  it("should handle null port", () => {
    const node = createMockNode({
      port: null,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const portInput = screen.getByLabelText(/Port/i);
    expect(portInput.value).toBe("");
  });
  it("should handle zero port", () => {
    const node = createMockNode({
      port: 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const portInput = screen.getByLabelText(/Port/i);
    expect(portInput.value).toBe("");
  });
  it("should handle null database_name", () => {
    const node = createMockNode({
      database_name: null,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const dbNameInput = screen.getByLabelText(/Database Name/i);
    expect(dbNameInput.value).toBe("");
  });
  it("should handle null username", () => {
    const node = createMockNode({
      username: null,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const usernameInput = screen.getByLabelText(/Username/i);
    expect(usernameInput.value).toBe("");
  });
  it("should handle null password", () => {
    const node = createMockNode({
      password: null,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const passwordInput = screen.getByLabelText(/Password/i);
    expect(passwordInput.value).toBe("");
  });
  it("should handle null query", () => {
    const node = createMockNode({
      query: null,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const queryInput = screen.getByLabelText(/Query/i);
    expect(queryInput.value).toBe("");
  });
  it("should handle null ssl_mode", () => {
    const node = createMockNode({
      ssl_mode: null,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const sslModeSelect = screen.getByLabelText(/SSL Mode/i);
    expect(sslModeSelect.value).toBe("prefer");
  });
  it("should handle empty string ssl_mode", () => {
    const node = createMockNode({
      ssl_mode: "",
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const sslModeSelect = screen.getByLabelText(/SSL Mode/i);
    expect(sslModeSelect.value).toBe("prefer");
  });
  it("should handle port parsing with empty string", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const portInput = screen.getByLabelText(/Port/i);
    fireEvent.change(portInput, {
      target: {
        value: "",
      },
    });
    expect(mockOnConfigUpdate).toHaveBeenCalledWith(
      "input_config",
      "port",
      void 0,
    );
  });
  it("should handle port parsing with non-numeric string", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const portInput = screen.getByLabelText(/Port/i);
    fireEvent.change(portInput, {
      target: {
        value: "abc",
      },
    });
    expect(mockOnConfigUpdate).toHaveBeenCalledWith(
      "input_config",
      "port",
      void 0,
    );
  });
  it("should handle port parsing with valid number", () => {
    const node = createMockNode();
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const portInput = screen.getByLabelText(/Port/i);
    fireEvent.change(portInput, {
      target: {
        value: "3306",
      },
    });
    expect(mockOnConfigUpdate).toHaveBeenCalledWith(
      "input_config",
      "port",
      3306,
    );
  });
  it("should handle port value of 0 displays as empty", () => {
    const node = createMockNode({
      port: 0,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const portInput = screen.getByLabelText(/Port/i);
    expect(portInput.value).toBe("");
  });
  it("should verify all fields handle falsy values correctly", () => {
    const node = createMockNode({
      database_type: false,
      mode: false,
      connection_string: false,
      host: false,
      port: false,
      database_name: false,
      username: false,
      password: false,
      query: false,
      ssl_mode: false,
    });
    render(
      <DatabaseNodeEditor node={node} onConfigUpdate={mockOnConfigUpdate} />,
    );
    const typeSelect = screen.getByLabelText(/Database Type/i);
    expect(typeSelect.value).toBe("postgresql");
    const modeSelect = screen.getByLabelText(/Connection Mode/i);
    expect(modeSelect.value).toBe("read");
    const sslModeSelect = screen.getByLabelText(/SSL Mode/i);
    expect(sslModeSelect.value).toBe("prefer");
  });
});
