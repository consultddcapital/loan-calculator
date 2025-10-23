// ฟังก์ชันหลักในการคำนวณค่างวด ดอกเบี้ยรวม และยอดชำระรวม
function calculateLoan(amount, years, rate) {
    if (isNaN(amount) || amount <= 0 ||
        isNaN(years) || years <= 0 ||
        isNaN(rate) || rate < 0) { // ดอกเบี้ยอาจเป็น 0 ได้
        return null; // คืนค่า null หากข้อมูลไม่ถูกต้อง
    }

    const monthlyInterestRate = (rate / 100) / 12; // อัตราดอกเบี้ยต่อเดือน
    const numberOfPayments = years * 12; // จำนวนงวดทั้งหมด (เดือน)

    let monthlyPayment;
    if (monthlyInterestRate === 0) {
        monthlyPayment = amount / numberOfPayments;
    } else {
        monthlyPayment = (amount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments));
    }

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - amount;

    return {
        monthlyPayment: monthlyPayment,
        totalInterest: totalInterest,
        totalPayment: totalPayment
    };
}

// ฟังก์ชันสำหรับปุ่ม "คำนวณ" หลัก
function calculateLoanDetails() {
    const loanPurpose = document.getElementById('loanPurpose').value;
    const loanYears = parseFloat(document.getElementById('loanYears').value);
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!loanPurpose) {
        alert('กรุณาเลือกเป้าหมายการกู้');
        document.getElementById('primaryResult').style.display = 'none';
        return;
    }

    const results = calculateLoan(loanAmount, loanYears, interestRate);

    if (results) {
        document.getElementById('monthlyPaymentValue').textContent = results.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('totalInterestValue').textContent = results.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('totalPaymentValue').textContent = results.totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('primaryResult').style.display = 'block';
    } else {
        alert('กรุณาป้อนข้อมูลที่ถูกต้องในช่องทั้งหมด');
        document.getElementById('primaryResult').style.display = 'none';
    }
}

// ฟังก์ชันสำหรับปุ่ม "คำนวณเพิ่มเติม"
function calculateAdjustedLoan() {
    // ใช้ค่าอัตราดอกเบี้ยและจำนวนปีจากส่วนคำนวณหลัก
    const loanYears = parseFloat(document.getElementById('loanYears').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);
    const adjustedLoanAmount = parseFloat(document.getElementById('adjustedLoanAmount').value);

    // ตรวจสอบว่ามีการคำนวณหลักก่อนหรือไม่
    if (isNaN(loanYears) || loanYears <= 0 || isNaN(interestRate) || interestRate < 0) {
        alert('กรุณาคำนวณข้อมูลในส่วนหลักก่อน');
        document.getElementById('adjustedResult').style.display = 'none';
        return;
    }

    const results = calculateLoan(adjustedLoanAmount, loanYears, interestRate);

    if (results) {
        document.getElementById('adjustedMonthlyPaymentValue').textContent = results.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('adjustedTotalInterestValue').textContent = results.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('adjustedTotalPaymentValue').textContent = results.totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('adjustedResult').style.display = 'block';
    } else {
        alert('กรุณาป้อนจำนวนเงินที่ต้องการกู้ให้ถูกต้อง');
        document.getElementById('adjustedResult').style.display = 'none';
    }
}

// ตั้งค่าเริ่มต้นเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', () => {
    // ตั้งค่าเริ่มต้นของ input fields ให้ตรงกับที่แสดงในภาพหรือตามที่คุณต้องการ
    document.getElementById('loanYears').value = '30'; // ตัวอย่าง
    document.getElementById('loanAmount').value = '2000000'; // ตัวอย่าง
    document.getElementById('interestRate').value = '6.5'; // ตัวอย่าง
    document.getElementById('adjustedLoanAmount').value = '2000000'; // ตัวอย่าง

    // ซ่อนส่วนผลลัพธ์เมื่อโหลดหน้า
    document.getElementById('primaryResult').style.display = 'none';
    document.getElementById('adjustedResult').style.display = 'none';
});