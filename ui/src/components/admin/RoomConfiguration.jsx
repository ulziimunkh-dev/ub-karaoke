import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';

const RoomConfiguration = () => {
    const { roomTypes, roomFeatures, addRoomType, updateRoomType, deleteRoomType, addRoomFeature, updateRoomFeature, deleteRoomFeature } = useData();
    const { t } = useLanguage();

    // --- TYPES STATE ---
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [typeForm, setTypeForm] = useState({ name: '', description: '' });

    // --- FEATURES STATE ---
    const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
    const [editingFeature, setEditingFeature] = useState(null);
    const [featureForm, setFeatureForm] = useState({ name: '', icon: '' });

    // --- TYPE HANDLERS ---
    const openTypeModal = (type = null) => {
        setEditingType(type);
        setTypeForm(type ? { name: type.name, description: type.description || '' } : { name: '', description: '' });
        setIsTypeModalOpen(true);
    };

    const handleSaveType = async (e) => {
        e.preventDefault();
        try {
            if (editingType) {
                await updateRoomType(editingType.id, typeForm);
            } else {
                await addRoomType(typeForm);
            }
            setIsTypeModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    // --- FEATURE HANDLERS ---
    const openFeatureModal = (feature = null) => {
        setEditingFeature(feature);
        setFeatureForm(feature ? { name: feature.name, icon: feature.icon || '' } : { name: '', icon: '' });
        setIsFeatureModalOpen(true);
    };

    const handleSaveFeature = async (e) => {
        e.preventDefault();
        try {
            if (editingFeature) {
                await updateRoomFeature(editingFeature.id, featureForm);
            } else {
                await addRoomFeature(featureForm);
            }
            setIsFeatureModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">

            {/* ROOM TYPES */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#b000ff]/20 to-[#eb79b2]/20 flex items-center justify-center">
                            <i className="pi pi-home text-[#eb79b2] text-sm"></i>
                        </div>
                        <h3 className="text-sm font-black text-white/80 uppercase tracking-[0.2em] m-0">{t('roomTypes')}</h3>
                    </div>
                    <Button
                        icon="pi pi-plus"
                        rounded
                        size="small"
                        onClick={() => openTypeModal()}
                        className="bg-white/10 border-none hover:bg-white/20 text-white"
                    />
                </div>
                <DataTable value={roomTypes} className="text-sm datatable-modern" emptyMessage={t('noData')}>
                    <Column field="name" header={t('name')} className="font-bold text-white" />
                    <Column field="description" header={t('description')} className="text-text-muted text-xs" />
                    <Column body={(rowData) => (
                        <div className="flex gap-2 justify-end">
                            <Button icon="pi pi-pencil" text rounded size="small" onClick={() => openTypeModal(rowData)} className="hover:bg-white/5" />
                            <Button icon="pi pi-trash" text rounded severity="danger" size="small" onClick={() => deleteRoomType(rowData.id)} className="hover:bg-red-500/10" />
                        </div>
                    )} />
                </DataTable>
            </div>

            {/* ROOM FEATURES */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#eb79b2]/20 to-[#b000ff]/20 flex items-center justify-center">
                            <i className="pi pi-star text-[#eb79b2] text-sm"></i>
                        </div>
                        <h3 className="text-sm font-black text-white/80 uppercase tracking-[0.2em] m-0">{t('featuresAmenities')}</h3>
                    </div>
                    <Button
                        icon="pi pi-plus"
                        rounded
                        size="small"
                        onClick={() => openFeatureModal()}
                        className="bg-white/10 border-none hover:bg-white/20 text-white"
                    />
                </div>
                <DataTable value={roomFeatures} className="text-sm datatable-modern" emptyMessage={t('noData')}>
                    <Column body={(rowData) => <span className="text-2xl drop-shadow-md">{rowData.icon}</span>} header={t('icon')} style={{ width: '4rem' }} />
                    <Column field="name" header={t('name')} className="font-bold text-white" />
                    <Column body={(rowData) => (
                        <div className="flex gap-2 justify-end">
                            <Button icon="pi pi-pencil" text rounded size="small" onClick={() => openFeatureModal(rowData)} className="hover:bg-white/5" />
                            <Button icon="pi pi-trash" text rounded severity="danger" size="small" onClick={() => deleteRoomFeature(rowData.id)} className="hover:bg-red-500/10" />
                        </div>
                    )} />
                </DataTable>
            </div>

            {/* TYPE DIALOG */}
            <Dialog
                header={
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b000ff]/20 to-[#eb79b2]/20 flex items-center justify-center">
                            <i className={`pi ${editingType ? 'pi-pencil' : 'pi-plus'} text-[#eb79b2]`}></i>
                        </div>
                        <div>
                            <h3 className="m-0 text-lg font-bold text-white capitalize">{editingType ? t('editType') : t('addType')}</h3>
                            <p className="m-0 text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('roomCategoryDefinition') || 'ROOM CATEGORY DEFINITION'}</p>
                        </div>
                    </div>
                }
                visible={isTypeModalOpen}
                onHide={() => setIsTypeModalOpen(false)}
                className="w-full max-w-[450px]"
                modal
            >
                <form onSubmit={handleSaveType} className="flex flex-col gap-5 pt-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('typeName') || 'Category Name'}</label>
                        <InputText
                            value={typeForm.name}
                            onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                            required
                            className="h-11 bg-black/20 border-white/10 font-bold px-4"
                            placeholder="e.g. VIP Suite"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('description')}</label>
                        <InputText
                            value={typeForm.description}
                            onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                            className="h-11 bg-black/20 border-white/10 px-4"
                            placeholder="Short description..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button label={t('cancel')} text onClick={() => setIsTypeModalOpen(false)} className="h-11 px-6 font-bold text-white/60 hover:text-white" />
                        <Button
                            label={t('save')}
                            type="submit"
                            className="h-11 px-8 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-wider rounded-lg shadow-[0_4px_12px_rgba(176,0,255,0.3)]"
                        />
                    </div>
                </form>
            </Dialog>

            {/* FEATURE DIALOG */}
            <Dialog
                header={
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#eb79b2]/20 to-[#b000ff]/20 flex items-center justify-center">
                            <i className="pi pi-star text-[#eb79b2]"></i>
                        </div>
                        <div>
                            <h3 className="m-0 text-lg font-bold text-white capitalize">{editingFeature ? t('editFeature') : t('addFeature')}</h3>
                            <p className="m-0 text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('amenitiesConfiguration') || 'AMENITIES CONFIGURATION'}</p>
                        </div>
                    </div>
                }
                visible={isFeatureModalOpen}
                onHide={() => setIsFeatureModalOpen(false)}
                className="w-full max-w-[450px]"
                modal
            >
                <form onSubmit={handleSaveFeature} className="flex flex-col gap-5 pt-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('featureName') || 'Feature Name'}</label>
                        <InputText
                            value={featureForm.name}
                            onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })}
                            required
                            className="h-11 bg-black/20 border-white/10 font-bold px-4"
                            placeholder="e.g. Pool Table"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('iconLabel')}</label>
                        <InputText
                            value={featureForm.icon}
                            onChange={(e) => setFeatureForm({ ...featureForm, icon: e.target.value })}
                            className="h-11 bg-black/20 border-white/10 px-4 text-center text-xl"
                            placeholder="🎱"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button label={t('cancel')} text onClick={() => setIsFeatureModalOpen(false)} className="h-11 px-6 font-bold text-white/60 hover:text-white" />
                        <Button
                            label={t('save')}
                            type="submit"
                            className="h-11 px-8 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-wider rounded-lg shadow-[0_4px_12px_rgba(176,0,255,0.3)]"
                        />
                    </div>
                </form>
            </Dialog>

        </div>
    );
};

export default RoomConfiguration;
