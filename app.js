// Simple Sports Card Tracker - GUARANTEED WORKING
class CardTracker {
    constructor() {
        this.cards = JSON.parse(localStorage.getItem('sportsCards')) || [];
        this.currentPeriod = 'all';
        this.init();
    }

    init() {
        console.log('🚀 CardTracker initialized!'); // Debug line
        this.setupEventListeners();
        this.renderDashboard();
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('cardForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addCard();
            });
            console.log('✅ Form event listener added');
        } else {
            console.error('❌ Form not found!');
        }

        // Period filter buttons
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByPeriod(e.target.dataset.period);
            });
        });

        // Theme toggle
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    addCard() {
        console.log('➕ Add card button clicked'); // Debug
        
        // Get form values
        const cardData = {
            id: Date.now(),
            name: document.getElementById('cardName').value,
            playerName: document.getElementById('playerName').value || 'Unknown Player',
            sport: document.getElementById('sport').value,
            year: document.getElementById('year').value || new Date().getFullYear(),
            grade: document.getElementById('grade').value,
            purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
            salePrice: parseFloat(document.getElementById('salePrice').value),
            purchaseDate: document.getElementById('purchaseDate').value || new Date().toISOString().split('T')[0],
            saleDate: document.getElementById('saleDate').value,
            period: document.getElementById('period').value,
            notes: document.getElementById('notes').value || '',
            status: 'sold'
        };

        // Validate required fields
        if (!cardData.name || !cardData.purchasePrice || !cardData.salePrice || !cardData.period) {
            alert('❌ Please fill in all required fields!');
            return;
        }

        // Calculate profit and ROI
        cardData.profit = cardData.salePrice - cardData.purchasePrice;
        cardData.roi = (cardData.profit / cardData.purchasePrice) * 100;

        console.log('📦 Card data:', cardData); // Debug

        // Add to array and save
        this.cards.push(cardData);
        this.saveToLocalStorage();
        this.renderDashboard();
        
        // Reset form
        document.getElementById('cardForm').reset();
        
        // Show success message
        this.showNotification(`✅ Added "${cardData.name}" to portfolio!`, 'success');
    }

    deleteCard(cardId) {
        if (confirm('Are you sure you want to delete this card?')) {
            this.cards = this.cards.filter(card => card.id !== cardId);
            this.saveToLocalStorage();
            this.renderDashboard();
            this.showNotification('🗑️ Card deleted', 'info');
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('sportsCards', JSON.stringify(this.cards));
        console.log('💾 Saved to localStorage. Total cards:', this.cards.length);
    }

    filterByPeriod(period) {
        this.currentPeriod = period;
        
        // Update active button
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });

        this.renderCards();
        this.updateStats();
        this.renderCharts();
    }

    getFilteredCards() {
        if (this.currentPeriod === 'all') {
            return this.cards;
        }
        return this.cards.filter(card => card.period === this.currentPeriod);
    }

    renderDashboard() {
        console.log('🔄 Rendering dashboard...'); // Debug
        this.renderCards();
        this.updateStats();
        this.renderCharts();
    }

    renderCards() {
        const container = document.getElementById('cardsContainer');
        const filteredCards = this.getFilteredCards();

        if (!container) {
            console.error('❌ cardsContainer not found!');
            return;
        }

        if (filteredCards.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🃏</div>
                    <h3>No cards found</h3>
                    <p>Add your first card above to start tracking!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredCards.map(card => `
            <div class="card-item fade-in">
                <div class="card-info">
                    <h4>${this.escapeHtml(card.name)}</h4>
                    <div class="card-details">
                        ${this.escapeHtml(card.playerName)} • ${this.capitalizeFirstLetter(card.sport)} • ${card.year}
                        ${card.grade !== 'raw' ? `• ${card.grade.toUpperCase()}` : ''}
                    </div>
                    ${card.notes ? `<div class="card-notes"><small>${this.escapeHtml(card.notes)}</small></div>` : ''}
                </div>
                
                <div class="card-price">
                    <div class="price-label">Cost</div>
                    <div class="price-value">$${card.purchasePrice.toFixed(2)}</div>
                </div>
                
                <div class="card-price">
                    <div class="price-label">Sale</div>
                    <div class="price-value">$${card.salePrice.toFixed(2)}</div>
                </div>
                
                <div class="card-profit ${card.profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                    <div class="profit-label">Profit</div>
                    <div class="profit-value">${card.profit >= 0 ? '+' : ''}$${card.profit.toFixed(2)}</div>
                </div>
                
                <div class="card-roi">
                    <div class="roi-label">ROI</div>
                    <div class="roi-value">${card.roi.toFixed(1)}%</div>
                </div>
                
                <div class="period-badge">${this.getPeriodName(card.period)}</div>
                
                <button class="delete-btn" onclick="cardTracker.deleteCard(${card.id})">Delete</button>
            </div>
        `).join('');

        console.log('✅ Cards rendered:', filteredCards.length); // Debug
    }

    updateStats() {
        const filteredCards = this.getFilteredCards();
        
        const totalProfit = filteredCards.reduce((sum, card) => sum + card.profit, 0);
        const totalCards = filteredCards.length;
        const totalPortfolio = filteredCards.reduce((sum, card) => sum + card.salePrice, 0);
        const avgROI = totalCards > 0 ? 
            filteredCards.reduce((sum, card) => sum + card.roi, 0) / totalCards : 0;

        // Update DOM elements
        this.updateElement('totalPortfolioValue', `$${totalPortfolio.toFixed(2)}`);
        this.updateElement('totalProfit', `$${totalProfit.toFixed(2)}`);
        this.updateElement('totalCards', totalCards);
        this.updateElement('avgROI', `${avgROI.toFixed(1)}%`);

        console.log('📊 Stats updated'); // Debug
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    renderCharts() {
        console.log('📈 Rendering charts...'); // Debug
        this.renderProfitChart();
        this.renderROIChart();
    }

    renderProfitChart() {
        const ctx = document.getElementById('profitChart');
        if (!ctx) {
            console.log('📊 Profit chart element not found yet');
            return;
        }

        const periods = ['week1', 'week2', 'week3', 'week4', 'month1', 'month2', 'month3'];
        const profitData = periods.map(period => {
            const periodCards = this.cards.filter(card => card.period === period);
            return periodCards.reduce((sum, card) => sum + card.profit, 0);
        });

        // Destroy existing chart
        if (this.profitChart) {
            this.profitChart.destroy();
        }

        this.profitChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Month 1', 'Month 2', 'Month 3'],
                datasets: [{
                    label: 'Profit ($)',
                    data: profitData,
                    backgroundColor: profitData.map(profit => 
                        profit >= 0 ? 'rgba(40, 167, 69, 0.8)' : 'rgba(220, 53, 69, 0.8)'
                    ),
                    borderColor: profitData.map(profit => 
                        profit >= 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'
                    ),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Profit by Period'
                    }
                }
            }
        });

        console.log('✅ Profit chart rendered'); // Debug
    }

    renderROIChart() {
        const ctx = document.getElementById('roiChart');
        if (!ctx) {
            console.log('📈 ROI chart element not found yet');
            return;
        }

        const periods = ['week1', 'week2', 'week3', 'week4', 'month1', 'month2', 'month3'];
        const roiData = periods.map(period => {
            const periodCards = this.cards.filter(card => card.period === period);
            if (periodCards.length === 0) return 0;
            const totalROI = periodCards.reduce((sum, card) => sum + card.roi, 0);
            return totalROI / periodCards.length;
        });

        // Destroy existing chart
        if (this.roiChart) {
            this.roiChart.destroy();
        }

        this.roiChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Month 1', 'Month 2', 'Month 3'],
                datasets: [{
                    label: 'Average ROI (%)',
                    data: roiData,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'ROI Trend'
                    }
                }
            }
        });

        console.log('✅ ROI chart rendered'); // Debug
    }

    // Utility functions
    getPeriodName(periodId) {
        const periodMap = {
            'week1': 'Week 1', 'week2': 'Week 2', 'week3': 'Week 3', 'week4': 'Week 4',
            'month1': 'Month 1', 'month2': 'Month 2', 'month3': 'Month 3',
            'q1': 'Q1', 'q2': 'Q2', 'q3': 'Q3', 'q4': 'Q4'
        };
        return periodMap[periodId] || periodId;
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        document.getElementById('themeToggle').textContent = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        
        localStorage.setItem('theme', newTheme);
    }

    showNotification(message, type = 'info') {
        // Simple alert for now - you can enhance this later
        alert(message);
    }
}

// Initialize the application when page loads
console.log('🔄 Starting CardTracker...');
const cardTracker = new CardTracker();

// Make it globally available for HTML onclick events
window.cardTracker = cardTracker;

console.log('🎉 CardTracker ready!');
