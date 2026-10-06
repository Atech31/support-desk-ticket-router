const API_URL = 'http://localhost:8081/api/tickets';
const USER_API_URL = 'http://localhost:8081/api/users';

let allTickets = [];
let availableAgents = [];

// PAGINATION & SORTING STATE
let currentPage = 1;
let pageSize = 10;
let sortColumn = 'id';
let sortDirection = 'asc';

// ==========================================
// 1. INITIALIZATION & DATA FETCHING
// ==========================================

async function init() {
    await fetchAgents();
    await fetchTickets();
    setupRealtimeUpdates(); // Live SSE updates connected on startup
}

async function fetchAgents() {
    try {
        const res = await fetch(`${USER_API_URL}/role/AGENT`);
        if (res.ok) {
            availableAgents = await res.json();
            populateAgentFilter();
        }
    } catch (err) {
        console.error('Failed to fetch agents:', err);
    }
}

function populateAgentFilter() {
    const filterAgentSelect = document.getElementById('filterAgent');
    if (!filterAgentSelect) return;
    
    filterAgentSelect.innerHTML = '<option value="">All Agents</option>' + 
        availableAgents.map(agent => `<option value="${agent.id}">${escapeHtml(agent.name)}</option>`).join('');
}

async function fetchTickets() {
    try {
        const res = await fetch(API_URL);
        allTickets = await res.json();
        applyMultiFilter();
        updateAnalytics(allTickets);
    } catch (err) {
        console.error('Failed to fetch tickets:', err);
    }
}

// ==========================================
// 2. ANALYTICS & SLA COMPUTATIONS
// ==========================================

function updateAnalytics(tickets) {
    const openCard = document.getElementById('metricOpenTickets');
    const criticalCard = document.getElementById('metricCriticalEscalations');
    const avgCard = document.getElementById('metricAvgResolution');
    const breachCard = document.getElementById('metricSlaBreaches');

    if (!openCard) return;

    const openCount = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const criticalCount = tickets.filter(t => (t.priority === 'HIGH' || t.priority === 'CRITICAL') && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
    
    const breachCount = tickets.filter(t => {
        if (t.status === 'RESOLVED' || t.status === 'CLOSED' || !t.slaDueAt) return false;
        return new Date(t.slaDueAt) - new Date() <= 0;
    }).length;

    const resolved = tickets.filter(t => t.status === 'RESOLVED' && t.createdAt && t.resolvedAt);
    let avgHours = 0;
    if (resolved.length > 0) {
        const totalMs = resolved.reduce((acc, t) => acc + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0);
        avgHours = (totalMs / (resolved.length * 1000 * 60 * 60)).toFixed(1);
    }

    openCard.innerText = openCount;
    criticalCard.innerText = criticalCount;
    if (breachCard) breachCard.innerText = breachCount;
    if (avgCard) avgCard.innerText = `${avgHours}h`;
}

function getSlaTarget(priority) {
    switch (priority) {
        case 'CRITICAL': return '1h';
        case 'HIGH': return '2h';
        case 'MEDIUM': return '8h';
        case 'LOW': return '24h';
        default: return 'N/A';
    }
}

function getSlaStatus(slaDueAt, status, priority) {
    const target = getSlaTarget(priority);
    if (status === 'RESOLVED' || status === 'CLOSED') {
        return { text: `<span style="color: #34d399;">Completed</span> <small style="color:#aaa;">(Target: ${target})</small>`, state: 'completed' };
    }
    if (!slaDueAt) return { text: `N/A <small style="color:#aaa;">(Target: ${target})</small>`, state: 'normal' };

    const diff = new Date(slaDueAt) - new Date();
    if (diff <= 0) {
        return { text: `<span style="color: #f87171; font-weight: bold;">BREACHED</span> <small style="color:#aaa;">(Target: ${target})</small>`, state: 'breached' };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 60 * 60 * 1000) {
        return { text: `<span style="color: #fbbf24; font-weight: bold;">${mins}m remaining</span> <small style="color:#aaa;">(Target: ${target})</small>`, state: 'warning' };
    }

    return { text: `<span style="color: #60a5fa;">${hours}h ${mins}m remaining</span> <small style="color:#aaa;">(Target: ${target})</small>`, state: 'normal' };
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[match]);
}

// ==========================================
// 3. TABLE RENDERING & FILTERS
// ==========================================

