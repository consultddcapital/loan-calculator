// โค้ด JavaScript
const inputs = [
    { id: 'monthlyIncome', sliderId: 'monthlyIncomeSlider', max: 1000000, min: 0 },
    { id: 'debt', sliderId: 'debtSlider', max: 500000, min: 0 },
    { id: 'age', sliderId: 'ageSlider', max: 100, min: 1 }, 
    { id: 'interestRate', sliderId: 'interestRateSlider', max: 20, step: 0.01, min: 0 }, 
    { id: 'loanTermYears', sliderId: 'loanTermYearsSlider', min: 1, max: 30 }
];

inputs.forEach(item => {
    const input = document.getElementById(item.id);
    const slider = document.getElementById(item.sliderId);

    slider.min = item.min !== undefined ? item.min : 0;
    slider.max = item.max;
    if (item.step) slider.step = item.step;
    
    // ตั้งค่าเริ่มต้นของ slider ตาม input field (เผื่อกรณีมีการโหลดค่าเริ่มต้นจาก HTML)
    slider.value = parseFloat(input.value) || item.min;

    input.addEventListener('input', () => {
        let inputValue = parseFloat(input.value);
        if (isNaN(inputValue)) {
            inputValue = item.min;
        }

        inputValue = Math.max(item.min, Math.min(inputValue, item.max));

        if (item.id === 'interestRate') {
            input.value = inputValue.toFixed(2);
        } else {
            input.value = inputValue;
        }
        slider.value = inputValue;
        // *** ลบ calculateLoan() ออกจากตรงนี้ ***
    });

    slider.addEventListener('input', () => {
        if (item.id === 'interestRate') {
            input.value = parseFloat(slider.value).toFixed(2);
        } else {
            input.value = slider.value;
        }
        // *** ลบ calculateLoan() ออกจากตรงนี้ ***
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // กำหนดค่าเริ่มต้นตามรูปภาพที่ให้มา
    document.getElementById('monthlyIncome').value = 0; 
    document.getElementById('debt').value = 0;
    document.getElementById('age').value = 1; 
    document.getElementById('interestRate').value = '0.00'; 
    document.getElementById('loanTermYears').value = 1;

    // ซิงค์ค่าของ sliders ให้ตรงกับ input fields หลังจากกำหนดค่าเริ่มต้น
    inputs.forEach(item => {
        const inputElement = document.getElementById(item.id);
        const sliderElement = document.getElementById(item.sliderId);
        if (inputElement && sliderElement) {
            sliderElement.value = parseFloat(inputElement.value);
        }
    });

    // เรียก calculateLoan() เพื่อแสดงผลลัพธ์เริ่มต้นจากการตั้งค่าเริ่มต้น (เมื่อโหลดหน้าเว็บครั้งแรก)
    calculateLoan();

    // Back to Top button functionality
    const backToTopBtn = document.getElementById('backToTopBtn');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) { 
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});


function calculateLoan() {
    const monthlyIncome = parseFloat(document.getElementById('monthlyIncome').value);
    const debt = parseFloat(document.getElementById('debt').value);
    const age = parseInt(document.getElementById('age').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value) / 100;
    let loanTermYears = parseInt(document.getElementById('loanTermYears').value);

    // ปรับ DSR และ LTV
    const maxDSR = 0.6; // DSR สูงสุด 60%
    // maxLTV = 1; // ยังคงสมมติ LTV 100% เพื่อให้เงินดาวน์เป็น 0

    // ตรวจสอบค่าที่ไม่ถูกต้องหรือเป็นศูนย์
    if (isNaN(monthlyIncome) || monthlyIncome < 0 || 
        isNaN(debt) || debt < 0 ||
        isNaN(age) || age < 1 || 
        isNaN(interestRate) || interestRate < 0 ||
        isNaN(loanTermYears) || loanTermYears < 1) { 
        displayResults(0, 0, 0, 0);
        return;
    }

    // 1. คำนวณรายได้หลังหักภาระหนี้
    const remainingIncomeAfterDebt = monthlyIncome - debt;

    // 2. คำนวณยอดผ่อนรวมสูงสุดที่ธนาคารจะอนุญาตตาม DSR
    if (remainingIncomeAfterDebt <= 0) {
        displayResults(0, 0, 0, 0);
        return;
    }

    const maxAffordableHomeInstallment = remainingIncomeAfterDebt * maxDSR;
    
    if (maxAffordableHomeInstallment <= 0) {
        displayResults(0, 0, 0, 0);
        return;
    }

    // 3. กำหนดระยะเวลากู้สูงสุดที่แท้จริงตามอายุและนโยบายธนาคาร
    const maxAgeForLoan = 70; 
    const maxLoanTermBasedOnAge = Math.max(0, (maxAgeForLoan - age)); 
    
    const actualLoanTermYears = Math.min(loanTermYears, maxLoanTermBasedOnAge, 30);
    const actualLoanTermMonths = actualLoanTermYears * 12;

    if (actualLoanTermMonths <= 0) {
        displayResults(0, 0, 0, 0);
        return;
    }
    
    // 4. คำนวณวงเงินกู้สูงสุด (Principal) จากยอดผ่อนสูงสุดที่สามารถจ่ายได้ (maxAffordableHomeInstallment)
    const monthlyInterestRate = interestRate / 12;
    let loanLimit = 0; 

    if (monthlyInterestRate > 0) {
        const term = Math.pow(1 + monthlyInterestRate, actualLoanTermMonths);
        loanLimit = maxAffordableHomeInstallment * (term - 1) / (monthlyInterestRate * term);
    } else { // กรณีดอกเบี้ย 0%
        loanLimit = maxAffordableHomeInstallment * actualLoanTermMonths;
    }

    loanLimit = Math.max(0, loanLimit); // ให้แน่ใจว่าไม่ติดลบ

    // 5. คำนวณยอดผ่อนเฉลี่ยต่อเดือน 3 ปีแรก
    const estimatedMonthlyPayment = maxAffordableHomeInstallment;
    
    // 6. คำนวณราคาบ้านสูงสุดและเงินดาวน์
    const maxLoanPrice = loanLimit; 
    const downPayment = 0; 

    displayResults(maxLoanPrice, downPayment, loanLimit, estimatedMonthlyPayment);
}

// ฟังก์ชันสำหรับแสดงผลลัพธ์บนหน้าเว็บ
function displayResults(maxLoanPrice, downPayment, loanLimit, monthlyPayment) {
    document.getElementById('maxLoanPrice').innerText = formatCurrency(maxLoanPrice);
    document.getElementById('downPayment').innerText = formatCurrency(downPayment) + ' บาท';
    document.getElementById('loanLimit').innerText = formatCurrency(loanLimit);
    document.getElementById('monthlyPayment').innerText = formatCurrency(monthlyPayment);
}

// ฟังก์ชันสำหรับจัดรูปแบบตัวเลขให้เป็นสกุลเงิน (บาท)
function formatCurrency(amount) {
    return new Intl.NumberFormat('th-TH', { 
        style: 'decimal', 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    }).format(Math.round(amount));
}

// ฟังก์ชันสำหรับล้างข้อมูลในฟอร์ม
function resetForm() {
    // กำหนดค่าเริ่มต้นตามรูปภาพที่ให้มา
    document.getElementById('monthlyIncome').value = 0;
    document.getElementById('debt').value = 0;
    document.getElementById('age').value = 1;
    document.getElementById('interestRate').value = '0.00';
    document.getElementById('loanTermYears').value = 1;

    inputs.forEach(item => {
        const inputElement = document.getElementById(item.id);
        const sliderElement = document.getElementById(item.sliderId);
        if (inputElement && sliderElement) {
            sliderElement.value = parseFloat(inputElement.value);
        }
    });

    displayResults(0, 0, 0, 0); // รีเซ็ตผลลัพธ์ทันที
}