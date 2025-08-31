// Shop Information
const SHOP_INFO = {
    NAME: "M/s. S.K. JEWELLERS",
    ADDRESS_LINE1: "BISWAS SUPER MARKET (BABUPARA ROAD)",
    ADDRESS_LINE2: "THAKURNAGAR BAZAR, NORTH 24 PGS",
    ADDRESS_LINE3: "India - 743287",
    PHONE: "7478740724 / 947419562",
    EMAIL: "skjewellersthakurnagar@gmail.com",
    GSTIN: "GSTIN : 19AGVPC6582C"
};

// Global Variable Initialization
let items = []; // Stores items for the current bill

// DOM Element References
const customerNameInput = document.getElementById('customerName');
const phoneNumberInput = document.getElementById('phoneNumber');
const addressInput = document.getElementById('address');
const billDateInput = document.getElementById('billDate');
const itemDescriptionInput = document.getElementById('itemDescription');
const itemKaratInput = document.getElementById('itemKarat');
const itemWeightInput = document.getElementById('itemWeight');
const itemRateInput = document.getElementById('itemRate');
const addItemBtn = document.getElementById('addItemBtn');
const itemListDiv = document.getElementById('itemList');
const noItemsMsg = document.getElementById('noItemsMsg');
const taxRateInput = document.getElementById('taxRate');
const totalLabel = document.getElementById('totalLabel');
const saveTextBillBtn = document.getElementById('saveTextBillBtn');
const savePdfBillBtn = document.getElementById('savePdfBillBtn');
const searchNameInput = document.getElementById('searchName');
const searchDateInput = document.getElementById('searchDate');
const searchBillsBtn = document.getElementById('searchBillsBtn');
const searchResultsDiv = document.getElementById('searchResults');
const noSearchResultsMsg = document.getElementById('noSearchResultsMsg');
const reportMonthSelect = document.getElementById('reportMonth');
const reportYearSelect = document.getElementById('reportYear');
const generateReportBtn = document.getElementById('generateReportBtn');
const reportResultsDiv = document.getElementById('reportResults');
const noReportMsg = document.getElementById('noReportMsg');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const customModal = document.getElementById('customModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalActions = document.getElementById('modalActions');

// Backend API Base URL
const API_BASE_URL = "http://localhost:8000"; // Adjust if hosted elsewhere

// UI Initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    updateTotal();
});

function initializeUI() {
    billDateInput.value = new Date().toISOString().split('T')[0];
    populateMonthYearSelectors();
    setupPlaceholderText();

    // Event Listeners
    addItemBtn.addEventListener('click', addItem);
    taxRateInput.addEventListener('input', updateTotal);
    saveTextBillBtn.addEventListener('click', () => saveBill(false));
    savePdfBillBtn.addEventListener('click', () => saveBill(true));
    searchBillsBtn.addEventListener('click', searchBills);
    searchResultsDiv.addEventListener('click', (event) => {
        const selectedBillElement = event.target.closest('.bill-search-result');
        if (selectedBillElement) {
            const billId = selectedBillElement.dataset.billId;
            showBillDetailsFromSearch(billId);
        }
    });
    generateReportBtn.addEventListener('click', generateMonthlyReport);
    exportExcelBtn.addEventListener('click', exportAllBillsToExcel);
    closeModalBtn.addEventListener('click', closeCustomModal);
    customModal.addEventListener('click', (e) => {
        if (e.target === customModal) {
            closeCustomModal();
        }
    });
}

