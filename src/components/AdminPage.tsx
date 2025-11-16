import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { StoredOrder, OrderStatus } from '../types';
import { supabase } from '../supabase';

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
    const [orders, setOrders] = useState<StoredOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'createdAt', direction: 'desc' });

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const formattedOrders: StoredOrder[] = data.map(o => ({
                status: o.status,
                details: o.details,
            }));
            setOrders(formattedOrders);
            setError(null);
        } catch (err: any) {
            setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    
    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('order_id_str', orderId);

            if (error) throw error;
            
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
            } else {
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
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Quản lý Đơn hàng</h1>

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
    );
};

export default AdminPage;