function renderTable(tickets) {
    const table = document.getElementById('ticketTable');
    if (!table) return;

    table.innerHTML = tickets.map(t => {
        const sla = getSlaStatus(t.slaDueAt, t.status, t.priority);

        let rowStyle = '';
        if (sla.state === 'breached') {
            rowStyle = 'background-color: rgba(239, 68, 68, 0.15);';
        } else if (sla.state === 'warning') {
            rowStyle = 'background-color: rgba(245, 158, 11, 0.15);';
        }

        const agentOptions = availableAgents.map(agent => {
            const isSelected = t.assignedAgent && t.assignedAgent.id === agent.id ? 'selected' : '';
            return `<option value="${agent.id}" ${isSelected}>${escapeHtml(agent.name)}</option>`;
        }).join('');

        const currentAgentId = t.assignedAgent ? t.assignedAgent.id : '';

        return `
            <tr style="${rowStyle}">
                <td style="font-weight: 600; color: var(--text-secondary);">${t.id}</td>
                <td><strong style="color: var(--text-primary);">${escapeHtml(t.title)}</strong></td>
                <td style="color: var(--text-secondary); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(t.description)}</td>
                <td><span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span></td>
                <td>
                    <div class="action-group">
                        <span class="badge badge-${t.status.toLowerCase()}">${t.status}</span>
                        <select id="status-${t.id}" class="btn-sm">
                            <option value="OPEN" ${t.status === 'OPEN' ? 'selected' : ''}>OPEN</option>
                            <option value="IN_PROGRESS" ${t.status === 'IN_PROGRESS' ? 'selected' : ''}>IN_PROGRESS</option>
                            <option value="RESOLVED" ${t.status === 'RESOLVED' ? 'selected' : ''}>RESOLVED</option>
                            <option value="CLOSED" ${t.status === 'CLOSED' ? 'selected' : ''}>CLOSED</option>
                        </select>
                        <button class="btn-sm" onclick="updateTicketStatus(${t.id})">Update</button>
                    </div>
                </td>
                <td>${sla.text}</td>
                <td>
                    <select id="agent-${t.id}" class="btn-sm" onchange="assignAgent(${t.id})">
                        <option value="" ${!currentAgentId ? 'selected' : ''}>Unassigned</option>
                        ${agentOptions}
                    </select>
                </td>
                <td>
                    <div class="action-group">
                        <button class="btn-sm" style="background:#3b82f6; color:#fff;" onclick="viewAuditLogs(${t.id})">Logs</button>
                        <button class="btn-sm" style="background:#ef4444; color:#fff;" onclick="deleteTicket(${t.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getFilteredTickets() {
    const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const priority = document.getElementById('filterPriority')?.value || '';
    const status = document.getElementById('filterStatus')?.value || '';
    const agentId = document.getElementById('filterAgent')?.value || '';

    return allTickets.filter(t => {
        const matchesQuery = (t.title || '').toLowerCase().includes(query) || (t.description || '').toLowerCase().includes(query);
        const matchesPriority = !priority || t.priority === priority;
        const matchesStatus = !status || t.status === status;
        const matchesAgent = !agentId || (t.assignedAgent && t.assignedAgent.id.toString() === agentId);

        return matchesQuery && matchesPriority && matchesStatus && matchesAgent;
    });
}

function applyMultiFilter() {
    let filtered = getFilteredTickets();

    // Sort data
    filtered.sort((a, b) => {
        let valA = a[sortColumn] ?? '';
        let valB = b[sortColumn] ?? '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Paginate data
    const totalPages = Math.ceil(filtered.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * pageSize;
    const paginatedTickets = filtered.slice(startIndex, startIndex + pageSize);

    // Update pagination UI controls
    const pageIndicator = document.getElementById('pageIndicator');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (pageIndicator) pageIndicator.innerText = `Page ${currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;

    renderTable(paginatedTickets);
}

function resetFilters() {
    if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
    if (document.getElementById('filterPriority')) document.getElementById('filterPriority').value = '';
    if (document.getElementById('filterStatus')) document.getElementById('filterStatus').value = '';
    if (document.getElementById('filterAgent')) document.getElementById('filterAgent').value = '';
    currentPage = 1;
    applyMultiFilter();
}

function filterBySidebar(type, element) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    resetFilters();

    if (type === 'high') {
        const priorityFilter = document.getElementById('filterPriority');
        if (priorityFilter) priorityFilter.value = 'HIGH';
    } else if (type === 'resolved') {
        const statusFilter = document.getElementById('filterStatus');
        if (statusFilter) statusFilter.value = 'RESOLVED';
    }

    applyMultiFilter();
}

// ==========================================
// 4. CRUD OPERATIONS & API MUTATIONS
// ==========================================

async function createTicket() {
    const btn = document.getElementById('submitBtn');
    if (btn) btn.disabled = true;

    const body = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        priority: document.getElementById('priority').value,
        status: 'OPEN'
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
    } catch (err) {
        console.error('Failed to create ticket:', err);
    } finally {
        if (btn) btn.disabled = false;
        fetchTickets();
    }
}

async function updateTicketStatus(id) {
    const newStatus = document.getElementById(`status-${id}`).value;
    try {
        await fetch(`${API_URL}/${id}/status?status=${newStatus}&updatedBy=DashboardUser`, {
            method: 'PUT'
        });
        fetchTickets();
    } catch (err) {
        console.error('Failed to update status:', err);
    }
}

async function assignAgent(id) {
    const agentId = document.getElementById(`agent-${id}`).value;

    try {
        await fetch(`${API_URL}/${id}/assign-agent?agentId=${agentId}&updatedBy=DashboardManager`, {
            method: 'PUT'
        });
        fetchTickets();
    } catch (err) {
        console.error('Failed to assign agent:', err);
    }
}

async function deleteTicket(id) {
    if (!confirm(`Are you sure you want to delete Ticket #${id}?`)) return;
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchTickets();
        } else {
            alert('Failed to delete ticket.');
        }
    } catch (err) {
        console.error('Error deleting ticket:', err);
    }
}