// Custom Modal Functions
function showCustomModal(title, content, type = 'alert', actions = []) {
    modalTitle.textContent = title;
    modalBody.innerHTML = '';
    modalActions.innerHTML = '';

    if (typeof content === 'string') {
        const p = document.createElement('p');
        p.textContent = content;
        modalBody.appendChild(p);
    } else {
        modalBody.appendChild(content);
    }

    if (type === 'confirm') {
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = "Confirm";
        confirmBtn.className = "bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-200 ease-in-out transform hover:scale-105";
        confirmBtn.onclick = () => {
            closeCustomModal();
            actions[0]();
        };
        modalActions.appendChild(confirmBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-200 ease-in-out transform hover:scale-105";
        cancelBtn.onclick = closeCustomModal;
        modalActions.appendChild(cancelBtn);
    } else if (actions.length > 0) {
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.textContent = action.text;
            btn.className = action.className || "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-200 ease-in-out transform hover:scale-105";
            btn.onclick = () => {
                closeCustomModal();
                action.onClick();
            };
            modalActions.appendChild(btn);
        });
    } else {
        const okBtn = document.createElement('button');
        okBtn.textContent = "OK";
        okBtn.className = "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-200 ease-in-out transform hover:scale-105";
        okBtn.onclick = closeCustomModal;
        modalActions.appendChild(okBtn);
    }

    customModal.classList.remove('hidden');
}

function closeCustomModal() {
    customModal.classList.add('hidden');
    modalBody.innerHTML = '';
    modalActions.innerHTML = '';
}

function showLoading(message = "Processing...") {
    const loadingContent = document.createElement('div');
    loadingContent.className = "flex flex-col items-center justify-center";
    loadingContent.innerHTML = `
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <p class="text-gray-700">${message}</p>
    `;
    showCustomModal("Please Wait", loadingContent, "loading");
    closeModalBtn.classList.add('hidden');
}

function hideLoading() {
    closeCustomModal();
    closeModalBtn.classList.remove('hidden');
}

// Core Logic
function addItem() {
    try {
        const desc = itemDescriptionInput.value.trim();
        const karat = itemKaratInput.value.trim();
        const weightStr = itemWeightInput.value.trim();
        const rateStr = itemRateInput.value.trim();

        if (!desc || !karat) {
            showCustomModal("Input Error", "Description and Karat cannot be empty.");
            return;
        }
        if (!weightStr || !rateStr) {
            showCustomModal("Input Error", "Weight and Rate cannot be empty.");
            return;
        }

        const weight = parseFloat(weightStr);
        const rate = parseFloat(rateStr);

        if (isNaN(weight) || isNaN(rate) || weight <= 0 || rate <= 0) {
            showCustomModal("Input Error", "Please enter valid positive numbers for weight and rate.");
            return;
        }

        const amount = weight * rate;
        items.push({ description: desc, karat, weight, rate, amount });
        renderItemList();
        updateTotal();

        itemDescriptionInput.value = '';
        itemKaratInput.value = '';
        itemWeightInput.value = '';
        itemRateInput.value = '';
        itemDescriptionInput.focus();
    } catch (e) {
        console.error("Error adding item:", e);
        showCustomModal("Error", `An unexpected error occurred: ${e.message}`);
    }
}

