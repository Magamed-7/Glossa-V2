import json
import os
import sys
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

SERVER_PARAMS = StdioServerParameters(command=sys.executable, args=['-m', 'mcp_server.server'], env=dict(os.environ))


def tool_to_openai_schema(tool):
    return {
        'type': 'function',
        'function': {
            'name': tool.name,
            'description': tool.description,
            'parameters': tool.input_schema,
        },
    }


class MCPToolClient:
    def __init__(self):
        self._stack = AsyncExitStack()
        self.session = None

    async def connect(self):
        read, write = await self._stack.enter_async_context(stdio_client(SERVER_PARAMS))
        self.session = await self._stack.enter_async_context(ClientSession(read, write))
        await self.session.initialize()
        return self

    async def close(self):
        await self._stack.aclose()
        self.session = None

    async def list_openai_tools(self):
        result = await self.session.list_tools()
        return [tool_to_openai_schema(tool) for tool in result.tools]

    async def call_tool(self, name: str, arguments: dict):
        result = await self.session.call_tool(name, arguments)

        if not result.content:
            return None

        return json.loads(result.content[0].text)

    async def __aenter__(self):
        return await self.connect()

    async def __aexit__(self, exc_type, exc, tb):
        await self.close()
