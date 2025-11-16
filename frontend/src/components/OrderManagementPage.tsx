import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { StoredOrder, OrderStatus } from '../types';
import { API_BASE_URL } from '../App';

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const statusColors: Record<OrderStatus, string> = {
    'Chờ thanh toán': 'bg-yellow-100 text-yellow-800',
    'Đã xác nhận': 'bg-blue-100 text-blue-800',
    'Đang xử lý': 'bg-indigo-100 text-indigo-800',
    'Đang giao hàng': 'bg-purple-100 text-purple-800',
    'Đã giao hàng': 'bg-green-100 text-green-800',
    'Đã hủy': 'bg-red-100 text-red-800',
};
const ALL_STATUSES: OrderStatus[] = ['Chờ thanh toán', 'Đã xác nhận', 'Đang xử lý', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];

type SortKey = 'createdAt' | 'desiredDeliveryDate' | 'total';
type SortDirection = 'asc' | 'desc';

const OrderManagementPage: React.FC<{ showToast: (message: string, type: 'success' | 'error') => void; }> = ({ showToast }) => {
    const [orders, setOrders] = useState<StoredOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'createdAt', direction: 'desc' });

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders`);
            if (!response.ok) throw new Error('Failed to fetch orders');
            const data: StoredOrder[] = await response.json();
            setOrders(data);
        } catch (err) {
            setError('Không thể tải danh sách đơn hàng.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);
    
    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId.replace('#', '')}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error('Failed to update status');
            
            showToast('Cập nhật trạng thái thành công!', 'success');
            setOrders(prev => prev.map(o => o.details.orderId === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            showToast('Lỗi khi cập nhật trạng thái.', 'error');
        }
    };
    
    const requestSort = (key: SortKey) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const sortedAndFilteredOrders = useMemo(() => {
        return [...orders]
            .sort((a, b) => {
                let aValue = sortConfig.key === 'total' ? a.details.pricing.total : new Date(a.details[sortConfig.key] || 0).getTime();
                let bValue = sortConfig.key === 'total' ? b.details.pricing.total : new Date(b.details[sortConfig.key] || 0).getTime();
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            })
            .filter(order => statusFilter === 'all' || order.status === statusFilter)
            .filter(order => {
                const term = searchTerm.toLowerCase();
                return order.details.orderId.toLowerCase().includes(term) || order.details.customer.name.toLowerCase().includes(term);
            });
    }, [orders, searchTerm, statusFilter, sortConfig]);

    const isUrgent = (deliveryDate?: string): boolean => {
        if (!deliveryDate) return false;
        const diffDays = (new Date(deliveryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays < 3;
    }

    const SortableHeader: React.FC<{ sortKey: SortKey, children: React.ReactNode }> = ({ sortKey, children }) => (
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort(sortKey)}>
            {children}{sortConfig.key === sortKey && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
        </th>
    );

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Quản lý Đơn hàng</h1>

            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col sm:flex-row gap-4">
                <input type="text" placeholder="Tìm theo Mã đơn hoặc Tên..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow p-2 border rounded-md"/>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="p-2 border rounded-md bg-white">
                    <option value="all">Tất cả trạng thái</option>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoading ? <p className="p-8 text-center">Đang tải...</p> : error ? <p className="p-8 text-center text-red-600">{error}</p> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã Đơn</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                                    <SortableHeader sortKey="createdAt">Ngày Đặt</SortableHeader>
                                    <SortableHeader sortKey="desiredDeliveryDate">Ngày Giao</SortableHeader>
                                    <SortableHeader sortKey="total">Tổng tiền</SortableHeader>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedAndFilteredOrders.map(order => (
                                    <tr key={order.details.orderId} className={isUrgent(order.details.desiredDeliveryDate) ? 'bg-red-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{order.details.orderId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{order.details.customer.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(order.details.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                            {isUrgent(order.details.desiredDeliveryDate) && <span title="Gấp!">🔥 </span>}
                                            {order.details.desiredDeliveryDate ? new Date(order.details.desiredDeliveryDate).toLocaleDateString('vi-VN') : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{formatCurrency(order.details.pricing.total)}</td>
                                        <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status]}`}>{order.status}</span></td>
                                        <td className="px-6 py-4"><select value={order.status} onChange={e => handleStatusChange(order.details.orderId, e.target.value as OrderStatus)} className="p-1 border rounded bg-white text-xs"><option hidden>Đổi</option>{ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></td>
                                    </tr>
                                ))}
                                {sortedAndFilteredOrders.length === 0 && (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-500">Không có đơn hàng nào.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderManagementPage;
