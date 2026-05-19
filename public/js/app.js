const API_URL = '/api';
let authToken = localStorage.getItem('token');
let currentUserId = localStorage.getItem('userId');
let currentUserRole = localStorage.getItem('userRole');

// Show page function
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
  const page = document.getElementById(pageName);
  if (page) {
    page.style.display = 'block';
    if (pageName === 'dashboard') {
      loadDashboard();
    } else if (pageName === 'admin-dashboard') {
      loadAdminDashboard();
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (authToken) {
    updateNavbar();
    showPage('dashboard');
    loadDashboard();
  } else {
    showPage('login');
  }
});

// Update navbar based on authentication status
function updateNavbar() {
  const navbarMenu = document.getElementById('navbarMenu');
  const navbarUser = document.getElementById('navbarUser');
  
  if (authToken) {
    navbarMenu.style.display = 'none';
    navbarUser.style.display = 'flex';
    updateBalance();
  } else {
    navbarMenu.style.display = 'flex';
    navbarUser.style.display = 'none';
  }
}

// Login handler
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error('Invalid server response');
    }

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    authToken = data.token;
    currentUserId = data.user?.id;
    currentUserRole = data.user?.role;
    
    localStorage.setItem('token', authToken);
    localStorage.setItem('userId', currentUserId);
    localStorage.setItem('userRole', currentUserRole);

    errorDiv.classList.remove('show');
    updateNavbar();
    
    if (currentUserRole === 'admin') {
      showPage('admin-dashboard');
    } else {
      showPage('dashboard');
    }
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.add('show');
  }
}

// Register handler
async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const errorDiv = document.getElementById('registerError');

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    authToken = data.token;
    currentUserId = data.user.id;
    currentUserRole = 'user';
    
    localStorage.setItem('token', authToken);
    localStorage.setItem('userId', currentUserId);
    localStorage.setItem('userRole', currentUserRole);

    errorDiv.classList.remove('show');
    updateNavbar();
    showPage('dashboard');
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.add('show');
  }
}

// Logout
function logout() {
  authToken = null;
  currentUserId = null;
  currentUserRole = null;
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
  updateNavbar();
  showPage('login');
}

// Admin logout
function adminLogout() {
  logout();
}

// Load dashboard
async function loadDashboard() {
  if (!authToken) return;

  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const user = await response.json();
    document.getElementById('dashboardBalance').textContent = `$${user.balance}`;

    // Load game history
    const historyResponse = await fetch(`${API_URL}/games/history`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const history = await historyResponse.json();
    const historyBody = document.getElementById('historyBody');
    historyBody.innerHTML = '';

    history.forEach(game => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${game.game_type}</td>
        <td>$${game.bet_amount}</td>
        <td>$${game.winnings}</td>
        <td>${game.result}</td>
        <td>${new Date(game.created_at).toLocaleDateString()}</td>
      `;
      historyBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// Update balance
async function updateBalance() {
  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const user = await response.json();
    document.getElementById('userBalance').textContent = `Saldo: $${user.balance}`;
  } catch (error) {
    console.error('Error updating balance:', error);
  }
}

// Blackjack game
async function playBlackjack() {
  const betAmount = parseFloat(document.getElementById('blackjackBet').value);
  const resultDiv = document.getElementById('blackjackResult');

  try {
    const response = await fetch(`${API_URL}/games/blackjack`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ betAmount })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    // Display cards
    document.getElementById('playerCards').textContent = data.playerCards.join(' ');
    document.getElementById('dealerCards').textContent = data.dealerCards.join(' ');
    document.getElementById('playerSum').textContent = `Suma: ${data.playerSum}`;
    document.getElementById('dealerSum').textContent = `Suma: ${data.dealerSum}`;

    // Display result
    let resultText = '';
    if (data.result === 'win') {
      resultText = `🎉 Wygrana! +$${data.winnings}`;
      resultDiv.className = 'result-message show success';
    } else if (data.result === 'bust') {
      resultText = `💥 Przeważyłeś! Koniec gry.`;
      resultDiv.className = 'result-message show failure';
    } else if (data.result === 'push') {
      resultText = `🤝 Remis!`;
      resultDiv.className = 'result-message show success';
    } else {
      resultText = `❌ Przegrana. -$${data.betAmount}`;
      resultDiv.className = 'result-message show failure';
    }

    resultDiv.textContent = resultText;
    updateBalance();
  } catch (error) {
    alert(error.message);
  }
}

// Roulette game
async function playRoulette() {
  const betAmount = parseFloat(document.getElementById('rouletteBet').value);
  const betType = document.getElementById('betType').value;
  const betValue = betType === 'number' ? document.getElementById('betNumber').value : null;
  const resultDiv = document.getElementById('rouletteResult');

  try {
    const response = await fetch(`${API_URL}/games/roulette`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ betAmount, betType, betValue })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    // Animate wheel
    const wheel = document.getElementById('rouletteWheel');
    wheel.style.transform = `rotate(${data.spinResult * 10}deg)`;

    // Display result
    let resultText = '';
    if (data.result === 'win') {
      resultText = `🎉 Wygrana! Wypadła liczba ${data.spinResult}. +$${data.winnings}`;
      resultDiv.className = 'result-message show success';
    } else {
      resultText = `❌ Przegrana. Wypadła liczba ${data.spinResult}. -$${data.betAmount}`;
      resultDiv.className = 'result-message show failure';
    }

    resultDiv.textContent = resultText;
    updateBalance();
  } catch (error) {
    alert(error.message);
  }
}

// Update bet options for roulette
function updateBetOptions() {
  const betType = document.getElementById('betType').value;
  const numberInput = document.getElementById('numberInput');
  
  if (betType === 'number') {
    numberInput.style.display = 'block';
  } else {
    numberInput.style.display = 'none';
  }
}

// Slots game
async function playSlots() {
  const betAmount = parseFloat(document.getElementById('slotsBet').value);
  const resultDiv = document.getElementById('slotsResult');

  try {
    const response = await fetch(`${API_URL}/games/slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ betAmount })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    // Animate reels
    const reels = ['slot1', 'slot2', 'slot3'];
    reels.forEach((id, index) => {
      const element = document.getElementById(id);
      element.classList.add('spinning');
      setTimeout(() => {
        element.textContent = data.reels[index];
        element.classList.remove('spinning');
      }, 500);
    });

    setTimeout(() => {
      // Display result
      let resultText = '';
      if (data.result === 'jackpot') {
        resultText = `🤑 JACKPOT! +$${data.winnings}`;
        resultDiv.className = 'result-message show success';
      } else if (data.result === 'win') {
        resultText = `🎉 Wygrana! +$${data.winnings}`;
        resultDiv.className = 'result-message show success';
      } else {
        resultText = `❌ Przegrana. -$${data.betAmount}`;
        resultDiv.className = 'result-message show failure';
      }

      resultDiv.textContent = resultText;
      updateBalance();
    }, 600);
  } catch (error) {
    alert(error.message);
  }
}

