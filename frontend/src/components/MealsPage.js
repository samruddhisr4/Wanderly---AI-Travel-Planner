import React, { useState } from 'react';
import './MealsPage.css';

const MealsPage = ({ travelPlan, onComponentGenerate, loadingComponent }) => {
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');

    if (!travelPlan) return <div className="meals-page">No plan available.</div>;

    const { meals, localSpecialties, tripOverview } = travelPlan;
    const isGenerating = loadingComponent === 'meals' || loading;

    const handleGenerate = () => {
        if (onComponentGenerate) {
            onComponentGenerate('meals', {
                destination: tripOverview.destination,
                startDate: tripOverview.startDate,
                endDate: tripOverview.endDate,
                duration: tripOverview.duration,
                budget: tripOverview.totalBudget,
                travelStyle: tripOverview.travelStyle,
                constraints: tripOverview.constraints || []
            });
        }
    };

    const copyToClipboard = () => {
        if (!meals) return;

        let text = `Culinary Guide for ${tripOverview.destination}\n\n`;

        if (localSpecialties && localSpecialties.length > 0) {
            text += "Must-Try Local Specialties:\n";
            localSpecialties.forEach(dish => text += `- ${dish.name}: ${dish.description}\n`);
            text += "\n";
        }

        ['breakfast', 'lunch', 'dinner'].forEach(type => {
            if (meals[type] && meals[type].length > 0) {
                text += `${type.toUpperCase()} RECOMMENDATIONS:\n`;
                meals[type].forEach(place => {
                    text += `• ${place.name} (${place.cuisine})\n`;
                    text += `  Price: ${place.priceRange}\n`;
                    text += `  Specialties: ${place.specialties.join(', ')}\n`;
                    text += `  Maps: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.searchQuery || place.name)}\n\n`;
                });
            }
        });

        navigator.clipboard.writeText(text).then(() => alert("Meal guide copied!"));
    };

    const renderMealList = (type) => {
        if (!meals || !meals[type]) return null;

        let items = meals[type];
        if (filter === 'veg') {
            items = items.filter(m => m.dietaryTags?.some(t => t.toLowerCase().includes('veg')));
        }

        return (
            <div className="meal-section">
                <h3 className="meal-type-header">{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
                <div className="meal-grid">
                    {items.map((place, idx) => (
                        <div key={idx} className="meal-card">
                            <div className="meal-card-header">
                                <h4>{place.name}</h4>
                                <span className="price-badge">{place.priceRange}</span>
                            </div>
                            <p className="cuisine">{place.cuisine}</p>
                            <p className="description">{place.description}</p>

                            <div className="specialties">
                                <strong>Must Try:</strong> {place.specialties.join(', ')}
                            </div>

                            {place.dietaryTags && place.dietaryTags.length > 0 && (
                                <div className="dietary-tags">
                                    {place.dietaryTags.map((tag, i) => <span key={i} className="dietary-tag">{tag}</span>)}
                                </div>
                            )}

                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.searchQuery || place.name)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="maps-link"
                            >
                                📍 View on Maps
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="meals-page">
            <div className="meals-header">
                <h2>Local Cuisine & Dining</h2>
                <div className="header-actions">
                    {!meals && (
                        <button
                            className="generate-btn"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? 'Curating Menu...' : 'Generate Food Guide AI'}
                        </button>
                    )}
                    {meals && (
                        <button
                            className="share-btn"
                            onClick={copyToClipboard}
                            title="Copy Food Guide"
                            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                        >
                            🗒
                        </button>
                    )}
                </div>
            </div>

            {!meals ? (
                <div className="no-data">
                    <p>Discover the best local eats tailored to your taste.</p>
                    <p>Click "Generate Food Guide AI" to start.</p>
                </div>
            ) : (
                <>
                    {localSpecialties && localSpecialties.length > 0 && (
                        <div className="specialties-section">
                            <h3>🏆 Local Specialties</h3>
                            <div className="specialties-grid">
                                {localSpecialties.map((dish, i) => (
                                    <div key={i} className="specialty-card">
                                        <strong>{dish.name}</strong>
                                        <p>{dish.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="filters">
                        <button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All Options
                        </button>
                        {/* Add more dynamic filters based on constraints if needed */}
                    </div>

                    {renderMealList('breakfast')}
                    {renderMealList('lunch')}
                    {renderMealList('dinner')}
                </>
            )}
        </div>
    );
};

export default MealsPage;
