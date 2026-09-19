# TimeTrack MCP Server

TimeTrack is a time-tracking application with:

- A web dashboard for viewing and logging time entries.
- A REST API backed by SQLite.
- An MCP server with tools, a resource, and a prompt.

The website and MCP server use the same local `timetrack.db` database.

## Requirements

- Python 3.11 or newer
- `pip` or `uv`
- Node.js and `npx` for MCP Inspector

Check the installed tools:

```bash
python --version
pip --version
node --version
npx --version
```

## Quickstart

Clone the repository and enter its directory:

```bash
git clone https://github.com/VISHAL0713/time-track-mcp-server.git
cd time-track-mcp-server
```

Create and activate a virtual environment:

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install the application dependencies:

```bash
python -m pip install --upgrade pip
python -m pip install fastapi fastmcp "uvicorn[standard]"
```

Start the combined web, REST API, and MCP server on port `8000`:

```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

When `main.py` starts, it initializes `timetrack.db` automatically and inserts the sample entries if the table is empty. You do not need to create the database separately. The database is local runtime data and is ignored by Git. If you need to initialize it manually before starting the server, you can run `python database_load.py`.

Open these URLs:

- Website: <http://127.0.0.1:8000>
- API documentation: <http://127.0.0.1:8000/docs>
- MCP endpoint: <http://127.0.0.1:8000/mcp>

The MCP endpoint uses **Streamable HTTP**.

## Connect MCP Inspector

Keep the server running and open a second terminal:

```bash
npx @modelcontextprotocol/inspector@2.5.0
```

In MCP Inspector:

1. Select **Streamable HTTP** as the transport.
2. Enter `http://127.0.0.1:8000/mcp`.
3. Connect to the server.

Available MCP components:

- Tools: `log_time`, `get_timesheet`, `get_project_summary`, `list_projects`
- Resource: `timesheet://projects`
- Prompt: `generate_weekly_report`

## Run MCP in stdio mode

To let Inspector launch the MCP process directly, stop the Uvicorn server and run:

```bash
npx @modelcontextprotocol/inspector@2.5.0 python main.py
```

Use this mode instead of connecting Inspector to the HTTP endpoint.

## Run MCP directly over HTTP

To run only the MCP server on port `8001`:

```bash
uv run fastmcp run main.py --transport http --host 127.0.0.1 --port 8001
```

Connect Inspector to `http://127.0.0.1:8001/mcp`.

## REST API examples

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

Stop the running server with `Ctrl+C`, then start it again. Or use another port:

```bash
uvicorn main:app --host 127.0.0.1 --port 8001
```

Update the browser and Inspector URL to use the selected port.

### Inspector says `Connection closed`

For the HTTP setup, verify that:

1. Uvicorn is still running.
2. Inspector transport is **Streamable HTTP**.
3. The Inspector URL matches the server port and ends with `/mcp`.

### The website does not load

Confirm that you started the server from the repository root, where `main.py` and the `static` directory are located.