// Admin Login
async function handleAdminLogin(e) {
  e.preventDefault();
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  const errorDiv = document.getElementById('adminLoginError');

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok || data.user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    authToken = data.token;
    currentUserId = data.user.id;
    currentUserRole = data.user.role;
    
    localStorage.setItem('token', authToken);
    localStorage.setItem('userId', currentUserId);
    localStorage.setItem('userRole', currentUserRole);

    errorDiv.classList.remove('show');
    showPage('admin-dashboard');
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.add('show');
  }
}

// Load admin dashboard
async function loadAdminDashboard() {
  if (!authToken || currentUserRole !== 'admin') return;

  try {
    // Load statistics
    const statsResponse = await fetch(`${API_URL}/admin/statistics`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const stats = await statsResponse.json();

    document.getElementById('adminTotalUsers').textContent = stats.totalUsers;
    document.getElementById('adminTotalBalance').textContent = `$${stats.totalBalance || 0}`;
    document.getElementById('adminTotalGames').textContent = stats.totalGames;
    document.getElementById('adminTotalPayouts').textContent = `$${stats.totalPayouts || 0}`;

    // Load users
    loadUsers();

    // Load game stats
    loadGameStats();

    // Load logs
    loadAdminLogs();
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
  }
}

// Load users
async function loadUsers() {
  if (!authToken || currentUserRole !== 'admin') return;

  try {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const users = await response.json();
    const usersBody = document.getElementById('usersBody');
    usersBody.innerHTML = '';

    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td>$${user.balance}</td>
        <td>
          <button class="btn btn-primary" onclick="openUserModal(${user.id})">Szczegóły</button>
        </td>
      `;
      usersBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Load game stats
async function loadGameStats() {
  if (!authToken || currentUserRole !== 'admin') return;

  try {
    const response = await fetch(`${API_URL}/admin/game-stats`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const stats = await response.json();
    const statsBody = document.getElementById('gamesStatsBody');
    statsBody.innerHTML = '';

    stats.forEach(stat => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${stat.game_type}</td>
        <td>${stat.count}</td>
        <td>$${stat.totalBets}</td>
        <td>$${stat.totalPayouts}</td>
      `;
      statsBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading game stats:', error);
  }
}

// Load admin logs
async function loadAdminLogs() {
  if (!authToken || currentUserRole !== 'admin') return;

  try {
    const response = await fetch(`${API_URL}/admin/logs`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const logs = await response.json();
    const logsBody = document.getElementById('logsBody');
    logsBody.innerHTML = '';

    logs.forEach(log => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(log.created_at).toLocaleString()}</td>
        <td>${log.action}</td>
        <td>${log.description}</td>
      `;
      logsBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading admin logs:', error);
  }
}

// Open user modal
async function openUserModal(userId) {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const user = await response.json();

    document.getElementById('modalUserName').textContent = `${user.username}`;
    document.getElementById('modalUserEmail').textContent = user.email;
    document.getElementById('modalUserBalance').value = user.balance;
    document.getElementById('userModal').dataset.userId = userId;

    // Display game history
    let historyHtml = '<h3>Historia gier</h3><ul>';
    user.gameHistory.forEach(game => {
      historyHtml += `<li>${game.game_type} - Stawka: $${game.bet_amount}, Wygrana: $${game.winnings} (${game.result})</li>`;
    });
    historyHtml += '</ul>';
    document.getElementById('modalUserHistory').innerHTML = historyHtml;

    document.getElementById('userModal').style.display = 'flex';
  } catch (error) {
    console.error('Error opening user modal:', error);
  }
}

// Update user balance
async function updateUserBalance() {
  const userId = document.getElementById('userModal').dataset.userId;
  const newBalance = parseFloat(document.getElementById('modalUserBalance').value);

  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/balance`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ newBalance })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    alert('Saldo zaktualizowane!');
    closeModal();
    loadUsers();
  } catch (error) {
    alert(error.message);
  }
}

// Delete user
async function deleteUser() {
  const userId = document.getElementById('userModal').dataset.userId;

  if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;

  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    alert('Użytkownik usunięty!');
    closeModal();
    loadUsers();
  } catch (error) {
    alert(error.message);
  }
}

// Close modal
function closeModal() {
  document.getElementById('userModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('userModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
}
