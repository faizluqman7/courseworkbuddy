import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
    register as apiRegister,
    login as apiLogin,
    logout as apiLogout,
    getMe,
    getAuthToken,
    setAuthToken,
    removeAuthToken,
    ApiError
} from '@/services/api';
import type {
    User,
    AuthResponse,
    RegisterData,
    LoginData,
} from '@/services/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (data: LoginData) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check for existing token on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = getAuthToken();
            if (token) {
                try {
                    const userData = await getMe();
                    setUser(userData);
                } catch {
                    // Token expired or invalid
                    removeAuthToken();
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const handleAuthResponse = useCallback((response: AuthResponse) => {
        setAuthToken(response.access_token);
        setUser(response.user);
        setError(null);
    }, []);

    const login = useCallback(async (data: LoginData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiLogin(data);
            handleAuthResponse(response);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Login failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [handleAuthResponse]);

    const register = useCallback(async (data: RegisterData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiRegister(data);
            handleAuthResponse(response);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Registration failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [handleAuthResponse]);

    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } catch {
            // Ignore errors - clear local state anyway
        }
        removeAuthToken();
        setUser(null);
        setError(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