// ==========================================
// 5. AUDIT LOG MODAL HANDLERS
// ==========================================

async function viewAuditLogs(id) {
    const modal = document.getElementById('auditModal');
    const content = document.getElementById('auditContent');
    if (!modal || !content) return;

    modal.style.display = 'flex';
    content.innerHTML = 'Loading audit history...';

    try {
        const res = await fetch(`${API_URL}/${id}/audit`);
        if (res.ok) {
            const logs = await res.json();
            if (logs.length === 0) {
                content.innerHTML = '<p>No audit history found for this ticket.</p>';
            } else {
                content.innerHTML = logs.map(log => `
                    <div style="border-bottom: 1px solid #444; padding: 8px 0;">
                        <strong>Action:</strong> ${escapeHtml(log.actionTaken || 'Updated')}<br>
                        <strong>Changed By:</strong> ${escapeHtml(log.changedBy || 'SYSTEM')}<br>
                        <small style="color: #aaa;">${log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</small>
                    </div>
                `).join('');
            }
        } else {
            content.innerHTML = '<p style="color:#ef4444;">Failed to load logs.</p>';
        }
    } catch (err) {
        content.innerHTML = '<p style="color:#ef4444;">Error connecting to server.</p>';
    }
}

function closeAuditModal() {
    const modal = document.getElementById('auditModal');
    if (modal) modal.style.display = 'none';
}

// ==========================================
// 6. REAL-TIME UPDATES (SSE) & TOASTS
// ==========================================

function showToast(message) {
    console.log("NOTIFICATION:", message);
}

function setupRealtimeUpdates() {
    const eventSource = new EventSource(`${API_URL}/stream`);

    eventSource.onmessage = function(event) {
        const updatedTicket = JSON.parse(event.data);
        
        const index = allTickets.findIndex(t => t.id === updatedTicket.id);
        if (index !== -1) {
            allTickets[index] = updatedTicket;
        } else {
            allTickets.unshift(updatedTicket);
        }

        applyMultiFilter();
        updateAnalytics(allTickets);
        showToast(`Ticket #${updatedTicket.id} updated live!`);
    };

    eventSource.onerror = function(err) {
        console.warn('SSE connection lost, reconnecting...', err);
    };
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    init();
});

// ==========================================
// 7. PAGINATION & SORTING CONTROLS
// ==========================================

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSizeSelect').value, 10);
    currentPage = 1;
    applyMultiFilter();
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        applyMultiFilter();
    }
}

function nextPage() {
    const totalPages = Math.ceil(getFilteredTickets().length / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        applyMultiFilter();
    }
}

function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    applyMultiFilter();
} 