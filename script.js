$(document).ready(function() {
    let expenses = [];
    let chart = null;
    
    $('#expenseDate').val(new Date().toISOString().split('T')[0]);
    
    function loadExpenses() {
        return expenses;
    }
    
    function saveExpenses() {
        updateDisplay();
    }
    
    function populateYearFilter() {
        const years = [...new Set(expenses.map(e => new Date(e.date).getFullYear()))];
        const currentYear = new Date().getFullYear();
        
        if (!years.includes(currentYear)) {
            years.push(currentYear);
        }
        
        years.sort((a, b) => b - a);
        
        $('#yearFilter').empty();
        years.forEach(year => {
            $('#yearFilter').append(`<option value="${year}">${year}</option>`);
        });
        
        $('#yearFilter').val(currentYear);
    }
    
    $('#expenseForm').on('submit', function(e) {
        e.preventDefault();
        
        const expense = {
            id: Date.now(),
            title: $('#expenseTitle').val().trim(),
            category: $('#expenseCategory').val(),
            amount: parseFloat($('#expenseAmount').val()),
            date: $('#expenseDate').val()
        };
        
        expenses.unshift(expense);
        saveExpenses();
        
        this.reset();
        $('#expenseDate').val(new Date().toISOString().split('T')[0]);
        
        $('<div class="alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3" style="z-index: 9999;">Expense added successfully!</div>')
            .appendTo('body')
            .fadeIn()
            .delay(2000)
            .fadeOut(function() { $(this).remove(); });
    });
    
    $(document).on('click', '.btn-delete', function() {
        const id = $(this).data('id');
        expenses = expenses.filter(e => e.id !== id);
        saveExpenses();
    });
    
    $('#yearFilter, #monthFilter, #dayFilter, #sortFilter').on('change', function() {
        if ($(this).attr('id') === 'yearFilter' || $(this).attr('id') === 'monthFilter') {
            populateDayFilter();
        }
        updateDisplay();
    });
    
    function populateDayFilter() {
        const selectedYear = parseInt($('#yearFilter').val());
        const selectedMonth = $('#monthFilter').val();
        
        $('#dayFilter').empty();
        $('#dayFilter').append('<option value="all">All Days</option>');
        
        if (selectedMonth === 'all') {
            return;
        }
        
        const monthIndex = parseInt(selectedMonth);
        const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            $('#dayFilter').append(`<option value="${day}">${day}</option>`);
        }
    }
    
    function updateDisplay() {
        const selectedYear = parseInt($('#yearFilter').val());
        const selectedMonth = $('#monthFilter').val();
        const selectedDay = $('#dayFilter').val();
        const sortBy = $('#sortFilter').val();
        
        let periodText = selectedYear.toString();
        if (selectedMonth !== 'all') {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            periodText = monthNames[parseInt(selectedMonth)] + ' ' + selectedYear;
            
            if (selectedDay !== 'all') {
                periodText = monthNames[parseInt(selectedMonth)] + ' ' + selectedDay + ', ' + selectedYear;
            }
        }
        $('#selectedPeriod').text(periodText);
        
        let filteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            const yearMatch = expenseDate.getFullYear() === selectedYear;
            
            if (selectedMonth === 'all') {
                return yearMatch;
            }
            
            const monthMatch = expenseDate.getMonth() === parseInt(selectedMonth);
            
            if (selectedDay === 'all') {
                return yearMatch && monthMatch;
            }
            
            const dayMatch = expenseDate.getDate() === parseInt(selectedDay);
            return yearMatch && monthMatch && dayMatch;
        });
        
        filteredExpenses.sort((a, b) => {
            switch(sortBy) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'amount-asc':
                    return a.amount - b.amount;
                default:
                    return 0;
            }
        });
        
        const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalAll = expenses.reduce((sum, e) => sum + e.amount, 0);
        
        $('#totalAmount').text('$' + total.toFixed(2));
        $('#totalAllTime').text('$' + totalAll.toFixed(2));
        $('#expenseCount').text(filteredExpenses.length);
        
        if (filteredExpenses.length === 0) {
            $('#expenseList').html('<div class="no-expenses"><i class="fas fa-inbox fa-3x mb-3"></i><br>Found no expenses.</div>');
        } else {
            let html = '';
            filteredExpenses.forEach(expense => {
                const date = new Date(expense.date);
                const formattedDate = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
                
                html += `
                    <div class="expense-item">
                        <div class="expense-info">
                            <div class="expense-title">
                                ${expense.title}
                                <span class="category-badge" style="background: #e0e7ff; color: #4f46e5;">${expense.category}</span>
                            </div>
                            <div class="expense-date"><i class="far fa-calendar"></i> ${formattedDate}</div>
                        </div>
                        <div class="d-flex align-items-center">
                            <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                            <button class="btn-delete" data-id="${expense.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            $('#expenseList').html(html);
        }
        
        updateChart(filteredExpenses);
        populateYearFilter();
    }
    
    function updateChart(filteredExpenses) {
        const monthlyData = Array(12).fill(0);
        
        filteredExpenses.forEach(expense => {
            const month = new Date(expense.date).getMonth();
            monthlyData[month] += expense.amount;
        });
        
        const ctx = document.getElementById('expenseChart').getContext('2d');
        
        if (chart) {
            chart.destroy();
        }
        
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Monthly Expenses ($)',
                    data: monthlyData,
                    backgroundColor: 'rgba(99, 102, 241, 0.7)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }
    
    expenses = loadExpenses();
    populateYearFilter();
    populateDayFilter();
    updateDisplay();
});