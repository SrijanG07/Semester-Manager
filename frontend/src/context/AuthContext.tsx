import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface User {
    _id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            const userData = {
                _id: data._id,
                name: data.name,
                email: data.email,
            };
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            toast.success('Login successful!');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            throw error;
        }
    };

    const register = async (name: string, email: string, password: string) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            const userData = {
                _id: data._id,
                name: data.name,
                email: data.email,
            };
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            toast.success('Registration successful!');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Registration failed';
            toast.error(message);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        toast.success('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
