// Advanced Sports Card Tracker with Professional Features
class AdvancedCardTracker {
    constructor() {
        this.cards = JSON.parse(localStorage.getItem('advancedSportsCards')) || [];
        this.currentPeriod = 'all';
        this.currentSport = 'all';
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserPreferences();
        this.renderDashboard();
        this.showNotification('🚀 Advanced Sports Card Tracker Loaded!', 'success');
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('cardForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCard();
        });

        // Period filter buttons
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByPeriod(e.target.dataset.period);
            });
        });

        // Sport filter
        document.getElementById('sportFilter').addEventListener('change', (e) => {
            this.currentSport = e.target.value;
            this.renderCards();
            this.renderCharts();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Export functionality
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.showExportModal();
        });

        document.getElementById('exportCSV').addEventListener('click', () => {
            this.exportToCSV();
        });

        document.getElementById('exportPDF').addEventListener('click', () => {
            this.exportToPDF();
        });

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('exportModal').style.display = 'none';
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.id === 'exportModal') {
                e.target.style.display = 'none';
            }
        });
    }

    addCard() {
        const cardData = {
            id: Date.now() + Math.random(),
            name: document.getElementById('cardName').value,
            playerName: document.getElementById('playerName').value,
            sport: document.getElementById('sport').value,
            year: parseInt(document.getElementById('year').value) || new Date().getFullYear(),
            grade: document.getElementById('grade').value,
            purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
            salePrice: parseFloat(document.getElementById('salePrice').value),
            purchaseDate: document.getElementById('purchaseDate').value || new Date().toISOString().split('T')[0],
            saleDate: document.getElementById('saleDate').value,
            fees: parseFloat(document.getElementById('fees').value) || 0,
            taxRate: parseFloat(document.getElementById('taxRate').value) || 0,
            period: document.getElementById('period').value,
            notes: document.getElementById('notes').value,
            status: 'sold',
            createdAt: new Date().toISOString()
        };

        // Advanced profit calculation
        const netProfit = cardData.salePrice - cardData.purchasePrice - cardData.fees;
        const taxAmount = netProfit * (cardData.taxRate / 100);
        const finalProfit = netProfit - taxAmount;
        
        cardData.profit = finalProfit;
        cardData.roi = (finalProfit / cardData.purchasePrice) * 100;
        cardData.taxAmount = taxAmount;
        cardData.netProfit = netProfit;

        this.cards.push(cardData);
        this.saveToLocalStorage();
        this.renderDashboard();
        
        this.showNotification(`✅ Added "${cardData.name}" to portfolio!`, 'success');
        document.getElementById('cardForm').reset();
    }

    deleteCard(cardId) {
        this.cards = this.cards.filter(card => card.id !== cardId);
        this.saveToLocalStorage();
        this.renderDashboard();
        this.showNotification('🗑️ Card deleted from portfolio', 'info');
    }

    saveToLocalStorage() {
        localStorage.setItem('advancedSportsCards', JSON.stringify(this.cards));
    }

    filterByPeriod(period) {
        this.currentPeriod = period;
        
        // Update active button
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });

        this.renderCards();
        this.renderCharts();
        this.updateQuickStats();
    }

    getFilteredCards() {
        let filtered = this.cards;

        if (this.currentPeriod !== 'all') {
            filtered = filtered.filter(card => card.period === this.currentPeriod);
        }

        if (this.currentSport !== 'all') {
            filtered = filtered.filter(card => card.sport === this.currentSport);
        }

        return filtered;
    }

    renderDashboard() {
        this.renderCards();
        this.updateQuickStats();
        this.renderCharts();
    }

    renderCards() {
        const container = document.getElementById('cardsContainer');
        const filteredCards = this.getFilteredCards();

        if (filteredCards.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🃏</div>
                    <h3>No cards found</h3>
                    <p>Add your first card or adjust your filters to see your portfolio</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredCards.map(card => `
            <div class="card-item fade-in">
                <div class="card-info">
                    <h4>${card.name}</h4>
                    <div class="card-details">
                        ${card.playerName} • ${this.capitalizeFirstLetter(card.sport)} • ${card.year}
                        ${card.grade !== 'raw' ? `• ${card.grade.toUpperCase()}` : ''}
                    </div>
                    ${card.notes ? `<div class="card-notes"><small>${card.notes}</small></div>` : ''}
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
                    <div class="profit-label">Net Profit</div>
                    <div class="profit-value">${card.profit >= 0 ? '+' : ''}$${card.profit.toFixed(2)}</div>
                </div>
                
                <div class="card-roi">
                    <div class="roi-label">ROI</div>
                    <div class="roi-value">${card.roi.toFixed(1)}%</div>
                </div>
                
                <div class="period-badge">${this.getPeriodName(card.period)}</div>
                
                <button class="delete-btn" onclick="app.deleteCard('${card.id}')">Delete</button>
            </div>
        `).join('');
    }

    updateQuickStats() {
        const filteredCards = this.getFilteredCards();
        const allCards = this.cards;
        
        const totalPortfolio = allCards.reduce((sum, card) => sum + card.salePrice, 0);
        const totalProfit = filteredCards.reduce((sum, card) => sum + card.profit, 0);
        const totalCards = filteredCards.length;
        const avgROI = totalCards > 0 ? 
            filteredCards.reduce((sum, card) => sum + card.roi, 0) / totalCards : 0;

        // Calculate changes (simulated for demo)
        const profitChange = totalProfit > 0 ? '+12.5%' : '-5.2%';
        const portfolioChange = '+8.3%';

        document.getElementById('totalPortfolioValue').textContent = `$${totalPortfolio.toFixed(2)}`;
        document.getElementById('totalProfit').textContent = `$${totalProfit.toFixed(2)}`;
        document.getElementById('totalCards').textContent = totalCards;
        document.getElementById('avgROI').textContent = `${avgROI.toFixed(1)}%`;
        
        document.getElementById('profitChange').textContent = profitChange;
        document.getElementById('portfolioChange').textContent = portfolioChange;
    }

    renderCharts() {
        this.renderProfitChart();
        this.renderROIChart();
        this.renderVolumeChart();
        this.renderSportDistributionChart();
    }

    renderProfitChart() {
        const ctx = document.getElementById('profitChart').getContext('2d');
        const periods = ['week1', 'week2', 'week3', 'week4', 'month1', 'month2', 'month3'];
        const profitData = periods.map(period => {
            const periodCards = this.cards.filter(card => card.period === period);
            return periodCards.reduce((sum, card) => sum + card.profit, 0);
        });

        if (this.charts.profitChart) {
            this.charts.profitChart.destroy();
        }

        this.charts.profitChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Month 1', 'Month 2', 'Month 3'],
                datasets: [{
                    label: 'Net Profit ($)',
                    data: profitData,
                    backgroundColor: profitData.map(profit => 
                        profit >= 0 ? 'rgba(40, 167, 69, 0.8)' : 'rgba(220, 53, 69, 0.8)'
                    ),
                    borderColor: profitData.map(profit => 
                        profit >= 0 ? 'rgba(40, 167, 69, 1)' : 'rgba(220, 53, 69, 1)'
                    ),
                    borderWidth: 2,
                    borderRadius: 8
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
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Profit ($)'
                        }
                    }
                }
            }
        });
    }

    renderROIChart() {
        const ctx = document.getElementById('roiChart').getContext('2d');
        const periods = ['week1', 'week2', 'week3', 'week4', 'month1', 'month2', 'month3'];
        const roiData = periods.map(period => {
            const periodCards = this.cards.filter(card => card.period === period);
            if (periodCards.length === 0) return 0;
            const totalROI = periodCards.reduce((sum, card) => sum + card.roi, 0);
            return totalROI / periodCards.length;
        });

        if (this.charts.roiChart) {
            this.charts
