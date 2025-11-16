import React, { useState, useMemo } from 'react';
import type { AllProducts, LegoPart, FrameOption, Product } from '../types';
import { supabase } from '../supabase';

const ProductManagementPage: React.FC<{
    allProducts: AllProducts | null;
    showToast: (msg: string, type: 'success' | 'error') => void;
    onProductUpdate: () => void;
}> = ({ allProducts, showToast, onProductUpdate }) => {
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const productsList = useMemo(() => {
        if (!allProducts) return [];
        const frames = allProducts.frames.map(f => ({ ...f, type: 'frame' as const }));
        const parts = Object.values(allProducts.lego_parts).flat();
        return [...frames, ...parts];
    }, [allProducts]);
    
    const filteredProducts = useMemo(() => {
        return productsList
            .filter(p => filter === 'all' || p.type === filter)
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [productsList, filter, searchTerm]);

    const categories = ['all', 'frame', ...Object.keys(allProducts?.lego_parts || {})];

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleSave = async (productToSave: Product) => {
        try {
            const { error } = await supabase.from('products').upsert(productToSave);
            if (error) throw error;
            
            showToast("Lưu sản phẩm thành công", "success");
            onProductUpdate();
        } catch (error) {
            showToast("Lỗi khi lưu sản phẩm.", "error");
            console.error(error);
        } finally {
            setIsModalOpen(false);
            setEditingProduct(null);
        }
    };

    if (!allProducts) {
        return <div className="p-8 text-center">Đang tải dữ liệu sản phẩm...</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Quản lý Sản phẩm</h1>
            
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
                <input
                    type="text"
                    placeholder="Tìm sản phẩm..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-grow p-2 border rounded-md"
                />
                <select value={filter} onChange={e => setFilter(e.target.value)} className="p-2 border rounded-md bg-white">
                    {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
                {/* <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="bg-green-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-600">
                    + Thêm mới
                </button> */}
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                       {filteredProducts.map(product => (
                           <tr key={`${product.type}-${product.id}`}>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.type}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.price}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stock}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm">
                                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isVisible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                       {product.isVisible ? 'Hiển thị' : 'Ẩn'}
                                   </span>
                               </td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                   <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900">Sửa</button>
                               </td>
                           </tr>
                       ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <ProductEditModal 
                    product={editingProduct} 
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

const ProductEditModal: React.FC<{ product: Product | null, onClose: () => void, onSave: (p: Product) => void }> = ({ product, onClose, onSave }) => {
    // FIX: Added `imageUrl: ''` to the default object to ensure it is a valid `LegoPart` and thus a valid `Product`.
    const [formData, setFormData] = useState<Product>(product || { id: '', name: '', price: 0, stock: 100, isVisible: true, type: 'hair', imageUrl: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const isNumber = type === 'number';
        
        setFormData(prev => ({
            ...prev,
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : isNumber ? Number(value) : value,
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                <h2 className="text-xl font-bold mb-4">{product ? `Sửa: ${product.name}` : 'Thêm sản phẩm mới'}</h2>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">ID (Không thể sửa)</label>
                            <input value={formData.id} readOnly className="w-full p-2 border rounded-md bg-gray-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Loại (Không thể sửa)</label>
                            <input value={formData.type} readOnly className="w-full p-2 border rounded-md bg-gray-100" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Tên</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium">Giá</label>
                           <input name="price" type="number" value={formData.price} onChange={handleChange} className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                           <label className="block text-sm font-medium">Tồn kho</label>
                           <input name="stock" type="number" value={formData.stock || 0} onChange={handleChange} className="w-full p-2 border rounded-md" />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Image URL</label>
                        <input name="imageUrl" value={(formData as any).imageUrl || ''} onChange={handleChange} className="w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="flex items-center gap-2">
                           <input name="isVisible" type="checkbox" checked={formData.isVisible} onChange={handleChange} className="h-4 w-4 rounded" />
                           <span className="text-sm font-medium">Hiển thị sản phẩm</span>
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

export default ProductManagementPage;
