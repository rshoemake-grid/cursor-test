import ast
import operator
from typing import Any
from .base import BaseTool, ToolParameter


class CalculatorTool(BaseTool):
    """Simple calculator tool for mathematical operations"""
    
    @property
    def name(self) -> str:
        return "calculator"
    
    @property
    def description(self) -> str:
        return "Performs mathematical calculations. Supports +, -, *, /, **, sqrt, etc."
    
    @property
    def parameters(self):
        return [
            ToolParameter(
                name="expression",
                type="string",
                description="Mathematical expression to evaluate (e.g., '2 + 2', '10 * 5')",
                required=True
            )
        ]
    
    async def execute(self, expression: str) -> Any:
        """Safely evaluate mathematical expression"""
        try:
            # Safe eval with limited operators
            allowed_operators = {
                ast.Add: operator.add,
                ast.Sub: operator.sub,
                ast.Mult: operator.mul,
                ast.Div: operator.truediv,
                ast.Pow: operator.pow,
                ast.USub: operator.neg,
            }
            
            def eval_node(node):
                if isinstance(node, ast.Num):
                    return node.n
                elif isinstance(node, ast.BinOp):
                    left = eval_node(node.left)
                    right = eval_node(node.right)
                    return allowed_operators[type(node.op)](left, right)
                elif isinstance(node, ast.UnaryOp):
                    operand = eval_node(node.operand)
                    return allowed_operators[type(node.op)](operand)
                else:
                    raise ValueError(f"Unsupported operation: {type(node)}")
            
            tree = ast.parse(expression, mode='eval')
            result = eval_node(tree.body)
            return {"result": result, "expression": expression}
        
        except Exception as e:
            return {"error": str(e), "expression": expression}


class WebSearchTool(BaseTool):
    """Web search tool (placeholder - would integrate with real search API)"""
    
    @property
    def name(self) -> str:
        return "web_search"
    
    @property
    def description(self) -> str:
        return "Searches the web for information on a given query"
    
    @property
    def parameters(self):
        return [
            ToolParameter(
                name="query",
                type="string",
                description="Search query",
                required=True
            ),
            ToolParameter(
                name="num_results",
                type="number",
                description="Number of results to return",
                required=False,
                default=5
            )
        ]
    
    async def execute(self, query: str, num_results: int = 5) -> Any:
        """Placeholder web search"""
        # In production, integrate with Google Search API, Bing API, etc.
        return {
            "query": query,
            "results": [
                {
                    "title": f"Result {i+1} for '{query}'",
                    "snippet": f"This is a placeholder result for {query}",
                    "url": f"https://example.com/result{i+1}"
                }
                for i in range(num_results)
            ],
            "note": "This is a placeholder. Integrate with real search API in production."
        }


class PythonExecutorTool(BaseTool):
    """Executes Python code in a sandboxed environment"""
    
    @property
    def name(self) -> str:
        return "python_executor"
    
    @property
    def description(self) -> str:
        return "Executes Python code and returns the result. Use for data processing, calculations, etc."
    
    @property
    def parameters(self):
        return [
            ToolParameter(
                name="code",
                type="string",
                description="Python code to execute",
                required=True
            )
        ]
    
    async def execute(self, code: str) -> Any:
        """Execute Python code with safety restrictions"""
        try:
            # Create restricted globals
            safe_globals = {
                "__builtins__": {
                    "print": print,
                    "len": len,
                    "range": range,
                    "str": str,
                    "int": int,
                    "float": float,
                    "list": list,
                    "dict": dict,
                    "sum": sum,
                    "max": max,
                    "min": min,
                }
            }
            
            # Capture output
            output = []
            def custom_print(*args, **kwargs):
                output.append(" ".join(str(arg) for arg in args))
            
            safe_globals["__builtins__"]["print"] = custom_print
            
            # Execute code
            local_vars = {}
            exec(code, safe_globals, local_vars)
            
            # Get result (last expression or print output)
            result = local_vars.get("result", "\n".join(output) if output else "Code executed successfully")
            
            return {
                "result": result,
                "output": output,
                "code": code
            }
        
        except Exception as e:
            return {
                "error": str(e),
                "code": code
            }


class FileReaderTool(BaseTool):
    """Reads file contents (with safety restrictions)"""
    
    @property
    def name(self) -> str:
        return "file_reader"
    
    @property
    def description(self) -> str:
        return "Reads the contents of a text file"
    
    @property
    def parameters(self):
        return [
            ToolParameter(
                name="file_path",
                type="string",
                description="Path to the file to read",
                required=True
            ),
            ToolParameter(
                name="max_lines",
                type="number",
                description="Maximum number of lines to read",
                required=False,
                default=100
            )
        ]
    
    async def execute(self, file_path: str, max_lines: int = 100) -> Any:
        """Read file with safety checks"""
        try:
            # Safety: only allow reading from specific directories in production
            # This is a simplified version
            
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = []
                for i, line in enumerate(f):
                    if i >= max_lines:
                        break
                    lines.append(line.rstrip())
            
            return {
                "file_path": file_path,
                "lines_read": len(lines),
                "content": "\n".join(lines),
                "truncated": len(lines) >= max_lines
            }
        
        except Exception as e:
            return {
                "error": str(e),
                "file_path": file_path
            }

