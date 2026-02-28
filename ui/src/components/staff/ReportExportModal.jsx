import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useLanguage } from '../../contexts/LanguageContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReportExportModal = ({ visible, onHide, bookings, earnings }) => {
    const { t } = useLanguage();

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const yearOptions = Array.from({ length: 5 }, (_, i) => ({ label: `${currentYear - i}`, value: currentYear - i }));

    // Month options 1-12
    const monthOptions = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(2000, i, 1);
        return {
            label: date.toLocaleString('default', { month: 'long' }),
            value: i + 1
        };
    });

    const getFilteredData = () => {
        // Filter bookings by month/year
        const reportBookings = bookings.filter(b => {
            const d = new Date(b.date || b.startTime || b.createdAt);
            if (isNaN(d.getTime())) return false;
            return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
        });

        // Calculate Totals Income (Sum of completed bookings inside that month)
        // Adjust statuses as needed for what counts as 'income'
        const incomeBookings = reportBookings.filter(b => ['Completed', 'Confirmed', 'Checked In'].includes(b.status));
        const totalIncome = incomeBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || Number(b.total) || 0), 0);

        // Filter payouts/expenses by month/year (Earnings array represents payouts in your DataContext usually for manager)
        // Alternatively, we use `earnings` if they represent actual outcomes
        // Let's assume `earnings` has `amount` or `totalAmount`
        const reportOutcomes = (earnings || []).filter(e => {
            const d = new Date(e.createdAt || e.date);
            if (isNaN(d.getTime())) return false;
            return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
        });

        // Payouts might be outcome for manager
        const totalOutcome = reportOutcomes.reduce((sum, e) => sum + (Number(e.amount) || Number(e.totalAmount) || 0), 0);

        return {
            reportBookings,
            totalIncome,
            totalOutcome
        };
    };

    const formatCurrency = (val) => `${Number(val).toLocaleString()} ₮`;

    const handleExportExcel = () => {
        const { reportBookings, totalIncome, totalOutcome } = getFilteredData();

        // 1. Summary Sheet
        const summaryData = [
            ["Monthly Financial Report"],
            [`Period: ${selectedYear}-${String(selectedMonth).padStart(2, '0')}`],
            [""],
            ["Metric", "Amount"],
            ["Total Income (Bookings)", formatCurrency(totalIncome)],
            ["Total Outcome (Payouts/Expenses)", formatCurrency(totalOutcome)],
            ["Net Profit", formatCurrency(totalIncome - totalOutcome)]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

        // 2. Bookings Sheet
        const bookingsData = reportBookings.map(b => ({
            ID: b.id,
            Date: new Date(b.date || b.startTime || b.createdAt).toLocaleDateString(),
            Customer: b.user || b.userId || 'Guest',
            Room: b.room?.name || b.room || 'N/A',
            Status: b.status,
            Amount: b.totalPrice || b.total || 0
        }));
        const wsBookings = XLSX.utils.json_to_sheet(bookingsData);

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
        XLSX.utils.book_append_sheet(wb, wsBookings, "Bookings");

        XLSX.writeFile(wb, `Financial_Report_${selectedYear}_${selectedMonth}.xlsx`);
        onHide();
    };

    const handleExportPDF = () => {
        const { reportBookings, totalIncome, totalOutcome } = getFilteredData();
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`Monthly Financial Report`, 14, 22);

        doc.setFontSize(11);
        doc.text(`Period: ${selectedYear}-${String(selectedMonth).padStart(2, '0')}`, 14, 30);

        // Summary Table
        doc.autoTable({
            startY: 40,
            head: [['Metric', 'Amount']],
            body: [
                ['Total Income (Bookings)', formatCurrency(totalIncome)],
                ['Total Outcome (Payouts/Expenses)', formatCurrency(totalOutcome)],
                ['Net Profit', formatCurrency(totalIncome - totalOutcome)]
            ],
            theme: 'grid',
            headStyles: { fillColor: [176, 0, 255] }
        });

        // Bookings Table
        const tableData = reportBookings.map(b => [
            String(b.id).substring(0, 8) + '...',
            new Date(b.date || b.startTime || b.createdAt).toLocaleDateString(),
            b.user || b.userId || 'Guest',
            b.room?.name || b.room || 'N/A',
            b.status,
            formatCurrency(b.totalPrice || b.total || 0)
        ]);

        doc.text("Booking Details", 14, doc.lastAutoTable.finalY + 15);
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['ID', 'Date', 'Customer', 'Room', 'Status', 'Amount']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [40, 40, 40] },
            styles: { fontSize: 8 }
        });

        doc.save(`Financial_Report_${selectedYear}_${selectedMonth}.pdf`);
        onHide();
    };

    return (
        <Dialog
            header={t('exportMonthlyReport') || 'Export Monthly Report'}
            visible={visible}
            onHide={onHide}
            className="w-full max-w-md bg-[#161622] rounded-3xl overflow-hidden border border-white/10"
            headerClassName="bg-[#1e1e2d] text-white border-b border-white/10 p-4"
            contentClassName="bg-[#161622] text-white p-6"
            position="top"
        >
            <div className="flex flex-col gap-6">
                <p className="text-sm text-gray-400 m-0">
                    {t('exportReportDesc') || 'Select a month and year to download the financial summary. The report includes totals and booking lists.'}
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('year') || 'Year'}</label>
                        <Dropdown
                            value={selectedYear}
                            options={yearOptions}
                            onChange={(e) => setSelectedYear(e.value)}
                            className="w-full bg-black/40 border border-white/10 text-white shadow-none focus:border-[#b000ff]"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('month') || 'Month'}</label>
                        <Dropdown
                            value={selectedMonth}
                            options={monthOptions}
                            onChange={(e) => setSelectedMonth(e.value)}
                            className="w-full bg-black/40 border border-white/10 text-white shadow-none focus:border-[#b000ff]"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                    <Button
                        label={t('downloadExcel') || 'Download Excel (.xlsx)'}
                        icon="pi pi-file-excel"
                        className="p-button-outlined w-full h-12 border-[#4CAF50] text-[#4CAF50] hover:bg-[#4CAF50]/10 font-bold justify-center"
                        onClick={handleExportExcel}
                    />
                    <Button
                        label={t('downloadPdf') || 'Download PDF (.pdf)'}
                        icon="pi pi-file-pdf"
                        className="p-button-outlined w-full h-12 border-[#F44336] text-[#F44336] hover:bg-[#F44336]/10 font-bold justify-center"
                        onClick={handleExportPDF}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default ReportExportModal;
