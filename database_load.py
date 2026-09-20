"""
TimeTrack's persistence layer -- SQLite, shared by the website and the MCP
server, exactly like RecipeBox's was. One real, professional use case this
time: logging billable hours against projects, and summarizing them.
"""

import aiosqlite
from pathlib import Path


DB_PATH = Path(__file__).parent / "timetrack.db"


async def get_db_connection():
    conn = await aiosqlite.connect(DB_PATH)
    conn.row_factory = aiosqlite.Row
    return conn


async def initialize_db():
    conn = await get_db_connection()
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS time_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_name TEXT NOT NULL,
            project TEXT NOT NULL,
            entry_date TEXT NOT NULL,
            hours REAL NOT NULL,
            description TEXT NOT NULL DEFAULT ''
        )
    """)
    cursor = await conn.execute("SELECT COUNT(*) FROM time_entries")
    count = (await cursor.fetchone())[0]
    if count == 0:
        seed = [
            ("Asha Patel", "Website Redesign", "2026-09-08", 6.5, "Homepage layout"),
            ("Asha Patel", "Website Redesign", "2026-09-09", 7.0, "Mobile responsive fixes"),
            ("Asha Patel", "Client Onboarding", "2026-09-10", 3.0, "Kickoff call + notes"),
            ("Rahul Mehta", "Website Redesign", "2026-09-08", 5.5, "API integration"),
            ("Rahul Mehta", "Internal Tools", "2026-09-09", 8.0, "Dashboard bug fixes"),
            ("Vishal Vaibhav", "Agentic AI Platform", "2026-09-19", 20.0, "Initial setup and configuration"),
        ]
        await conn.executemany(
            "INSERT INTO time_entries (employee_name, project, entry_date, hours, description) "
            "VALUES (?, ?, ?, ?, ?)",
            seed,
        )
        await conn.commit()
    await conn.close()


def row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "employee_name": row["employee_name"],
        "project": row["project"],
        "entry_date": row["entry_date"],
        "hours": row["hours"],
        "description": row["description"],
    }
    
async def list_all_entries() -> list[dict]:
    conn = await get_db_connection()
    cursor = await conn.execute("SELECT * FROM time_entries ORDER BY entry_date DESC, id DESC")
    rows = await cursor.fetchall()
    await conn.close()
    return [row_to_dict(row) for row in rows]


async def log_time(employee_name: str, project: str, entry_date: str, hours: float, description: str = "") -> dict:
    if hours <= 0:
        raise ValueError("hours must be a positive number")
    conn = await get_db_connection()
    cursor = await conn.execute(
        "INSERT INTO time_entries (employee_name, project, entry_date, hours, description) "
        "VALUES (?, ?, ?, ?, ?)",
        (employee_name, project, entry_date, hours, description),
    )
    await conn.commit()
    cursor = await conn.execute("SELECT * FROM time_entries WHERE id = ?", (cursor.lastrowid,))
    row = await cursor.fetchone()
    await conn.close()
    return row_to_dict(row)


async def get_timesheet(employee_name: str, start_date: str | None = None, end_date: str | None = None) -> list[dict]:
    conn = await get_db_connection()
    query = "SELECT * FROM time_entries WHERE employee_name = ?"
    params: list = [employee_name]
    if start_date:
        query += " AND entry_date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND entry_date <= ?"
        params.append(end_date)
    query += " ORDER BY entry_date"
    cursor = await conn.execute(query, params)
    rows = await cursor.fetchall()
    await conn.close()
    return [row_to_dict(row) for row in rows]


async def list_projects() -> list[str]:
    conn = await get_db_connection()
    cursor = await conn.execute("SELECT DISTINCT project FROM time_entries ORDER BY project")
    rows = await cursor.fetchall()
    await conn.close()
    return [row["project"] for row in rows]


async def get_project_summary(project: str) -> dict:
    conn = await get_db_connection()
    cursor = await conn.execute(
        "SELECT employee_name, SUM(hours) as total_hours FROM time_entries "
        "WHERE project = ? GROUP BY employee_name ORDER BY employee_name",
        (project,),
    )
    rows = await cursor.fetchall()
    await conn.close()
    if not rows:
        raise ValueError(f"No time logged against project '{project}'")
    by_employee = {r["employee_name"]: r["total_hours"] for r in rows}
    return {
        "project": project,
        "total_hours": sum(by_employee.values()),
        "by_employee": by_employee,
    }
