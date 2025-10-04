import React, { useState } from 'react';
import { LoginFormData } from '../../types';

interface LoginFormProps {
  onLogin: (emailOrUsername: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, loading, error, onSwitchToRegister }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    emailOrUsername: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onLogin(formData.emailOrUsername, formData.password);
    } catch (err) {
      // Error handling is done by parent component
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-nexus-darkest">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Nexus Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 nexus-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 nexus-shadow">
            <span className="text-white font-bold text-2xl">N</span>
          </div>
          <h1 className="text-3xl font-bold text-nexus-primary mb-2">Nexus</h1>
        </div>
        <div>
          <h2 className="text-center text-2xl font-bold text-white mb-2">
            Welcome back!
          </h2>
          <p className="text-center text-sm text-gray-400">
            Sign in to continue collaborating with your team.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="emailOrUsername" className="block text-xs font-bold text-gray-300 uppercase mb-2">
                Email or Username
              </label>
              <input
                id="emailOrUsername"
                name="emailOrUsername"
                type="text"
                required
                value={formData.emailOrUsername}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-nexus-darker border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-primary focus:border-transparent transition-all"
                placeholder="Enter your email or username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-300 uppercase mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-nexus-darker border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nexus-primary focus:border-transparent transition-all"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-medium text-white nexus-gradient hover:bg-nexus-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nexus-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all nexus-shadow"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-gray-400 text-sm">
              New to Nexus?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-medium text-nexus-primary hover:text-nexus-primary-light transition-colors"
              >
                Create an account
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
