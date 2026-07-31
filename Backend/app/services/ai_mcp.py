from mcp_server.client import MCPToolClient

_client: MCPToolClient | None = None


async def connect():
    global _client

    if _client is not None:
        return

    _client = await MCPToolClient().connect()


async def disconnect():
    global _client

    if _client is None:
        return

    await _client.close()
    _client = None


def get_client():
    if _client is None:
        raise RuntimeError('MCP client is not connected, call ai_mcp.connect() first')

    return _client


async def get_tool_schemas():
    return await get_client().list_openai_tools()


async def call_tool(name: str, arguments: dict):
    return await get_client().call_tool(name, arguments)
