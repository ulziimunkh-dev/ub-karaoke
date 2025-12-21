import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const ReviewSection = ({ reviews = [], onAddReview }) => {
    const { t } = useLanguage();
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddReview(newReview);
        setNewReview({ rating: 5, comment: '' });
    };

    return (
        <div className="review-section">
            <h4>{t('reviews')}</h4>
            <div className="reviews-list">
                {(!reviews || reviews.length === 0) && <p className="text-muted">No reviews yet.</p>}
                {Array.isArray(reviews) && reviews.map(review => (
                    <div key={review.id} className="review-item">
                        <div className="review-header">
                            <span className="review-user">{review.userName || review.user || 'Anonymous'}</span>
                            <span className="review-rating">{'⭐'.repeat(review.rating || 5)}</span>
                        </div>
                        <p className="review-comment">{review.comment}</p>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="review-form">
                <h5>{t('writeReview')}</h5>
                <div className="form-group">
                    <label>{t('rating')}</label>
                    <select
                        value={newReview.rating}
                        onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                    >
                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <textarea
                        placeholder={t('shareExperience')}
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-outline btn-sm">{t('postReview')}</button>
            </form>
        </div>
    );
};

export default ReviewSection;
