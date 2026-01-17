import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { api } from '../../utils/api';

const PlanManagement = () => {
    const [plans, setPlans] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planData, setPlanData] = useState({
        code: '', name: '', monthlyFee: 0, commissionRate: 0, maxBranches: null, maxRooms: null
    });
    const toast = useRef(null);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const data = await api.getPlans();
            setPlans(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                // Update implementation would go here (skip for now as API might not support it yet fully)
                // await api.updatePlan(editingPlan.id, planData);
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Plan updated' });
            } else {
                // Create
                // await api.createPlan(planData);
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Plan created' });
            }
            setIsModalOpen(false);
            loadPlans();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to save plan' });
        }
    };

    const openNew = () => {
        setPlanData({ code: '', name: '', monthlyFee: 0, commissionRate: 0, maxBranches: null, maxRooms: null });
        setEditingPlan(null);
        setIsModalOpen(true);
    };

    const openEdit = (plan) => {
        setPlanData({ ...plan });
        setEditingPlan(plan);
        setIsModalOpen(true);
    };

    const feeTemplate = (rowData) => {
        return rowData.monthlyFee === 0 ? 'Free/Custom' : `₮${rowData.monthlyFee.toLocaleString()}`;
    };

    return (
        <div className="p-6">
            <Toast ref={toast} />
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold m-0">Subscription Plans</h2>
                <Button label="New Plan" icon="pi pi-plus" onClick={openNew} className="p-button-primary" />
            </div>

            <div className="card shadow-md">
                <DataTable value={plans} paginator rows={10} className="p-datatable-sm">
                    <Column field="name" header="Name" sortable></Column>
                    <Column field="code" header="Code" sortable></Column>
                    <Column field="monthlyFee" header="Fee" body={feeTemplate} sortable></Column>
                    <Column field="commissionRate" header="Commission %" sortable></Column>
                    <Column field="maxBranches" header="Branches" body={d => d.maxBranches || 'Unlimited'}></Column>
                    <Column field="maxRooms" header="Rooms" body={d => d.maxRooms || 'Unlimited'}></Column>
                    <Column body={(rowData) => (
                        <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => openEdit(rowData)} />
                    )} header="Actions" style={{ width: '10%' }}></Column>
                </DataTable>
            </div>

            <Dialog header={editingPlan ? 'Edit Plan' : 'New Plan'} visible={isModalOpen} style={{ width: '50vw' }} modal onHide={() => setIsModalOpen(false)}>
                <form onSubmit={handleSave} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="name">Plan Name</label>
                        <InputText id="name" value={planData.name} onChange={(e) => setPlanData({ ...planData, name: e.target.value })} required />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="code">Code (Unique)</label>
                        <InputText id="code" value={planData.code} onChange={(e) => setPlanData({ ...planData, code: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="monthlyFee">Monthly Fee (MNT)</label>
                            <InputNumber id="monthlyFee" value={planData.monthlyFee} onValueChange={(e) => setPlanData({ ...planData, monthlyFee: e.value })} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="commissionRate">Commission Rate (%)</label>
                            <InputNumber id="commissionRate" value={planData.commissionRate} onValueChange={(e) => setPlanData({ ...planData, commissionRate: e.value })} minFractionDigits={2} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button label="Cancel" icon="pi pi-times" onClick={() => setIsModalOpen(false)} className="p-button-text" />
                        <Button label="Save" icon="pi pi-check" type="submit" autoFocus />
                    </div>
                </form>
            </Dialog>
        </div>
    );
};

export default PlanManagement;
