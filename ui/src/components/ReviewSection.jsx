import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from 'primereact/button';

const ReviewSection = ({ reviews, onSubmitReview }) => {
    const { t } = useLanguage();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmitReview({ rating: parseInt(rating), comment });
        setRating(5);
        setComment('');
    };

    return (
        <div className="mt-6">
            <h4 className="text-lg font-bold mb-4">{t('reviews')}</h4>
            <div className="space-y-3 mb-6">
                {(!reviews || reviews.length === 0) && <p className="text-gray-500 text-sm">No reviews yet.</p>}
                {reviews?.map((review, index) => (
                    <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-white">{review.userName}</span>
                            <div className="flex items-center gap-1">
                                {[...Array(review.rating)].map((_, i) => (
                                    <span key={i} className="text-yellow-400">★</span>
                                ))}
                            </div>
                        </div>
                        <p className="text-gray-300 text-sm">{review.comment}</p>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h5 className="text-base font-bold mb-3">{t('writeReview')}</h5>
                <div className="mb-3">
                    <label className="block text-sm mb-2 text-gray-400">{t('rating')}</label>
                    <select
                        value={rating}
                        onChange={e => setRating(e.target.value)}
                        className="w-full p-2 bg-[#151521] border border-[#2A2A35] rounded-lg text-white focus:outline-none focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff]/30"
                        required
                    >
                        <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                        <option value="4">⭐⭐⭐⭐ Good</option>
                        <option value="3">⭐⭐⭐ Average</option>
                        <option value="2">⭐⭐ Poor</option>
                        <option value="1">⭐ Terrible</option>
                    </select>
                </div>
                <div className="mb-3">
                    <textarea
                        placeholder={t('writeReview')}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        className="w-full p-3 bg-[#151521] border border-[#2A2A35] rounded-lg text-white focus:outline-none focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff]/30"
                        rows={3}
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="bg-[#b000ff] hover:bg-[#9a00e6] text-white font-bold py-2 px-4 rounded"
                >
                    {t('postReview')}
                </button>
            </form>
        </div>
    );
};

export default ReviewSection;
