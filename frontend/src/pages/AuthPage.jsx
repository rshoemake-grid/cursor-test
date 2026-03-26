import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e)=>{
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(username, password, rememberMe);
            } else {
                await register(username, email, password, fullName);
            }
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally{
            setLoading(false);
        }
    };
    return /*#__PURE__*/ _jsx("div", {
        className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100",
        children: /*#__PURE__*/ _jsxs("div", {
            className: "bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md",
            children: [
                /*#__PURE__*/ _jsxs("div", {
                    className: "text-center mb-8",
                    children: [
                        /*#__PURE__*/ _jsx("h1", {
                            className: "text-3xl font-bold text-gray-900 mb-2",
                            children: isLogin ? 'Welcome Back' : 'Create Account'
                        }),
                        /*#__PURE__*/ _jsx("p", {
                            className: "text-gray-600",
                            children: isLogin ? 'Sign in to your workflow account' : 'Start building amazing workflows'
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("form", {
                    onSubmit: handleSubmit,
                    className: "space-y-4",
                    children: [
                        error && /*#__PURE__*/ _jsx("div", {
                            className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg",
                            children: error
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            children: [
                                /*#__PURE__*/ _jsx("label", {
                                    className: "block text-sm font-medium text-gray-700 mb-2",
                                    children: "Username"
                                }),
                                /*#__PURE__*/ _jsx("input", {
                                    type: "text",
                                    value: username,
                                    onChange: (e)=>setUsername(e.target.value),
                                    required: true,
                                    autoFocus: true,
                                    className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                                    placeholder: "Enter your username"
                                })
                            ]
                        }),
                        !isLogin && /*#__PURE__*/ _jsxs(_Fragment, {
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    children: [
                                        /*#__PURE__*/ _jsx("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-2",
                                            children: "Email"
                                        }),
                                        /*#__PURE__*/ _jsx("input", {
                                            type: "email",
                                            value: email,
                                            onChange: (e)=>setEmail(e.target.value),
                                            required: true,
                                            className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                                            placeholder: "your@email.com"
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    children: [
                                        /*#__PURE__*/ _jsx("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-2",
                                            children: "Full Name (optional)"
                                        }),
                                        /*#__PURE__*/ _jsx("input", {
                                            type: "text",
                                            value: fullName,
                                            onChange: (e)=>setFullName(e.target.value),
                                            className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                                            placeholder: "John Doe"
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            children: [
                                /*#__PURE__*/ _jsx("label", {
                                    className: "block text-sm font-medium text-gray-700 mb-2",
                                    children: "Password"
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "relative",
                                    children: [
                                        /*#__PURE__*/ _jsx("input", {
                                            type: showPassword ? "text" : "password",
                                            value: password,
                                            onChange: (e)=>setPassword(e.target.value),
                                            required: true,
                                            minLength: 6,
                                            onKeyDown: (e)=>{
                                                if (e.key === 'Enter' && !loading) {
                                                    e.preventDefault();
                                                    handleSubmit(e);
                                                }
                                            },
                                            className: "w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                                            placeholder: "••••••••"
                                        }),
                                        /*#__PURE__*/ _jsx("button", {
                                            type: "button",
                                            onClick: ()=>setShowPassword(!showPassword),
                                            className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none",
                                            tabIndex: -1,
                                            children: showPassword ? /*#__PURE__*/ _jsx(EyeOff, {
                                                className: "w-5 h-5"
                                            }) : /*#__PURE__*/ _jsx(Eye, {
                                                className: "w-5 h-5"
                                            })
                                        })
                                    ]
                                })
                            ]
                        }),
                        isLogin && /*#__PURE__*/ _jsx(_Fragment, {
                            children: /*#__PURE__*/ _jsxs("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "flex items-center",
                                        children: [
                                            /*#__PURE__*/ _jsx("input", {
                                                type: "checkbox",
                                                id: "rememberMe",
                                                checked: rememberMe,
                                                onChange: (e)=>setRememberMe(e.target.checked),
                                                className: "h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            }),
                                            /*#__PURE__*/ _jsx("label", {
                                                htmlFor: "rememberMe",
                                                className: "ml-2 block text-sm text-gray-700",
                                                children: "Keep me logged in"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsx("button", {
                                        type: "button",
                                        onClick: ()=>navigate('/forgot-password'),
                                        className: "text-sm text-primary-600 hover:text-primary-700",
                                        children: "Forgot password?"
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ _jsx("button", {
                            type: "submit",
                            disabled: loading,
                            className: "w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                            children: loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'
                        })
                    ]
                }),
                /*#__PURE__*/ _jsx("div", {
                    className: "mt-6 text-center",
                    children: /*#__PURE__*/ _jsx("button", {
                        onClick: ()=>{
                            setIsLogin(!isLogin);
                            setError('');
                        },
                        className: "text-primary-600 hover:text-primary-700 font-medium",
                        children: isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'
                    })
                }),
                /*#__PURE__*/ _jsx("div", {
                    className: "mt-6 text-center",
                    children: /*#__PURE__*/ _jsx("button", {
                        onClick: ()=>navigate('/'),
                        className: "text-gray-600 hover:text-gray-700 text-sm",
                        children: "← Continue without signing in"
                    })
                })
            ]
        })
    });
}
