import React, { useState } from 'react';
import { ASSETS } from '../constants';

interface LoginProps {
  onLogin: () => void;
  onBack?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-dark font-display antialiased h-screen w-full overflow-hidden flex flex-col md:flex-row">
      {/* Left Side: Login Form */}
      <div className="w-full md:w-[45%] h-full flex flex-col relative z-10 bg-background-light dark:bg-background-dark overflow-y-auto">
        {/* Logo Header */}
        <div className="px-8 py-6 md:px-12 md:py-8 flex justify-between items-center">
          <a className="flex items-center gap-3 text-text-dark group transition-opacity hover:opacity-80" href="#" onClick={(e) => { e.preventDefault(); if(onBack) onBack(); }}>
            <img src={ASSETS.logo} alt="LUCHA-FIT" className="h-12 w-auto object-contain" />
          </a>
          {onBack && (
              <button onClick={onBack} className="text-sm font-medium text-text-muted hover:text-primary transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Inicio
              </button>
          )}
        </div>
        
        {/* Main Form Content */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-12 lg:px-20 py-4">
          <div className="max-w-[480px] w-full mx-auto">
            <div className="mb-8 md:mb-10">
              <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-text-dark dark:text-white mb-3">
                Acceso para Profesionales
              </h1>
              <p className="text-text-muted text-base md:text-lg">
                Gestiona las mediciones y el progreso de tus clientes desde un solo lugar.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label className="text-text-dark dark:text-gray-200 text-sm font-semibold" htmlFor="email">Correo Electrónico</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </span>
                  <input 
                    className="w-full rounded-lg border border-input-border bg-white dark:bg-[#1a3324] dark:border-[#2a4d36] dark:text-white h-12 md:h-14 pl-12 pr-4 text-base placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200" 
                    id="email" 
                    type="email" 
                    placeholder="profesional@luchafit.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-text-dark dark:text-gray-200 text-sm font-semibold" htmlFor="password">Contraseña</label>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </span>
                  <input 
                    className="w-full rounded-lg border border-input-border bg-white dark:bg-[#1a3324] dark:border-[#2a4d36] dark:text-white h-12 md:h-14 pl-12 pr-4 text-base placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200" 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Extras */}
              <div className="flex flex-wrap items-center justify-between gap-y-2 mt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input className="h-5 w-5 rounded border-input-border bg-white dark:bg-[#1a3324] text-primary focus:ring-offset-0 focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer" type="checkbox"/>
                  <span className="text-sm font-medium text-text-dark dark:text-gray-300 group-hover:text-primary transition-colors">Recordar mi usuario</span>
                </label>
                <a className="text-sm font-bold text-primary hover:text-primary-dark hover:underline transition-colors" href="#">¿Olvidaste tu contraseña?</a>
              </div>
              
              {/* Submit Button */}
              <button 
                type="submit" 
                className="mt-4 flex w-full cursor-pointer items-center justify-center rounded-lg h-12 md:h-14 bg-primary hover:bg-primary-dark active:scale-[0.99] transition-all duration-200 text-[#0d1b12] text-base font-bold tracking-wide shadow-lg shadow-primary/20"
              >
                Entrar a la Plataforma
              </button>
            </form>
            
            {/* Signup CTA */}
            <div className="mt-8 text-center">
              <p className="text-text-muted text-sm">
                ¿Aún no tienes una cuenta profesional? 
                <a className="font-bold text-text-dark dark:text-white hover:text-primary transition-colors ml-1" href="#">Regístrate aquí</a>
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 md:p-8 text-center md:text-left">
          <p className="text-xs text-text-muted">
            © 2024 Lucha-Fit. Todos los derechos reservados.
          </p>
        </div>
      </div>
      
      {/* Right Side: Hero Image */}
      <div className="hidden md:flex md:w-[55%] h-full relative bg-gray-900 overflow-hidden">
        {/* Background Image */}
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAH7Rqoc5nkM6SRfgGU7qezYSo6jRuRqoUr1gdt_pr3KFAj_WayuwMwmeRlxNt88qYw8czA9pNiH-PR34NZoa9Lc7QIRAZQ3-U3uZYuJheO85e_4LHDPs8rvMhJXzhrd0wWoLjTYkRHlryUYNdqSnGmaoMt7q2G-KQnzSejVund2oeBqr6uTkrznsCMWwgcOH0ROr5Ta3_S6g151_9WtAvHkelKV2cLzRcbxkNkuUVnphHwgTvRxxq1N3SFbpXWVH-dQivLSToX18" 
          alt="Professional fitness trainer measuring athlete progress" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b12] via-[#0d1b12]/60 to-transparent mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-primary/20 mix-blend-overlay"></div>
        
        {/* Content Overlay */}
        <div className="relative z-10 w-full h-full flex flex-col justify-end p-12 lg:p-20">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 mb-6 w-fit">
              <span className="material-symbols-outlined text-primary text-sm">verified</span>
              <span className="text-primary text-xs font-bold uppercase tracking-wider">Certificado para Expertos</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-4 drop-shadow-md">
              Ciencia y Deporte <br/>
              <span className="text-primary">En Sintonía.</span>
            </h2>
            <p className="text-lg text-gray-200 font-light max-w-md leading-relaxed drop-shadow-sm">
              Lleva el control antropométrico al siguiente nivel con herramientas de precisión diseñadas para el alto rendimiento.
            </p>
          </div>
          
          {/* Quick Stats/Social Proof */}
          <div className="flex gap-8 mt-12 pt-8 border-t border-white/10">
            <div>
              <p className="text-3xl font-bold text-white">2.5k+</p>
              <p className="text-sm text-gray-300">Entrenadores</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">98%</p>
              <p className="text-sm text-gray-300">Satisfacción</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">100%</p>
              <p className="text-sm text-gray-300">Seguro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;