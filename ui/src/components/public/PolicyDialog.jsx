import React from 'react';
import ReactDOM from 'react-dom';
import PolicyContent from './PolicyContent';

const PolicyDialog = ({ visible, onHide }) => {
    if (!visible) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-[fadeIn_0.3s_ease-out]" onClick={onHide}></div>

            {/* Dialog Container */}
            <div className="relative w-full max-w-2xl bg-[#0f0f18] border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] animate-[scaleIn_0.3s_ease-out]">

                {/* Visual Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#b000ff]/10 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#eb79b2]/10 rounded-full blur-[100px] pointer-events-none -ml-32 -mb-32"></div>

                {/* Header */}
                <div className="sticky top-0 z-10 px-8 py-6 flex justify-between items-center bg-[#0f0f18]/80 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-lg">
                            <i className="pi pi-shield text-white text-lg"></i>
                        </div>
                        <span className="text-xl font-black text-white tracking-tight uppercase">Platform Ethics</span>
                    </div>
                    <button
                        onClick={onHide}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                        ✕
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6">
                    <PolicyContent />
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 z-10 p-6 bg-[#0f0f18]/80 backdrop-blur-md border-t border-white/5 text-center">
                    <button
                        onClick={onHide}
                        className="px-10 h-12 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PolicyDialog;
