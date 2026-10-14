const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Подключение к БД
const db = new sqlite3.Database('./database.sqlite');

// Инициализация таблицы
db.run(`
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        passport_series TEXT NOT NULL,
        passport_number TEXT NOT NULL,
        contact_info TEXT NOT NULL,
        address TEXT NOT NULL,
        department TEXT NOT NULL,
        position TEXT NOT NULL,
        salary REAL NOT NULL,
        hire_date TEXT NOT NULL,
        is_fired INTEGER DEFAULT 0
    )
`);

// 1. Получение списка сотрудников (с фильтрацией и поиском)
app.get('/api/employees', (req, res) => {
    const { search, department, position } = req.query;
    let query = 'SELECT * FROM employees WHERE 1=1';
    const params = [];

    if (search) {
        query += ' AND full_name LIKE ?';
        params.push(`%${search}%`);
    }
    if (department) {
        query += ' AND department = ?';
        params.push(department);
    }
    if (position) {
        query += ' AND position = ?';
        params.push(position);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Создание нового сотрудника
app.post('/api/employees', (req, res) => {
    const { full_name, birth_date, passport_series, passport_number, contact_info, address, department, position, salary, hire_date } = req.body;
    const query = `
        INSERT INTO employees (full_name, birth_date, passport_series, passport_number, contact_info, address, department, position, salary, hire_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(query, [full_name, birth_date, passport_series, passport_number, contact_info, address, department, position, salary, hire_date], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID });
    });
});

// 3. Редактирование сотрудника
app.put('/api/employees/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT is_fired FROM employees WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Сотрудник не найден' });
        if (row.is_fired === 1) {
            return res.status(403).json({ error: 'Невозможно редактировать уволенного сотрудника' });
        }

        const { full_name, birth_date, passport_series, passport_number, contact_info, address, department, position, salary, hire_date } = req.body;
        const query = `
            UPDATE employees 
            SET full_name=?, birth_date=?, passport_series=?, passport_number=?, contact_info=?, address=?, department=?, position=?, salary=?, hire_date=?
            WHERE id=?
        `;
        db.run(query, [full_name, birth_date, passport_series, passport_number, contact_info, address, department, position, salary, hire_date, id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Данные обновлены' });
        });
    });
});

// 4. Увольнение сотрудника (Soft Delete)
app.patch('/api/employees/:id/fire', (req, res) => {
    const { id } = req.params;
    db.run('UPDATE employees SET is_fired = 1 WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Сотрудник уволен' });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
