import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { StoredOrder } from '../types';

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const DashboardPage: React.FC<{ showToast: (msg: string, type: 'success' | 'error') => void; }> = ({ showToast }) => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        newOrdersCount: 0,
        averageOrderValue: 0,
        recentOrders: [] as StoredOrder[],
        urgentOrders: [] as StoredOrder[],
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data, error } = await supabase.from('orders').select('details, created_at, status');
                if (error) throw error;
                
                const orders: StoredOrder[] = data.map((o: any) => ({ status: o.status, details: o.details }));
                
                const totalRevenue = orders.reduce((sum, order) => sum + order.details.pricing.total, 0);
                
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const newOrdersCount = orders.filter(o => new Date(o.details.createdAt!) > yesterday).length;

                const recentOrders = [...orders]
                    .sort((a, b) => new Date(b.details.createdAt!).getTime() - new Date(a.details.createdAt!).getTime())
                    .slice(0, 5);

                const urgentOrders = orders.filter(o => {
                    if (!o.details.desiredDeliveryDate) return false;
                    const diffDays = (new Date(o.details.desiredDeliveryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                    return diffDays >= 0 && diffDays < 3;
                });
                
                setStats({
                    totalRevenue,
                    newOrdersCount,
                    averageOrderValue: orders.length ? totalRevenue / orders.length : 0,
                    recentOrders,
                    urgentOrders,
                });

            } catch (error) {
                console.error(error);
                showToast("Không thể tải dữ liệu dashboard", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [showToast]);

    if (isLoading) {
        return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
    }

    const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
    );

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Tổng quan</h1>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <StatCard title="Tổng doanh thu" value={formatCurrency(stats.totalRevenue)} />
                <StatCard title="Đơn hàng mới (24h)" value={stats.newOrdersCount} />
                <StatCard title="Giá trị TB / đơn" value={formatCurrency(stats.averageOrderValue)} />
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-4">Đơn hàng cần xử lý gấp (Giao trong 3 ngày)</h3>
                    <div className="space-y-3">
                        {stats.urgentOrders.length > 0 ? stats.urgentOrders.map(order => (
                             <div key={order.details.orderId} className="text-sm flex justify-between items-center bg-red-50 p-2 rounded-md">
                                <div>
                                    <p className="font-bold">{order.details.orderId}</p>
                                    <p className="text-xs text-gray-600">{order.details.customer.name}</p>
                                </div>
                                <p className="font-semibold text-red-700">{new Date(order.details.desiredDeliveryDate!).toLocaleDateString('vi-VN')}</p>
                            </div>
                        )) : <p className="text-sm text-gray-500">Không có đơn hàng nào cần xử lý gấp.</p>}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-semibold mb-4">Đơn hàng mới nhất</h3>
                    <div className="space-y-3">
                        {stats.recentOrders.length > 0 ? stats.recentOrders.map(order => (
                            <div key={order.details.orderId} className="text-sm flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{order.details.orderId}</p>
                                    <p className="text-xs text-gray-600">{order.details.customer.name}</p>
                                </div>
                                <p className="font-semibold">{formatCurrency(order.details.pricing.total)}</p>
                            </div>
                        )) : <p className="text-sm text-gray-500">Chưa có đơn hàng nào.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;