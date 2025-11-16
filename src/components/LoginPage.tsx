import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import type { Page } from '../types';

interface LoginPageProps {
    navigateTo: (page: Page) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ navigateTo, showToast }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const success = await login(email, password);

        setIsLoading(false);
        if (success) {
            showToast('Đăng nhập thành công!', 'success');
            navigateTo('admin-dashboard');
        } else {
            setError('Email hoặc mật khẩu không đúng.');
            showToast('Đăng nhập thất bại', 'error');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50 p-4">
            <div className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl px-8 pt-6 pb-8 mb-4">
                    <h1 className="text-4xl font-heading text-center text-luvin-pink mb-6">Admin Login</h1>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-1 focus:ring-luvin-pink"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Mật khẩu
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="******************"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-1 focus:ring-luvin-pink"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs italic mb-4 text-center">{error}</p>}
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-luvin-pink hover:opacity-90 text-gray-800 font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-opacity disabled:opacity-50"
                        >
                            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;