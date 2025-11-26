import React, { useState, useEffect } from 'react';
import { useToasts } from '../context/ToastContext';
import Logo from '../assets/Logo';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<{success: boolean, message: string}>;
  onSignup: (username: string, password: string) => Promise<{success: boolean, message: string}>;
  onGuestLogin: () => void;
}

const AuthSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSignup, onGuestLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; form?: string }>({});
  const { addToast } = useToasts();

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username) {
        newErrors.username = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(username)) {
        newErrors.username = 'Please enter a valid email address.';
    }

    if (!password) {
        newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
        validate();
    }
  }, [username, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;

    setIsLoading(true);
    const action = isLoginView ? onLogin : onSignup;
    const result = await action(username, password);

    if (result.success) {
      addToast(result.message, 'success');
    } else {
      setErrors({ form: result.message });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 w-full relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="w-full max-w-md mx-auto relative z-10">
            <div className="bg-[#030712]/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden animate-scale-in">
                
                {/* Header Section */}
                <div className="p-8 pb-6 text-center border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                    <div className="flex justify-center mb-6 relative">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full transform scale-150"></div>
                        <div className="relative z-10 p-1 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-black/40">
                             <Logo className="w-20 h-20 rounded-full" />
                        </div>
                    </div>
                    <h1 className="font-title text-3xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500 tracking-tight drop-shadow-sm">
                       Chat Jiam
                    </h1>
                    <p className="text-gray-400 text-sm mt-2 font-light tracking-wide">
                        Think out  of the box.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1.5 mx-8 mt-6 bg-black/40 rounded-xl border border-white/5 relative">
                    <div 
                        className={`absolute top-1.5 bottom-1.5 rounded-lg bg-white/10 shadow-sm transition-all duration-300 ease-out`}
                        style={{ 
                            left: isLoginView ? '0.375rem' : '50%', 
                            width: 'calc(50% - 0.375rem)'
                        }}
                    ></div>
                    <button
                        onClick={() => { setIsLoginView(true); setErrors({}); }}
                        className={`flex-1 relative z-10 py-2 text-sm font-medium transition-colors duration-200 ${isLoginView ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        aria-selected={isLoginView}
                        role="tab"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => { setIsLoginView(false); setErrors({}); }}
                        className={`flex-1 relative z-10 py-2 text-sm font-medium transition-colors duration-200 ${!isLoginView ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        aria-selected={!isLoginView}
                        role="tab"
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form Section */}
                <div className="p-8 pt-6">
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <input
                                    type="email"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    aria-invalid={!!errors.username}
                                    aria-describedby={errors.username ? "username-error" : undefined}
                                    className={`w-full bg-black/40 border ${errors.username ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-cyan-500/50'} rounded-xl text-white pl-10 pr-4 py-3 text-sm placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300`}
                                    placeholder="user@example.com"
                                    required
                                />
                            </div>
                            {errors.username && <p id="username-error" className="text-red-400 text-xs ml-1 animate-slide-in-left">{errors.username}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    aria-invalid={!!errors.password}
                                    aria-describedby={errors.password ? "password-error" : undefined}
                                    className={`w-full bg-black/40 border ${errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-cyan-500/50'} rounded-xl text-white pl-10 pr-4 py-3 text-sm placeholder-gray-600 outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300`}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            {errors.password && <p id="password-error" className="text-red-400 text-xs ml-1 animate-slide-in-left">{errors.password}</p>}
                        </div>

                        {errors.form && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center animate-fade-in">
                                <p className="text-red-400 text-xs font-medium">{errors.form}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full relative group overflow-hidden px-4 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
                            aria-label={isLoading ? 'Processing...' : (isLoginView ? 'Sign in to your account' : 'Create new account')}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <>
                                        <AuthSpinner />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <span>{isLoginView ? 'Initiate Sequence' : 'Register Identity'}</span>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#030712] px-3 text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <button
                        onClick={onGuestLogin}
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl transition-all duration-300 hover:bg-white/10 hover:text-white hover:border-white/20 focus:ring-2 focus:ring-white/10 disabled:opacity-50"
                        aria-label="Continue as Guest"
                    >
                        Guest Access
                    </button>
                </div>
            </div>
            
            <p className="text-center text-gray-600 text-xs mt-8">
                &copy; {new Date().getFullYear()} Jiam AI Systems. Secure Connection Established.
            </p>
        </div>
    </div>
  );
};

export default LoginScreen;