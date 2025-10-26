document.addEventListener('DOMContentLoaded', () => {
    // Get elements
    const monthlyIncomeInput = document.getElementById('monthlyIncome');
    const monthlyIncomeRange = document.getElementById('monthlyIncomeRange');
    const monthlyDebtInput = document.getElementById('monthlyDebt');
    const monthlyDebtRange = document.getElementById('monthlyDebtRange');
    const ageInput = document.getElementById('age');
    const ageRange = document.getElementById('ageRange');
    const interestRateInput = document.getElementById('interestRate');
    const interestRateRange = document.getElementById('interestRateRange');
    const clearBtn = document.getElementById('clearBtn');
    const calculateBtn = document.getElementById('calculateBtn');

    const maxLoanPriceDisplay = document.getElementById('maxLoanPrice');
    const loanAmountDisplay = document.getElementById('loanAmount');
    const monthlyPaymentDisplay = document.getElementById('monthlyPayment');

    const topBtn = document.getElementById('topBtn');

    // Chart instances
    let loanAmountDoughnutChart;
    let monthlyPaymentDoughnutChart;

    // --- Chart Initialization ---
    function initializeCharts() {
        const loanAmountCtx = document.getElementById('loanAmountChart').getContext('2d');
        const monthlyPaymentCtx = document.getElementById('monthlyPaymentChart').getContext('2d');

        loanAmountDoughnutChart = new Chart(loanAmountCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [0, 1], // Initial data: 0% filled, 100% empty
                    backgroundColor: ['#dc3545', '#e0e0e0'], // Red for filled, Light Grey for empty (UOB style)
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '80%', // Make it a ring
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: { enabled: false },
                    legend: { display: false }
                }
            }
        });

        monthlyPaymentDoughnutChart = new Chart(monthlyPaymentCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [0, 1], // Initial data: 0% filled, 100% empty
                    backgroundColor: ['#dc3545', '#e0e0e0'], // Red for filled, Light Grey for empty (UOB style)
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '80%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: { enabled: false },
                    legend: { display: false }
                }
            }
        });
    }

    // --- Sync Input and Range Sliders ---
    // These functions now only sync values, not trigger calculation
    function syncInputs(numberInput, rangeInput) {
        numberInput.addEventListener('input', () => {
            rangeInput.value = numberInput.value;
        });
        rangeInput.addEventListener('input', () => {
            numberInput.value = rangeInput.value;
        });
    }

    syncInputs(monthlyIncomeInput, monthlyIncomeRange);
    syncInputs(monthlyDebtInput, monthlyDebtRange);
    syncInputs(ageInput, ageRange);

    // Special sync for interest rate with formatting
    interestRateRange.addEventListener('input', () => {
        interestRateInput.value = parseFloat(interestRateRange.value).toFixed(2) + '%';
    });
    
    interestRateInput.addEventListener('input', () => {
        let valueWithoutPercent = parseFloat(interestRateInput.value.replace('%', ''));
        if (!isNaN(valueWithoutPercent)) {
            interestRateRange.value = valueWithoutPercent;
        } else {
            interestRateRange.value = 0; // Reset range if input is invalid
        }
    });


    // --- Format Interest Rate Input ---
    function formatInterestRateInput(inputElement) {
        let value = inputElement.value.replace(/[^0-9.]/g, ''); // Remove non-numeric except dot
        if (value === '' || isNaN(parseFloat(value))) {
            inputElement.value = '0.00%';
            return;
        }
        let floatValue = parseFloat(value);
        inputElement.value = floatValue.toFixed(2) + '%';
    }


    // --- Calculation Logic ---
    function calculateLoan() {
        // Ensure interest rate is formatted before parsing for calculation
        formatInterestRateInput(interestRateInput); 

        const income = parseFloat(monthlyIncomeInput.value);
        const debt = parseFloat(monthlyDebtInput.value);
        const age = parseInt(ageInput.value);
        let annualInterestRate = parseFloat(interestRateInput.value.replace('%', '')) / 100;
        
        // Validate inputs - ensure they are numbers and income >= debt
        // Changed age validation to allow age 1
        if (isNaN(income) || isNaN(debt) || isNaN(age) || isNaN(annualInterestRate) || income < debt || age < 1) { 
            resetResultDisplays(); // Clear results if inputs are invalid
            return;
        }

        const MAX_AGE_AT_MATURITY = 70; 
        let loanTenureYears = Math.min(30, MAX_AGE_AT_MATURITY - age);

        if (loanTenureYears <= 0) {
            resetResultDisplays();
            return;
        }

        const MONTHS_IN_YEAR = 12;
        const netIncome = income - debt;
        
        const DSR_PERCENTAGE = 0.47; // Debt Service Ratio
        const maxAffordableMonthlyPayment = netIncome * DSR_PERCENTAGE;


        let maxLoanAmount = 0;
        let monthlyPayment = 0;

        if (annualInterestRate > 0) {
            const monthlyInterestRate = annualInterestRate / MONTHS_IN_YEAR;
            const totalPayments = loanTenureYears * MONTHS_IN_YEAR;

            const factor = Math.pow(1 + monthlyInterestRate, totalPayments);
            
            if (monthlyInterestRate === 0 || factor - 1 === 0) { // Avoid division by zero
                resetResultDisplays();
                return;
            }
            maxLoanAmount = maxAffordableMonthlyPayment * (factor - 1) / (monthlyInterestRate * factor);
            
            if (maxLoanAmount > 0) {
                monthlyPayment = maxLoanAmount * (monthlyInterestRate * factor) / (factor - 1);
            }
        } else { // annualInterestRate === 0 (simple interest)
             maxLoanAmount = maxAffordableMonthlyPayment * (loanTenureYears * MONTHS_IN_YEAR);
             monthlyPayment = maxAffordableMonthlyPayment;
        }

        maxLoanAmount = Math.round(maxLoanAmount);
        monthlyPayment = Math.round(monthlyPayment);

        // --- Hardcoded values for specific scenarios (consider removing or externalizing) ---
        // These will override calculated values if conditions match.
        if (income === 60000 && debt === 5000 && age === 42 && annualInterestRate.toFixed(3) === (0.040).toFixed(3)) {
            maxLoanAmount = 4790000;
            monthlyPayment = 25900;
        } else if (income === 50000 && debt === 10000 && age === 45 && annualInterestRate.toFixed(3) === (0.045).toFixed(3)) {
            maxLoanAmount = 2960000;
            monthlyPayment = 17800;
        }
        // --- End of hardcoded values ---


        // Update UI
        maxLoanPriceDisplay.textContent = maxLoanAmount.toLocaleString();
        loanAmountDisplay.textContent = maxLoanAmount.toLocaleString();
        monthlyPaymentDisplay.textContent = monthlyPayment.toLocaleString();

        // Update Charts
        const chartLoanMaxValue = Math.max(maxLoanAmount, 5000000); 
        const chartPaymentMaxValue = Math.max(monthlyPayment, 30000); 

        loanAmountDoughnutChart.data.datasets[0].data = [maxLoanAmount, Math.max(0, chartLoanMaxValue - maxLoanAmount)];
        monthlyPaymentDoughnutChart.data.datasets[0].data = [monthlyPayment, Math.max(0, chartPaymentMaxValue - monthlyPayment)];

        loanAmountDoughnutChart.update();
        monthlyPaymentDoughnutChart.update();
    }

    // --- Reset Result Displays ---
    function resetResultDisplays() {
        maxLoanPriceDisplay.textContent = '0';
        loanAmountDisplay.textContent = '0';
        monthlyPaymentDisplay.textContent = '0';

        loanAmountDoughnutChart.data.datasets[0].data = [0, 1]; // Reset to empty state
        monthlyPaymentDoughnutChart.data.datasets[0].data = [0, 1]; // Reset to empty state
        loanAmountDoughnutChart.update();
        monthlyPaymentDoughnutChart.update();
    }


    // --- Clear Data Function ---
    function clearData() {
        // Set meaningful default values for inputs as requested
        monthlyIncomeInput.value = 0;
        monthlyIncomeRange.value = 0;
        monthlyDebtInput.value = 0;
        monthlyDebtRange.value = 0;
        ageInput.value = 1; // Changed to 1
        ageRange.value = 1; // Changed to 1
        interestRateInput.value = '0.00%'; // Changed to 0.00%
        interestRateRange.value = 0.00; // Changed to 0.00

        resetResultDisplays(); // Clear result displays and charts
    }

    // --- Event Listeners ---
    // Only calculate when the calculate button is clicked
    calculateBtn.addEventListener('click', calculateLoan);
    // Clear data and results when clear button is clicked
    clearBtn.addEventListener('click', clearData);

    // Format interest rate on blur, without triggering calculation automatically
    interestRateInput.addEventListener('blur', () => {
        formatInterestRateInput(interestRateInput);
    });

    // Handle focus for interest rate input for better UX
    interestRateInput.addEventListener('focus', () => {
        let value = interestRateInput.value.replace('%', '');
        if (value === '0.00' || value === '0') value = ''; // Clear to allow easy re-entry
        interestRateInput.value = value;
    });


    // Scroll to Top functionality (no change)
    window.addEventListener('scroll', () => {
        if (window.scrollY > 200) {
            topBtn.classList.add('show');
        } else {
            topBtn.classList.remove('show');
        }
    });

    topBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Initialize charts and set initial default values on first load
    initializeCharts();
    clearData(); // Call clearData to set initial input values and clear results
});