function renderItemList() {
    itemListDiv.innerHTML = '';
    if (items.length === 0) {
        noItemsMsg.style.display = 'block';
    } else {
        noItemsMsg.style.display = 'none';
        items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = "flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0";
            itemElement.innerHTML = `
                <span class="text-gray-800 text-sm flex-grow">${item.description} (${item.karat}) - ${item.weight.toFixed(2)}g x ₹${item.rate.toFixed(2)}/g</span>
                <span class="text-gray-900 font-semibold text-sm">₹${item.amount.toFixed(2)}</span>
                <button data-index="${index}" class="remove-item-btn ml-3 text-red-500 hover:text-red-700 focus:outline-none">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            itemListDiv.appendChild(itemElement);
        });
        itemListDiv.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', removeItem);
        });
    }
}

function removeItem(event) {
    const indexToRemove = parseInt(event.currentTarget.dataset.index);
    if (!isNaN(indexToRemove) && indexToRemove >= 0 && indexToRemove < items.length) {
        items.splice(indexToRemove, 1);
        renderItemList();
        updateTotal();
    }
}

function updateTotal() {
    try {
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        let taxRate = parseFloat(taxRateInput.value.trim());

        if (isNaN(taxRate) || taxRate < 0) {
            taxRate = 0;
            taxRateInput.value = "0";
            showCustomModal("Input Warning", "Tax rate cannot be negative. Setting to 0%.");
        }

        const taxAmount = subtotal * (taxRate / 100);
        const grandTotal = subtotal + taxAmount;

        totalLabel.innerHTML = `
            Subtotal: ₹${subtotal.toFixed(2)} | Tax (${taxRate.toFixed(2)}%): ₹${taxAmount.toFixed(2)}<br>
            Grand Total: ₹${grandTotal.toFixed(2)}
        `;
    } catch (e) {
        console.error("Error updating total:", e);
        totalLabel.textContent = `Error calculating total: ${e.message}`;
    }
}

async function saveBill(generatePdf = false) {
    const customer = customerNameInput.value.trim();
    const phone = phoneNumberInput.value.trim();
    const address = addressInput.value.trim();
    const billDate = billDateInput.value;

    if (!customer) {
        showCustomModal("Missing Information", "Please enter customer name.");
        return;
    }
    if (items.length === 0) {
        showCustomModal("No Items", "Please add at least one item to the bill before saving.");
        return;
    }

    showLoading("Saving Bill and Generating Files...");

    try {
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const taxRate = parseFloat(taxRateInput.value);
        const taxAmount = subtotal * (taxRate / 100);
        const grandTotal = subtotal + taxAmount;

        const currentDateTime = new Date().toISOString();

        const billData = {
            customer_name: customer,
            phone: phone || null,
            address: address || null,
            date: currentDateTime,
            subtotal,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            grand_total: grandTotal,
            items
        };

        const response = await fetch(`${API_BASE_URL}/bills/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(billData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const savedBill = await response.json();
        const billId = savedBill.id;

        let filenameBase = `Bill_${customer.replace(/ /g, '_')}_${currentDateTime.replace(/[:.]/g, '-').slice(0, 19)}`;

        if (generatePdf) {
            await generatePdfBill(billId, savedBill, items, `${filenameBase}.pdf`);
            showCustomModal("Bill Saved", `Bill ID: ${billId} saved successfully! PDF generated and downloaded.`, "alert");
        } else {
            const textContent = generateTextBillContent(savedBill, items);
            downloadTextFile(textContent, `${filenameBase}.txt`);
            showCustomModal("Bill Saved", `Bill ID: ${billId} saved successfully! Text file downloaded.`, "alert");
        }

        customerNameInput.value = '';
        phoneNumberInput.value = '';
        addressInput.value = '';
        billDateInput.value = new Date().toISOString().split('T')[0];
        taxRateInput.value = "3";
        items = [];
        renderItemList();
        updateTotal();
        hideLoading();
    } catch (e) {
        hideLoading();
        console.error("Error saving bill:", e);
        showCustomModal("Error", `An error occurred while saving the bill: ${e.message}`);
    }
}

function generateTextBillContent(billData, itemsData) {
    let content = `${SHOP_INFO.NAME}\n`;
    content += `${SHOP_INFO.ADDRESS_LINE1}\n`;
    content += `${SHOP_INFO.ADDRESS_LINE2}\n`;
    content += `${SHOP_INFO.ADDRESS_LINE3}\n`;
    content += `Phone: ${SHOP_INFO.PHONE}\n`;
    content += `Email: ${SHOP_INFO.EMAIL}\n`;
    content += `${SHOP_INFO.GSTIN}\n\n`;
    content += `--- TAX INVOICE ---\n`;
    content += `Customer: ${billData.customer_name}\n`;
    content += `Phone: ${billData.phone || ''}\n`;
    content += `Address: ${billData.address || ''}\n`;
    content += `Date: ${new Date(billData.date).toLocaleString()}\n\n`;
    content += "Items:\n";
    content += `${'Description'.padEnd(20)} ${'Karat'.padEnd(8)} ${'Weight (g)'.padEnd(12)} ${'Rate (₹/g)'.padEnd(12)} ${'Amount (₹)'.padEnd(12)}\n`;
    content += "-".repeat(64) + "\n";
    itemsData.forEach(item => {
        content += `${item.description.padEnd(20)} ${item.karat.padEnd(8)} ${item.weight.toFixed(2).padEnd(12)} ${item.rate.toFixed(2).padEnd(12)} ${item.amount.toFixed(2).padEnd(12)}\n`;
    });
    content += `\nSubtotal: ₹${billData.subtotal.toFixed(2)}\n`;
    content += `Tax (${billData.tax_rate.toFixed(2)}%): ₹${billData.tax_amount.toFixed(2)}\n`;
    content += `Grand Total: ₹${billData.grand_total.toFixed(2)}\n`;
    return content;
}

function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

async function generatePdfBill(billId, billData, itemsData, filename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'letter');

    const margin = 36;
    let y = doc.internal.pageSize.height - margin;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    doc.setFont('Helvetica-Bold', 'normal');
    doc.setFontSize(24);
    doc.text(SHOP_INFO.NAME, pageWidth / 2, y - 50, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(SHOP_INFO.ADDRESS_LINE1, pageWidth / 2, y - 70, { align: 'center' });
    doc.text(SHOP_INFO.ADDRESS_LINE2, pageWidth / 2, y - 85, { align: 'center' });
    doc.text(SHOP_INFO.ADDRESS_LINE3, pageWidth / 2, y - 100, { align: 'center' });
    doc.text(`Phone: ${SHOP_INFO.PHONE}`, margin, y - 120);
    doc.text(`Email: ${SHOP_INFO.EMAIL}`, margin, y - 135);
    doc.text(`${SHOP_INFO.GSTIN}`, margin, y - 150);

    doc.setFont('Helvetica-Bold', 'normal');
    doc.setFontSize(20);
    doc.text("TAX INVOICE", pageWidth / 2, y - 190, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Customer: ${billData.customer_name}`, margin, y - 230);
    doc.text(`Phone: ${billData.phone || ''}`, margin, y - 245);
    doc.text(`Address: ${billData.address || ''}`, margin, y - 260);
    doc.text(`Date: ${new Date(billData.date).toLocaleString()}`, margin, y - 275);

    y = y - 310;

    doc.setFont('Helvetica-Bold', 'normal');
    doc.setFontSize(9);
    doc.text("Description", margin, y);
    doc.text("Karat", margin + 140, y);
    doc.text("Weight (g)", margin + 210, y);
    doc.text("Rate (₹/g)", margin + 290, y);
    doc.text("Amount (₹)", margin + 390, y);

    y -= 10;
    doc.line(margin, y, pageWidth - margin, y);
    y -= 20;

    doc.setFont('Helvetica', 'normal');
    const lineHeight = 18;

    for (const item of itemsData) {
        if (y < margin + 100) {
            doc.addPage();
            y = pageHeight - margin - 50;
            doc.setFont('Helvetica-Bold', 'normal');
            doc.setFontSize(9);
            doc.text("Description", margin, y);
            doc.text("Karat", margin + 140, y);
            doc.text("Weight (g)", margin + 210, y);
            doc.text("Rate (₹/g)", margin + 290, y);
            doc.text("Amount (₹)", margin + 390, y);
            y -= 10;
            doc.line(margin, y, pageWidth - margin, y);
            y -= 20;
            doc.setFont('Helvetica', 'normal');
        }

        doc.text(item.description, margin, y);
        doc.text(item.karat, margin + 140, y);
        doc.text(item.weight.toFixed(2), margin + 210, y);
        doc.text(item.rate.toFixed(2), margin + 290, y);
        doc.text(item.amount.toFixed(2), margin + 390, y);
        y -= lineHeight;
    }

    y -= 30;

    doc.setFontSize(11);
    doc.text(`Subtotal: ₹${billData.subtotal.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
    doc.text(`Tax (${billData.tax_rate.toFixed(2)}%): ₹${billData.tax_amount.toFixed(2)}`, pageWidth - margin, y - 20, { align: 'right' });
    doc.setFont('Helvetica-Bold', 'normal');
    doc.setFontSize(13);
    doc.text(`Grand Total: ₹${billData.grand_total.toFixed(2)}`, pageWidth - margin, y - 40, { align: 'right' });

    const barcodeValue = `BILL-${billId}`;
    const barcodeElement = document.createElement('img');
    JsBarcode(barcodeElement, barcodeValue, {
        format: "CODE128",
        displayValue: false,
        height: 30,
        width: 1
    });

    const barcodeX = margin;
    const barcodeY = margin + 40;
    const barcodeWidth = 150;
    const barcodeHeight = 40;

    doc.addImage(barcodeElement.src, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Bill Ref: ${barcodeValue}`, barcodeX, barcodeY - 10);

    doc.save(filename);
}

async function searchBills() {
    const name = searchNameInput.value.trim();
    const date = searchDateInput.value.trim();

    searchResultsDiv.innerHTML = '';
    noSearchResultsMsg.style.display = 'block';

    let url = `${API_BASE_URL}/bills/?limit=10`;
    if (name && name !== "Customer Name") {
        url += `&customer_name=${encodeURIComponent(name)}`;
    }
    if (date && date !== "YYYY-MM-DD") {
        url += `&date=${encodeURIComponent(date)}`;
    }

    showLoading("Searching bills...");

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const bills = await response.json();

        hideLoading();

        if (bills.length === 0) {
            searchResultsDiv.innerHTML = '<p class="text-gray-500 text-sm italic">No bills found matching your criteria.</p>';
        } else {
            searchResultsDiv.innerHTML = '';
            bills.forEach(row => {
                const billElement = document.createElement('div');
                billElement.className = "bill-search-result p-2 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-blue-100 rounded-md";
                billElement.dataset.billId = row.id;
                const billDateFormatted = new Date(row.date).toLocaleDateString();
                billElement.innerHTML = `
                    <p class="font-semibold text-gray-800">ID: ${row.id} | ${row.customer_name}</p>
                    <p class="text-sm text-gray-600">${row.phone || ''} | ${billDateFormatted} | ₹${row.grand_total.toFixed(2)}</p>
                `;
                searchResultsDiv.appendChild(billElement);
            });
            noSearchResultsMsg.style.display = 'none';
        }
    } catch (e) {
        hideLoading();
        console.error("Error searching bills:", e);
        showCustomModal("Search Error", `An error occurred during search: ${e.message}`);
    }
}

async function showBillDetailsFromSearch(billId) {
    showLoading("Fetching bill details...");

    try {
        const response = await fetch(`${API_BASE_URL}/bills/${billId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const billData = await response.json();

        hideLoading();

        const contentDiv = document.createElement('div');
        contentDiv.className = "space-y-4";

        const headerFrame = document.createElement('div');
        headerFrame.className = "p-3 border border-gray-200 rounded-md bg-blue-50";
        headerFrame.innerHTML = `
            <h4 class="font-bold text-gray-800 mb-2">Bill Information</h4>
            <p class="text-sm text-gray-700"><strong>Customer:</strong> ${billData.customer_name}</p>
            <p class="text-sm text-gray-700"><strong>Phone:</strong> ${billData.phone || ''}</p>
            <p class="text-sm text-gray-700"><strong>Address:</strong> ${billData.address || ''}</p>
            <p class="text-sm text-gray-700"><strong>Date:</strong> ${new Date(billData.date).toLocaleString()}</p>
        `;
        contentDiv.appendChild(headerFrame);

        const itemsFrame = document.createElement('div');
        itemsFrame.className = "p-3 border border-gray-200 rounded-md bg-gray-50 overflow-x-auto";
        itemsFrame.innerHTML = `
            <h4 class="font-bold text-gray-800 mb-2">Items</h4>
            <table class="min-w-full text-left text-sm text-gray-700">
                <thead>
                    <tr class="bg-gray-200">
                        <th class="py-1 px-2 border-b">Description</th>
                        <th class="py-1 px-2 border-b">Karat</th>
                        <th class="py-1 px-2 border-b text-right">Wt (g)</th>
                        <th class="py-1 px-2 border-b text-right">Rate (₹/g)</th>
                        <th class="py-1 px-2 border-b text-right">Amount (₹)</th>
                    </tr>
                </thead>
                <tbody id="billDetailItemsBody">
                </tbody>
            </table>
        `;
        contentDiv.appendChild(itemsFrame);

        const itemsBody = itemsFrame.querySelector('#billDetailItemsBody');
        billData.items.forEach(item => {
            const row = document.createElement('tr');
            row.className = "border-b border-gray-100 last:border-b-0";
            row.innerHTML = `
                <td class="py-1 px-2">${item.description}</td>
                <td class="py-1 px-2">${item.karat}</td>
                <td class="py-1 px-2 text-right">${item.weight.toFixed(2)}</td>
                <td class="py-1 px-2 text-right">${item.rate.toFixed(2)}</td>
                <td class="py-1 px-2 text-right">${item.amount.toFixed(2)}</td>
            `;
            itemsBody.appendChild(row);
        });

        const totalsFrame = document.createElement('div');
        totalsFrame.className = "p-3 border border-gray-200 rounded-md bg-blue-50 text-right";
        totalsFrame.innerHTML = `
            <p class="text-sm text-gray-700"><strong>Subtotal:</strong> ₹${billData.subtotal.toFixed(2)}</p>
            <p class="text-sm text-gray-700"><strong>Tax (${billData.tax_rate.toFixed(2)}%):</strong> ₹${billData.tax_amount.toFixed(2)}</p>
            <p class="text-md font-bold text-gray-800 mt-2"><strong>Grand Total:</strong> ₹${billData.grand_total.toFixed(2)}</p>
        `;
        contentDiv.appendChild(totalsFrame);

        showCustomModal(
            `Bill Details - ID: ${billId}`,
            contentDiv,
            "custom",
            [{
                text: "Generate PDF & Open",
                className: "bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-md",
                onClick: async () => {
                    showLoading("Generating PDF for old bill...");
                    const filename = `Bill_${billData.customer_name.replace(/ /g, '_')}_${new Date(billData.date).toISOString().replace(/[:.]/g, '-').slice(0, 19)}.pdf`;
                    try {
                        await generatePdfBill(billId, billData, billData.items, filename);
                        hideLoading();
                        showCustomModal("PDF Generated", "PDF for this bill has been generated and downloaded.", "alert");
                    } catch (pdfError) {
                        hideLoading();
                        console.error("Error generating PDF for old bill:", pdfError);
                        showCustomModal("PDF Generation Error", `Failed to generate PDF: ${pdfError.message}`);
                    }
                }
            }]
        );
    } catch (e) {
        hideLoading();
        console.error("Error showing bill details:", e);
        showCustomModal("Error", `An error occurred fetching bill details: ${e.message}`);
    }
}

function populateMonthYearSelectors() {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const currentMonthIndex = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    reportMonthSelect.innerHTML = months.map((month, index) =>
        `<option value="${index + 1}" ${index === currentMonthIndex ? 'selected' : ''}>${month}</option>`
    ).join('');

    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 10; i++) {
        years.push(i);
    }
    reportYearSelect.innerHTML = years.map(year =>
        `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`
    ).join('');
}

async function generateMonthlyReport() {
    const selectedMonth = parseInt(reportMonthSelect.value);
    const selectedYear = parseInt(reportYearSelect.value);

    if (isNaN(selectedMonth) || isNaN(selectedYear)) {
        showCustomModal("Input Error", "Please select a valid Month and Year.");
        return;
    }

    showLoading("Generating monthly report...");

    try {
        const response = await fetch(`${API_BASE_URL}/reports/monthly/?month=${selectedMonth}&year=${selectedYear}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const report = await response.json();

        hideLoading();

        const monthName = reportMonthSelect.options[reportMonthSelect.selectedIndex].text;
        reportResultsDiv.innerHTML = `
            <p class="font-bold text-md mb-2">Report for ${monthName} ${selectedYear}:</p>
            <p><i class="fas fa-receipt mr-2"></i>Total Bills: <span class="font-semibold">${report.num_bills}</span></p>
            <p><i class="fas fa-dollar-sign mr-2"></i>Total Sales: <span class="font-semibold">₹${report.total_sales.toFixed(2)}</span></p>
            <p><i class="fas fa-percent mr-2"></i>Total Tax: <span class="font-semibold">₹${report.total_tax.toFixed(2)}</span></p>
            <p><i class="fas fa-calculator mr-2"></i>Average Bill: <span class="font-semibold">₹${report.avg_bill.toFixed(2)}</span></p>
        `;
        noReportMsg.style.display = 'none';
    } catch (e) {
        hideLoading();
        console.error("Error generating report:", e);
        showCustomModal("Report Error", `An error occurred generating the report: ${e.message}`);
    }
}

async function exportAllBillsToExcel() {
    showLoading("Exporting all bills to Excel...");

    try {
        const response = await fetch(`${API_BASE_URL}/bills/export/`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const bills = await response.json();

        if (bills.length === 0) {
            hideLoading();
            showCustomModal("Export Info", "No data to export.");
            return;
        }

        const allBills = bills.map(bill => ({
            ...bill,
            date_formatted: new Date(bill.date).toLocaleString()
        }));
        const allBillItems = bills.flatMap(bill => bill.items.map(item => ({
            bill_id: bill.id,
            ...item
        })));

        const wb = XLSX.utils.book_new();
        const ws_bills = XLSX.utils.json_to_sheet(allBills);
        XLSX.utils.book_append_sheet(wb, ws_bills, "Bills Summary");
        const ws_items = XLSX.utils.json_to_sheet(allBillItems);
        XLSX.utils.book_append_sheet(wb, ws_items, "Bill Items");

        XLSX.writeFile(wb, "All_Gold_Shop_Bills.xlsx");

        hideLoading();
        showCustomModal("Export Successful", "All bills and their items exported to 'All_Gold_Shop_Bills.xlsx'.", "alert");
    } catch (e) {
        hideLoading();
        console.error("Error exporting to Excel:", e);
        showCustomModal("Export Error", `An error occurred during Excel export: ${e.message}`);
    }
}

function setupPlaceholderText() {
    const inputs = [
        { element: searchNameInput, default: "Customer Name" },
        { element: searchDateInput, default: "YYYY-MM-DD" }
    ];

    inputs.forEach(({ element, default: defaultText }) => {
        if (element.type !== 'date') {
            element.value = defaultText;
            element.classList.add('text-gray-500');

            element.addEventListener('focusin', () => {
                if (element.value === defaultText) {
                    element.value = '';
                    element.classList.remove('text-gray-500');
                    element.classList.add('text-black');
                }
            });

            element.addEventListener('focusout', () => {
                if (element.value === '') {
                    element.value = defaultText;
                    element.classList.add('text-gray-500');
                    element.classList.remove('text-black');
                }
            });
        }
    });
}