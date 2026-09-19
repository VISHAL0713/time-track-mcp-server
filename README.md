# TimeTrack

TimeTrack is a time-tracking application with:

- A web dashboard for viewing and logging time entries.
- A REST API backed by SQLite.
- An MCP server with tools, a resource, and a prompt.

The website and MCP server use the same `timetrack.db` database.

## Requirements

- Python 3.11 or newer
- `uv`
- Node.js and `npx` only if you want to use MCP Inspector

Check the installed tools:

```bash
python --version
uv --version
node --version
```

## 1. Open the project

From Git Bash or a terminal:

```bash
cd ~/Agentic_AI_AGENTOPS/Class7_MCP/timetrack_mcp_project
```

On Windows PowerShell:

```powershell
cd C:\Users\visha\Agentic_AI_AGENTOPS\Class7_MCP\timetrack_mcp_project
```

## 2. Install dependencies

Run this from the `Class7_MCP` folder, where `pyproject.toml` is located:

```bash
cd ..
uv sync
cd timetrack_mcp_project
```

The required packages are FastAPI, FastMCP, and Uvicorn.

## 3. Create the database

The database is initialized automatically when `main.py` starts. To create it before starting the server, run:

```bash
uv run python database_load.py
```

This creates `timetrack.db` beside `database_load.py` and inserts the sample entries if the table is empty.

## 4. Start the web and HTTP MCP server

Use port `8000`:

```bash
uv run uvicorn main:app --host 127.0.0.1 --port 8000
```

Keep this terminal running. Open these URLs in a browser:

- Website: <http://127.0.0.1:8000>
- API documentation: <http://127.0.0.1:8000/docs>
- MCP endpoint: <http://127.0.0.1:8000/mcp>

The MCP endpoint uses **Streamable HTTP**.

## 5. Connect MCP Inspector using port 8000

Open a second terminal and run:

```bash
npx @modelcontextprotocol/inspector@2.5.0
```

In MCP Inspector:

1. Select **Streamable HTTP** as the transport.
2. Enter this URL:

```text
http://127.0.0.1:8000/mcp
```

3. Connect to the server.

You should see these MCP components:

- `log_time`
- `get_timesheet`
- `get_project_summary`
- `list_projects`
- `timesheet://projects`
- `generate_weekly_report`

Do not use `npx ... inspector uv run python main.py` when connecting to port `8000`. That command uses the stdio transport, while this project is already running as an HTTP server.

## 6. Use MCP in stdio mode instead

If you want Inspector to launch the MCP process directly, stop the Uvicorn server first, then run:

```bash
npx @modelcontextprotocol/inspector@2.5.0 uv run python main.py
```

Use this mode only when you are not connecting to `http://127.0.0.1:8000/mcp`.

## 7. Start the MCP server directly over HTTP on port 8001

To run only the MCP server with Streamable HTTP instead of stdio, use:

```bash
uv run fastmcp run main.py --transport http --host 127.0.0.1 --port 8001
```

Connect MCP Inspector to:

```text
http://127.0.0.1:8001/mcp
```

## Useful API commands

List all entries:

```bash
curl http://127.0.0.1:8000/api/entries
```

List projects:

```bash
curl http://127.0.0.1:8000/api/projects
```

Get a project summary:

```bash
curl "http://127.0.0.1:8000/api/projects/Website%20Redesign/summary"
```

Log time:

```bash
curl -X POST http://127.0.0.1:8000/api/entries \
	-H "Content-Type: application/json" \
	-d '{"employee_name":"Asha Patel","project":"Website Redesign","entry_date":"2026-09-17","hours":2.5,"description":"Updated the dashboard"}'
```

## Troubleshooting

### Port 8000 is already in use

Only run one server on port `8000`. Stop the existing Uvicorn process with `Ctrl+C`, then start it again:

```bash
uv run uvicorn main:app --host 127.0.0.1 --port 8000
```

Or use another port:

```bash
uv run uvicorn main:app --host 127.0.0.1 --port 8001
```

If you use another port, connect Inspector to `http://127.0.0.1:8001/mcp`.

### Inspector says `Connection closed`

For the port `8000` setup, make sure:

1. Uvicorn is still running.
2. Inspector transport is **Streamable HTTP**.
3. The Inspector URL is exactly `http://127.0.0.1:8000/mcp`.

### The website does not load


