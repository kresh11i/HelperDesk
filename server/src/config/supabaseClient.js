import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "db_mock.json");

// Helper to read DB
function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        // Initial Seed
        const initialDB = {
            organizations: [
                { id: "org-123", name: "Demo Org" }
            ],
            users: [
                {
                    user_id: "user-123",
                    org_id: "org-123",
                    name: "Demo User",
                    email: "user@demo.com",
                    password: "$2b$10$fZh8GTOR/vwBhqlbN0X93uR.mfn1hopMALpuKKqwamtTCGez1JsYu", // password123
                    role: 3
                },
                {
                    user_id: "agent-123",
                    org_id: "org-123",
                    name: "Demo Agent",
                    email: "agent@demo.com",
                    password: "$2b$10$fZh8GTOR/vwBhqlbN0X93uR.mfn1hopMALpuKKqwamtTCGez1JsYu", // password123
                    role: 2
                },
                {
                    user_id: "admin-123",
                    org_id: "org-123",
                    name: "Demo Admin",
                    email: "admin@demo.com",
                    password: "$2b$10$fZh8GTOR/vwBhqlbN0X93uR.mfn1hopMALpuKKqwamtTCGez1JsYu", // password123
                    role: 1
                }
            ],
            tickets: [
                {
                    ticket_id: "5d87f321-5711-4be2-a0af-7bc2658fd045",
                    title: "Cannot access printer",
                    description: "The office printer on the second floor is offline and showing an error message.",
                    priority: "High",
                    status: "Open",
                    created_by: "user-123",
                    assigned_to: null,
                    org_id: "org-123",
                    created_at: "2026-08-15T12:00:00Z"
                },
                {
                    ticket_id: "1d668e3c-76a0-4bfb-ba89-5380f8d5ab35",
                    title: "Software license expired",
                    description: "My development IDE license has expired, need a new key.",
                    priority: "Medium",
                    status: "Assigned",
                    created_by: "user-123",
                    assigned_to: "agent-123",
                    org_id: "org-123",
                    created_at: "2026-08-16T08:00:00Z"
                }
            ],
            comments: [
                {
                    comment_id: "33333333-3333-3333-3333-333333333333",
                    ticket_id: "1d668e3c-76a0-4bfb-ba89-5380f8d5ab35",
                    user_id: "agent-123",
                    org_id: "org-123",
                    comment: "I've requested a license from the procurement team. Will update once I get the key.",
                    created_at: "2026-08-16T08:30:00Z"
                }
            ]
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

// Helper to write DB
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

class SupabaseQueryBuilder {
    constructor(tableName) {
        this.tableName = tableName;
        this.filters = []; // { col, val }
        this.insertRows = null;
        this.updateFields = null;
        this.isSingle = false;
        this.isMaybeSingle = false;
        this.isDelete = false;
        this.sortColumn = null;
        this.sortAscending = true;
    }

    select(fields) {
        return this;
    }

    order(column, options) {
        this.sortColumn = column;
        this.sortAscending = options ? options.ascending !== false : true;
        return this;
    }

    insert(rows) {
        this.insertRows = rows;
        return this;
    }

    update(fields) {
        this.updateFields = fields;
        return this;
    }

    delete() {
        this.isDelete = true;
        return this;
    }

    eq(column, value) {
        this.filters.push({ col: column, val: value });
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    maybeSingle() {
        this.isMaybeSingle = true;
        return this;
    }

    async then(resolve, reject) {
        try {
            const res = await this.execute();
            return resolve(res);
        } catch (err) {
            if (reject) return reject(err);
            return resolve({ data: null, error: err });
        }
    }

    async execute() {
        const db = readDB();
        const table = db[this.tableName] || [];

        if (this.insertRows) {
            const inserted = [];
            for (const row of this.insertRows) {
                const newRow = { ...row };
                if (this.tableName === "users") {
                    newRow.user_id = newRow.user_id || uuidv4();
                } else if (this.tableName === "organizations") {
                    newRow.id = newRow.id || uuidv4();
                } else if (this.tableName === "tickets") {
                    newRow.ticket_id = newRow.ticket_id || uuidv4();
                    newRow.created_at = newRow.created_at || new Date().toISOString();
                } else if (this.tableName === "comments") {
                    newRow.comment_id = newRow.comment_id || uuidv4();
                    newRow.created_at = newRow.created_at || new Date().toISOString();
                }
                table.push(newRow);
                inserted.push(newRow);
            }
            db[this.tableName] = table;
            writeDB(db);

            // Populate relation names if needed
            const populated = inserted.map(row => this.populateRow(row, db));

            return {
                data: this.isSingle ? populated[0] : populated,
                error: null
            };
        }

        if (this.updateFields) {
            let affected = [];
            const updatedTable = table.map(row => {
                let matches = true;
                for (const filter of this.filters) {
                    if (row[filter.col] !== filter.val) {
                        matches = false;
                        break;
                    }
                }
                if (matches) {
                    const newRow = { ...row, ...this.updateFields };
                    affected.push(newRow);
                    return newRow;
                }
                return row;
            });
            db[this.tableName] = updatedTable;
            writeDB(db);

            const populated = affected.map(row => this.populateRow(row, db));
            if (this.isSingle && populated.length === 0) {
                return { data: null, error: { code: "PGRST116", message: "Not found" } };
            }
            return {
                data: this.isSingle ? populated[0] : populated,
                error: null
            };
        }

        if (this.isDelete) {
            let affected = [];
            const remainingTable = table.filter(row => {
                let matches = true;
                for (const filter of this.filters) {
                    if (row[filter.col] !== filter.val) {
                        matches = false;
                        break;
                    }
                }
                if (matches) {
                    affected.push(row);
                    return false; // remove
                }
                return true;
            });
            db[this.tableName] = remainingTable;
            writeDB(db);

            const populated = affected.map(row => this.populateRow(row, db));
            if (this.isSingle && populated.length === 0) {
                return { data: null, error: { code: "PGRST116", message: "Not found" } };
            }
            return {
                data: this.isSingle ? populated[0] : populated,
                error: null
            };
        }

        // Select queries
        let results = table.filter(row => {
            for (const filter of this.filters) {
                if (row[filter.col] !== filter.val) {
                    return false;
                }
            }
            return true;
        });

        results = results.map(row => this.populateRow(row, db));

        if (this.sortColumn) {
            results.sort((a, b) => {
                const valA = a[this.sortColumn];
                const valB = b[this.sortColumn];
                if (valA < valB) return this.sortAscending ? -1 : 1;
                if (valA > valB) return this.sortAscending ? 1 : -1;
                return 0;
            });
        }

        if (this.isSingle) {
            if (results.length === 0) {
                return { data: null, error: { code: "PGRST116", message: "Not found" } };
            }
            return { data: results[0], error: null };
        }

        if (this.isMaybeSingle) {
            return { data: results.length > 0 ? results[0] : null, error: null };
        }

        return { data: results, error: null };
    }

    populateRow(row, db) {
        const newRow = { ...row };
        if (this.tableName === "tickets") {
            const assignedUser = db.users.find(u => u.user_id === row.assigned_to);
            const createdUser = db.users.find(u => u.user_id === row.created_by);
            newRow.assigned_user = assignedUser ? { name: assignedUser.name } : null;
            newRow.created_user = createdUser ? { name: createdUser.name } : null;
        } else if (this.tableName === "comments") {
            const commentUser = db.users.find(u => u.user_id === row.user_id);
            newRow.user = commentUser ? { name: commentUser.name, role: commentUser.role } : null;
        }
        return newRow;
    }
}

const supabase = {
    from: (tableName) => {
        return new SupabaseQueryBuilder(tableName);
    }
};

export default supabase;