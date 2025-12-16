import React from 'react';

interface NetworkStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
}

const NetworkStatusModal: React.FC<NetworkStatusModalProps> = ({ isOpen, onClose, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border-l-4 border-yellow-500">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full dark:bg-yellow-900/30 dark:text-yellow-400">
                        <span className="material-symbols-outlined text-3xl">wifi_off</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Problema de Conexión</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {message || 'Se perdió la conexión con el servidor o ocurrió un error inesperado. Por favor, verifique su internet o intente nuevamente.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-yellow-500/20"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NetworkStatusModal;
