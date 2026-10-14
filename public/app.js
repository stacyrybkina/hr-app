const API_URL = '/api/employees';
let employees = [];

const passportMask = IMask(document.getElementById('passport'), {
    mask: '0000 000000'
});
const contactMask = IMask(document.getElementById('contact'), {
    mask: '+7 (000) 000-00-00'
});

document.addEventListener('DOMContentLoaded', fetchEmployees);

document.getElementById('btnSearch').addEventListener('click', fetchEmployees);
document.getElementById('btnAdd').addEventListener('click', () => openModal());
document.querySelector('.close').addEventListener('click', closeModal);
document.getElementById('employeeForm').addEventListener('submit', handleFormSubmit);

async function fetchEmployees() {
    const search = document.getElementById('searchInput').value;
    const department = document.getElementById('filterDepartment').value;
    const position = document.getElementById('filterPosition').value;

    const params = new URLSearchParams({ search, department, position });
    const res = await fetch(`${API_URL}?${params.toString()}`);
    employees = await res.json();
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    employees.forEach(emp => {
        const tr = document.createElement('tr');
        const isFired = emp.is_fired === 1;
        
        tr.innerHTML = `
            <td>${emp.full_name}</td>
            <td>${emp.birth_date}</td>
            <td>${emp.passport_series} ${emp.passport_number}</td>
            <td>${emp.contact_info}</td>
            <td>${emp.address}</td>
            <td>${emp.department}</td>
            <td>${emp.position}</td>
            <td>${emp.salary}</td>
            <td>${emp.hire_date}</td>
            <td class="${isFired ? 'status-fired' : 'status-active'}">
                ${isFired ? 'Уволен' : 'Работает'}
            </td>
            <td class="actions">
                <button class="btn-edit" onclick="editEmployee(${emp.id})" ${isFired ? 'disabled' : ''}>Ред.</button>
                ${!isFired ? `<button class="btn-fire" onclick="fireEmployee(${emp.id})">Уволить</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openModal(emp = null) {
    const modal = document.getElementById('modal');
    const form = document.getElementById('employeeForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    if (passportMask) passportMask.value = '';
    if (contactMask) contactMask.value = '';

    if (emp) {
        title.innerText = 'Редактировать сотрудника';
        document.getElementById('employeeId').value = emp.id;
        document.getElementById('fullName').value = emp.full_name;
        document.getElementById('birthDate').value = emp.birth_date;
        passportMask.value = `${emp.passport_series} ${emp.passport_number}`;
        contactMask.value = emp.contact_info;
        document.getElementById('address').value = emp.address;
        document.getElementById('department').value = emp.department;
        document.getElementById('position').value = emp.position;
        document.getElementById('salary').value = emp.salary;
        document.getElementById('hireDate').value = emp.hire_date;
    } else {
        title.innerText = 'Добавить сотрудника';
        document.getElementById('employeeId').value = '';
    }
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function editEmployee(id) {
    const emp = employees.find(e => e.id === id);
    if (emp) openModal(emp);
}

async function fireEmployee(id) {
    if (!confirm('Вы уверены, что хотите уволить сотрудника?')) return;
    
    await fetch(`${API_URL}/${id}/fire`, { method: 'PATCH' });
    fetchEmployees();
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('employeeId').value;
    
    const passportValue = passportMask.value.replace(/\s/g, '');
    const passport_series = passportValue.substring(0, 4);
    const passport_number = passportValue.substring(4);

    const data = {
        full_name: document.getElementById('fullName').value,
        birth_date: document.getElementById('birthDate').value,
        passport_series: passport_series,
        passport_number: passport_number,
        contact_info: contactMask.value,
        address: document.getElementById('address').value,
        department: document.getElementById('department').value,
        position: document.getElementById('position').value,
        salary: parseFloat(document.getElementById('salary').value),
        hire_date: document.getElementById('hireDate').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        closeModal();
        fetchEmployees();
    } else {
        const err = await res.json();
        alert(`Ошибка: ${err.error}`);
    }
}
