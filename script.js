code
JavaScript
// โค้ด JavaScript
const inputs = [
    { id: 'monthlyIncome', sliderId: 'monthlyIncomeSlider', max: 1000000 },
    { id: 'debt', sliderId: 'debtSlider', max: 500000 },
    { id: 'age', sliderId: 'ageSlider', max: 100 },
    // แก้ไข: เพิ่ม step และปรับ max สำหรับ interestRate
    { id: 'interestRate', sliderId: 'interestRateSlider', max: 20, step: 0.01 }, 
    { id: 'loanTermYears', sliderId: 'loanTermYearsSlider', min: 1, max: 30 }
];

inputs.forEach(item => {
    const input = document.getElementById(item.id);
    const slider = document.getElementById(item.sliderId);

    // กำหนดค่า min, max, step ให้กับ slider
    slider.min = item.min !== undefined ? item.min : 0; // ใช้ค่า min จาก item หรือ 0
    slider.max = item.max;
    if (item.step) slider.step = item.step;

    // เมื่อ input type="number" เปลี่ยนค่า
    input.addEventListener('input', () => {
        let inputValue = parseFloat(input.value);
        if (isNaN(inputValue) || inputValue < slider.min) { // ตรวจสอบกับ slider.min ด้วย
            inputValue = slider.min;
        }
        if (inputValue > item.max) {
            inputValue = item.max;
        }
        // แก้ไข: สำหรับ interestRate ให้ปัดเศษทศนิยม 2 ตำแหน่ง
        if (item.id === 'interestRate') {
            input.value = inputValue.toFixed(2);
        } else {
            input.value = inputValue;
        }
        slider.value = inputValue;
        // ไม่เรียก calculateLoan() ตรงนี้ เพื่อให้ต้องกดปุ่มคำนวณก่อน
    });

    // เมื่อ input type="range" (slider) เปลี่ยนค่า
    slider.addEventListener('input', () => {
        // แก้ไข: สำหรับ interestRate ให้ปัดเศษทศนิยม 2 ตำแหน่ง
        if (item.id === 'interestRate') {
            input.value = parseFloat(slider.value).toFixed(2);
        } else {
            input.value = slider.value;
        }
        // ไม่เรียก calculateLoan() ตรงนี้ เพื่อให้ต้องกดปุ่มคำนวณก่อน
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // ตั้งค่าเริ่มต้นให้กับ input fields
    document.getElementById('monthlyIncome').value = 0; 
    document.getElementById('debt').value = 0;
    document.getElementById('age').value = 0;
    // แก้ไข: ตั้งค่าเริ่มต้นเป็น '0.00' (เป็น String)
    document.getElementById('interestRate').value = '0.00'; 
    document.getElementById('loanTermYears').value = 30; // ตั้งค่าเริ่มต้นระยะเวลากู้

    // ซิงค์ค่าของ sliders ให้ตรงกับ input fields
    inputs.forEach(item => {
        // แก้ไข: สำหรับ interestRate ให้ใช้ parseFloat().toFixed(2) เพื่อซิงค์ค่าเริ่มต้น
        if (item.id === 'interestRate') {
            document.getElementById(item.sliderId).value = parseFloat(document.getElementById(item.id).value).toFixed(2);
        } else {
            document.getElementById(item.sliderId).value = document.getElementById(item.id).value;
        }
    });

    // แสดงผลลัพธ์เริ่มต้นเป็น 0 ทันทีที่โหลดหน้าเว็บ (ยังไม่มีการคำนวณจริง)
    displayResults(0, 0, 0, 0); 

    // Back to Top button functionality
    const backToTopBtn = document.getElementById('backToTopBtn');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) { // Show button after scrolling 300px
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
    // ดึงค่าจาก input fields
    const monthlyIncome = parseFloat(document.getElementById('monthlyIncome').value);
    const debt = parseFloat(document.getElementById('debt').value);
    const age = parseInt(document.getElementById('age').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value) / 100; // แปลงเป็นทศนิยม
    let loanTermYears = parseInt(document.getElementById('loanTermYears').value); // ระยะเวลากู้ที่ผู้ใช้ระบุ

    // กำหนดค่า DSR (Debt Service Ratio) และ LTV (Loan-to-Value)
    const maxDSR = 0.6; // DSR สูงสุด (60% ของรายได้)
    const maxLTV = 0.9; // LTV สูงสุด (90% ของราคาบ้าน)

    // ตรวจสอบเงื่อนไขพื้นฐานสำหรับผลลัพธ์เป็น 0
    if (isNaN(monthlyIncome) || monthlyIncome <= 0 || 
        isNaN(debt) || debt < 0 ||
        isNaN(age) || age <= 0 || 
        isNaN(interestRate) || interestRate < 0 ||
        isNaN(loanTermYears) || loanTermYears <= 0) {
        displayResults(0, 0, 0, 0);
        return;
    }

    // คำนวณรายได้ที่ธนาคารอนุญาตให้เป็นภาระหนี้สูงสุด (ตาม DSR)
    const incomeAllowedForDebt = monthlyIncome * maxDSR;
    
    // คำนวณยอดผ่อนสูงสุดที่ยังเหลืออยู่หลังจากหักภาระหนี้เดิมแล้ว
    const maxAffordableInstallment = Math.max(0, incomeAllowedForDebt - debt);

    if (maxAffordableInstallment <= 0) { // ถ้ายอดผ่อนที่เหลืออยู่เป็น 0 หรือติดลบ ก็กู้ไม่ได้
        displayResults(0, 0, 0, 0);
        return;
    }

    // กำหนดระยะเวลากู้สูงสุดที่แท้จริงตามอายุ
    const maxLoanTermBasedOnAge = Math.min(30, Math.max(0, (60 - age)));
    
    // ใช้ระยะเวลากู้ที่ผู้ใช้ระบุ แต่ไม่เกินกว่าที่อายุและธนาคารกำหนด (max 30 ปี)
    const actualLoanTermYears = Math.min(loanTermYears, maxLoanTermBasedOnAge);
    const actualLoanTermMonths = actualLoanTermYears * 12;

    if (actualLoanTermMonths <= 0) { // หากระยะเวลากู้ไม่สมเหตุสมผล
        displayResults(0, 0, 0, 0);
        return;
    }
    
    // คำนวณวงเงินกู้สูงสุด (Principal) จากยอดผ่อนสูงสุดที่สามารถจ่ายได้
    // สูตร: P = M * [ (1 + i)^n – 1] / [ i(1 + i)^n ]
    const monthlyInterestRate = interestRate / 12; // อัตราดอกเบี้ยต่อเดือน
    let maxLoanPrincipal = 0;

    if (monthlyInterestRate > 0) {
        const term = Math.pow(1 + monthlyInterestRate, actualLoanTermMonths);
        maxLoanPrincipal = maxAffordableInstallment * (term - 1) / (monthlyInterestRate * term);
    } else { 
        // กรณีดอกเบี้ยเป็น 0% (ไม่น่าจะเกิดขึ้นจริง แต่เผื่อไว้)
        maxLoanPrincipal = maxAffordableInstallment * actualLoanTermMonths;
    }

    // วงเงินที่สามารถกู้ได้ (ไม่ควรติดลบ)
    const loanLimit = Math.max(0, maxLoanPrincipal);

    // คำนวณยอดผ่อนเฉลี่ยต่อเดือนสำหรับ 3 ปีแรก (ใช้ loanLimit เป็นเงินต้น)
    // สูตร: M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
    let estimatedMonthlyPayment = 0;
    const yearsForEstimate = 3;
    const monthsForEstimate = yearsForEstimate * 12;
    
    if (loanLimit > 0 && monthsForEstimate > 0 && monthlyInterestRate > 0) { 
        const termEstimate = Math.pow(1 + monthlyInterestRate, monthsForEstimate);
        estimatedMonthlyPayment = loanLimit * monthlyInterestRate * termEstimate / (termEstimate - 1);
    } else if (loanLimit > 0 && monthsForEstimate > 0 && monthlyInterestRate === 0) {
        estimatedMonthlyPayment = loanLimit / monthsForEstimate; // กรณีดอกเบี้ย 0%
    } else {
        estimatedMonthlyPayment = 0;
    }
    
    // คำนวณราคาบ้านสูงสุดที่ซื้อได้จากวงเงินกู้และ LTV
    const maxLoanPrice = loanLimit / maxLTV;
    const downPayment = maxLoanPrice - loanLimit; // เงินดาวน์ (ไม่ควรติดลบ)

    // แสดงผลลัพธ์
    displayResults(maxLoanPrice, Math.max(0, downPayment), loanLimit, estimatedMonthlyPayment);
}

// ฟังก์ชันสำหรับแสดงผลลัพธ์บนหน้าเว็บ
function displayResults(maxLoanPrice, downPayment, loanLimit, monthlyPayment) {
    document.getElementById('maxLoanPrice').innerText = formatCurrency(maxLoanPrice);
    document.getElementById('downPayment').innerText = formatCurrency(downPayment);
    document.getElementById('loanLimit').innerText = formatCurrency(loanLimit);
    document.getElementById('monthlyPayment').innerText = formatCurrency(monthlyPayment);
}

// ฟังก์ชันสำหรับจัดรูปแบบตัวเลขให้เป็นสกุลเงิน (บาท)
function formatCurrency(amount) {
    // ปัดเศษให้เป็นจำนวนเต็มใกล้เคียงที่สุด
    return new Intl.NumberFormat('th-TH', { 
        style: 'decimal', 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    }).format(Math.round(amount));
}

// ฟังก์ชันสำหรับล้างข้อมูลในฟอร์ม
function resetForm() {
    document.getElementById('monthlyIncome').value = 0;
    document.getElementById('debt').value = 0;
    document.getElementById('age').value = 0;
    document.getElementById('interestRate').value = 0.00; // รีเซ็ตเป็น 0.00%
    document.getElementById('loanTermYears').value = 30; // รีเซ็ตระยะเวลากู้

    // ซิงค์ค่า sliders ให้เป็นค่าเริ่มต้น
    inputs.forEach(item => {
        document.getElementById(item.sliderId).value = document.getElementById(item.id).value;
    });

    // แสดงผลลัพธ์เป็น 0 ทันทีหลังล้างข้อมูล
    displayResults(0, 0, 0, 0);
}