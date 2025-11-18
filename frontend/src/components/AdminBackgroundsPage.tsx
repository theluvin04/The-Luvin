import React, { useState, useMemo } from 'react';
import type { AllBackgrounds, BackgroundOption } from '../types';
import { supabase } from '../supabase';

type BackgroundWithType = BackgroundOption & { type: 'square' | 'rectangle' };

const AdminBackgroundsPage: React.FC<{
    allBackgrounds: AllBackgrounds | null;
    showToast: (msg: string, type: 'success' | 'error') => void;
    onUpdate: () => void;
}> = ({ allBackgrounds, showToast, onUpdate }) => {
    const [filterType, setFilterType] = useState<'all' | 'square' | 'rectangle'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBackground, setEditingBackground] = useState<BackgroundWithType | null>(null);

    const backgroundList = useMemo((): BackgroundWithType[] => {
        if (!allBackgrounds) return [];
        const squares = allBackgrounds.square.map(bg => ({ ...bg, type: 'square' as const }));
        const rectangles = allBackgrounds.rectangle.map(bg => ({ ...bg, type: 'rectangle' as const }));
        return [...squares, ...rectangles];
    }, [allBackgrounds]);

    const filteredBackgrounds = useMemo(() => {
        return backgroundList
            .filter(bg => filterType === 'all' || bg.type === filterType)
            .filter(bg => bg.name.toLowerCase().includes(searchTerm.toLowerCase()) || bg.category.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [backgroundList, filterType, searchTerm]);

    const handleEdit = (background: BackgroundWithType) => {
        setEditingBackground(background);
        setIsModalOpen(true);
    };
    
    const handleAddNew = () => {
        setEditingBackground(null);
        setIsModalOpen(true);
    }

    const handleSave = async (backgroundToSave: BackgroundWithType) => {
        const isNew = !editingBackground;
        
        try {
            const { id, type, ...upsertData } = backgroundToSave;
            let error;
            if (isNew) {
                ({ error } = await supabase.from('backgrounds').insert([{ ...upsertData, type }]));
            } else {
                ({ error } = await supabase.from('backgrounds').update(upsertData).eq('id', id));
            }
            
            if (error) throw error;
            
            showToast(`Lưu nền ${isNew ? 'mới' : ''} thành công!`, 'success');
            onUpdate();
        } catch (err) {
            showToast('Lỗi khi lưu nền.', 'error');
            console.error(err);
        } finally {
            setIsModalOpen(false);
            setEditingBackground(null);
        }
    };
    
    const handleDelete = async (backgroundToDelete: BackgroundWithType) => {
        if (!window.confirm(`Bạn có chắc muốn xóa nền "${backgroundToDelete.name}" không?`)) return;

        try {
            const { error } = await supabase.from('backgrounds').delete().eq('id', backgroundToDelete.id);
            if (error) throw error;
            showToast('Xóa nền thành công!', 'success');
            onUpdate();
        } catch (err) {
            showToast('Lỗi khi xóa nền.', 'error');
        }
    };

    if (!allBackgrounds) {
        return <div className="p-8 text-center">Đang tải dữ liệu nền...</div>;
    }
    
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Quản lý Nền</h1>
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
                <input
                    type="text"
                    placeholder="Tìm theo tên, dịp..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-grow p-2 border rounded-md"
                />
                <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="p-2 border rounded-md bg-white">
                    <option value="all">Tất cả</option>
                    <option value="square">Vuông</option>
                    <option value="rectangle">Chữ nhật</option>
                </select>
                <button onClick={handleAddNew} className="bg-green-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-600">
                    + Thêm mới
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dịp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                       {filteredBackgrounds.map(bg => (
                           <tr key={bg.id}>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-3">
                                   <img src={bg.url} alt={bg.name} className="w-10 h-10 object-cover rounded-md" />
                                   {bg.name}
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bg.type}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bg.category}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm">
                                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bg.isVisible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                       {bg.isVisible ? 'Hiển thị' : 'Ẩn'}
                                   </span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                   <button onClick={() => handleEdit(bg)} className="text-indigo-600 hover:text-indigo-900">Sửa</button>
                                   <button onClick={() => handleDelete(bg)} className="text-red-600 hover:text-red-900">Xóa</button>
                               </td>
                           </tr>
                       ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <BackgroundEditModal 
                    background={editingBackground} 
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

const BackgroundEditModal: React.FC<{ background: BackgroundWithType | null, onClose: () => void, onSave: (bg: BackgroundWithType) => void }> = ({ background, onClose, onSave }) => {
    const [formData, setFormData] = useState<BackgroundWithType>(background || { name: '', url: '', category: '', isVisible: true, id: '', type: 'square' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setFormData(prev => {
            const updated = { ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value };
            if (name === 'type') {
                updated.type = value as 'square' | 'rectangle';
            }
            return updated;
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                <h2 className="text-xl font-bold mb-4">{background ? 'Sửa nền' : 'Thêm nền mới'}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Tên</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">URL Ảnh</label>
                        <input name="url" value={formData.url} onChange={handleChange} className="w-full p-2 border rounded-md" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium">Dịp (Category)</label>
                            <input name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-md" />
                         </div>
                        <div>
                           <label className="block text-sm font-medium">Loại Khung</label>
                           <select name="type" value={formData.type} onChange={handleChange} disabled={!!background} className="w-full p-2 border rounded-md bg-white disabled:bg-gray-100">
                                <option value="square">Vuông</option>
                                <option value="rectangle">Chữ nhật</option>
                           </select>
                        </div>
                    </div>
                    <div>
                        <label className="flex items-center gap-2">
                           <input name="isVisible" type="checkbox" checked={formData.isVisible} onChange={handleChange} className="h-4 w-4 rounded" />
                           <span className="text-sm font-medium">Hiển thị</span>
                        </label>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg hover:bg-gray-300">Hủy</button>
                    <button onClick={() => onSave(formData)} className="bg-luvin-pink text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90">Lưu</button>
                </div>
            </div>
        </div>
    );
};

export default AdminBackgroundsPage;
