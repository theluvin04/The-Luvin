// FIX: Add `useCallback` to the React import.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { StoredOrder, OrderStatus } from '../types';
import { useAuth } from '../AuthContext';
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

const AdminPage: React.FC<{ showToast: (message: string, type: 'success' | 'error') => void; }> = ({ showToast }) => {
    const { logout } = useAuth();
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
            if (!response.ok) {
                if (response.status === 401) {
                  throw new Error('Unauthorized');
                }
                throw new Error('Failed to fetch orders');
            }
            const data: StoredOrder[] = await response.json();
            setOrders(data);
            setError(null);
        } catch (err: any) {
            if(err.message === 'Unauthorized') {
              setError('Phiên đăng nhập hết hạn. Vui lòng đăng xuất và đăng nhập lại.');
            } else {
              setError('Không thể kết nối tới server. Vui lòng thử lại.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    const handleLogout = async () => {
        const success = await logout();
        if (success) {
            showToast('Đăng xuất thành công!', 'success');
        } else {
            showToast('Lỗi khi đăng xuất.', 'error');
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/${orderId.replace('#', '')}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error('Failed to update status');
            
            showToast('Cập nhật trạng thái thành công!', 'success');
            setOrders(prevOrders => prevOrders.map(order => 
                order.details.orderId === orderId ? { ...order, status: newStatus } : order
            ));
        } catch (err) {
            showToast('Lỗi khi cập nhật trạng thái.', 'error');
            console.error(err);
        }
    };
    
    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredOrders = useMemo(() => {
        let sortableOrders = [...orders];

        sortableOrders.sort((a, b) => {
            let aValue, bValue;

            if (sortConfig.key === 'total') {
                aValue = a.details.pricing.total;
                bValue = b.details.pricing.total;
            } else { // Dates
                aValue = new Date(a.details[sortConfig.key] || 0).getTime();
                bValue = new Date(b.details[sortConfig.key] || 0).getTime();
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sortableOrders
            .filter(order => statusFilter === 'all' || order.status === statusFilter)
            .filter(order => {
                const term = searchTerm.toLowerCase();
                return (
                    order.details.orderId.toLowerCase().includes(term) ||
                    order.details.customer.name.toLowerCase().includes(term)
                );
            });
    }, [orders, searchTerm, statusFilter, sortConfig]);

    const isUrgent = (deliveryDate?: string): boolean => {
        if (!deliveryDate) return false;
        const diffDays = (new Date(deliveryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays < 3;
    }

    const SortableHeader: React.FC<{ sortKey: SortKey, children: React.ReactNode }> = ({ sortKey, children }) => (
        <th 
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
            onClick={() => requestSort(sortKey)}
        >
            {children}
            {sortConfig.key === sortKey && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
        </th>
    );

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchOrders} className="bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                            &#x21bb; Tải lại
                        </button>
                         <button onClick={handleLogout} className="bg-red-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                            Đăng xuất
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
                    <input type="text" placeholder="Tìm theo Mã đơn hoặc Tên khách..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-luvin-pink"/>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as OrderStatus | 'all')} className="p-2 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-luvin-pink">
                        <option value="all">Tất cả trạng thái</option>
                        {ALL_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {isLoading ? <p className="text-center p-8 text-gray-500">Đang tải đơn hàng...</p> : error ? <p className="text-center p-8 text-red-600 font-semibold">{error}</p> : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Đơn</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                                        <SortableHeader sortKey="createdAt">Ngày Đặt</SortableHeader>
                                        <SortableHeader sortKey="desiredDeliveryDate">Ngày Giao</SortableHeader>
                                        <SortableHeader sortKey="total">Tổng tiền</SortableHeader>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sortedAndFilteredOrders.map(order => (
                                        <tr key={order.details.orderId} className={isUrgent(order.details.desiredDeliveryDate) ? 'bg-red-50' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-800">{order.details.orderId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{order.details.customer.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.details.createdAt!).toLocaleDateString('vi-VN')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                                                {isUrgent(order.details.desiredDeliveryDate) && <span title="Gấp!" className="mr-1">🔥</span>}
                                                {order.details.desiredDeliveryDate ? new Date(order.details.desiredDeliveryDate).toLocaleDateString('vi-VN') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{formatCurrency(order.details.pricing.total)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status]}`}>{order.status}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <select value={order.status} onChange={e => handleStatusChange(order.details.orderId, e.target.value as OrderStatus)} className="p-1 border border-gray-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-luvin-pink">
                                                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                    {sortedAndFilteredOrders.length === 0 && (
                                        <tr><td colSpan={7} className="text-center py-8 text-gray-500">Không có đơn hàng nào phù hợp.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
