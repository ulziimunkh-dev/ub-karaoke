import React from 'react';
import Header from '../Header';
import PolicyContent from '../public/PolicyContent';

const Policy = () => {
    return (
        <div className="min-h-screen bg-[#0B0B15] text-white selection:bg-[#b000ff] selection:text-white flex flex-col">
            <Header />
            <div className="flex-1 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-[#1a1a24] p-5 md:p-10 rounded-2xl md:rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] left-0"></div>
                    <PolicyContent />
                </div>
            </div>
        </div>
    );
};

export default Policy;
