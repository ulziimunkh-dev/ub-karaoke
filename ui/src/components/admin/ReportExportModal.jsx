import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useLanguage } from '../../contexts/LanguageContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import dayjs from 'dayjs';

const ReportExportModal = ({ visible, onHide, bookings = [], earnings = [] }) => {
    const { t } = useLanguage();

    // Generate last 12 months for dropdown
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = dayjs();
        return now.format('YYYY-MM');
    });

    const monthOptions = Array.from({ length: 12 }).map((_, i) => {
        const d = dayjs().subtract(i, 'month');
        return {
            label: d.format('MMMM YYYY'),
            value: d.format('YYYY-MM')
        };
    });

    // Helper to get data for selected month
    const getFilteredData = () => {
        const targetMonth = dayjs(selectedMonth);

        // Filter bookings (income)
        const monthlyBookings = bookings.filter(b => {
            const bDate = dayjs(b.createdAt);
            return bDate.isSame(targetMonth, 'month') &&
                (b.status === 'COMPLETED' || b.status === 'PAID');
        });

        // Filter payouts (outcome) - assuming earnings array represents payouts here or is used similarly
        const monthlyPayouts = earnings.filter(p => {
            const pDate = dayjs(p.createdAt || p.updatedAt);
            return pDate.isSame(targetMonth, 'month') && p.status === 'PAID';
        });

        const totalIncome = monthlyBookings.reduce((sum, b) => sum + Number(b.totalPrice || b.totalAmount || 0), 0);
        const totalOutcome = monthlyPayouts.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);

        return {
            monthlyBookings,
            monthlyPayouts,
            totalIncome,
            totalOutcome
        };
    };

    const handleExportExcel = () => {
        const { monthlyBookings, totalIncome, totalOutcome } = getFilteredData();

        const wb = XLSX.utils.book_new();

        // Summary Sheet
        const summaryData = [
            ['Report Month', dayjs(selectedMonth).format('MMMM YYYY')],
            ['Total Income', totalIncome],
            ['Total Outcome', totalOutcome],
            ['Net Profit', totalIncome - totalOutcome],
            ['Total Completed Bookings', monthlyBookings.length]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        // Bookings Sheet
        const bookingsData = monthlyBookings.map(b => ({
            'ID': b.id,
            'Date': dayjs(b.createdAt).format('YYYY-MM-DD HH:mm'),
            'Customer': b.customer?.user?.fullName || 'N/A',
            'Venue': b.venue?.name || 'N/A',
            'Room': b.room?.name || 'N/A',
            'Status': b.status,
            'Amount': b.totalPrice || b.totalAmount || 0
        }));
        const wsBookings = XLSX.utils.json_to_sheet(bookingsData);
        XLSX.utils.book_append_sheet(wb, wsBookings, 'Bookings Details');

        XLSX.writeFile(wb, `Financial_Report_${selectedMonth}.xlsx`);
        onHide();
    };

    const handleExportPDF = () => {
        const { monthlyBookings, totalIncome, totalOutcome } = getFilteredData();
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`Financial Report: ${dayjs(selectedMonth).format('MMMM YYYY')}`, 14, 22);

        doc.setFontSize(12);
        doc.text(`Total Income: ${totalIncome.toLocaleString()} MNT`, 14, 32);
        doc.text(`Total Outcome (Payouts): ${totalOutcome.toLocaleString()} MNT`, 14, 40);
        doc.text(`Net: ${(totalIncome - totalOutcome).toLocaleString()} MNT`, 14, 48);
        doc.text(`Total Bookings: ${monthlyBookings.length}`, 14, 56);

        // Bookings Table
        const tableColumn = ["Date", "Customer", "Venue", "Room", "Amount"];
        const tableRows = monthlyBookings.map(b => [
            dayjs(b.createdAt).format('YYYY-MM-DD'),
            b.customer?.user?.fullName || 'N/A',
            b.venue?.name || 'N/A',
            b.room?.name || 'N/A',
            `${(b.totalPrice || b.totalAmount || 0).toLocaleString()} MNT`
        ]);

        doc.autoTable({
            startY: 65,
            head: [tableColumn],
            body: tableRows,
        });

        doc.save(`Financial_Report_${selectedMonth}.pdf`);
        onHide();
    };

    return (
        <Dialog
            header={t('exportReport') || 'Export Monthly Report'}
            visible={visible}
            onHide={onHide}
            style={{ width: '400px' }}
        >
            <div className="flex flex-col gap-4 pt-2">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-400">{t('selectMonthToExport')}</label>
                    <Dropdown
                        value={selectedMonth}
                        options={monthOptions}
                        onChange={(e) => setSelectedMonth(e.value)}
                        className="w-full"
                    />
                </div>

                <div className="flex flex-col gap-2 mt-4">
                    <Button
                        label={t('downloadExcel')}
                        icon="pi pi-file-excel"
                        severity="success"
                        outlined
                        onClick={handleExportExcel}
                    />
                    <Button
                        label={t('downloadPdf')}
                        icon="pi pi-file-pdf"
                        severity="danger"
                        outlined
                        onClick={handleExportPDF}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default ReportExportModal;
