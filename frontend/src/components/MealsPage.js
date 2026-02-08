import React, { useState } from 'react';
import './MealsPage.css';

const MealsPage = ({ travelPlan, onComponentGenerate, loadingComponent }) => {
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [dietaryPreferences, setDietaryPreferences] = useState([]);

    const dietaryOptions = [
        "Vegetarian",
        "Non-Vegetarian",
        "Vegan",
        "Halal",
        "Kosher",
        "Gluten-Free",
        "Nut Allergy",
        "Lactose Intolerant"
    ];

    if (!travelPlan) return <div className="meals-page">No plan available.</div>;

    const { meals, localSpecialties, tripOverview } = travelPlan;
    const isGenerating = loadingComponent === 'meals' || loading;

    const handleDietaryChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setDietaryPreferences([...dietaryPreferences, value]);
        } else {
            setDietaryPreferences(dietaryPreferences.filter(p => p !== value));
        }
    };

    const handleGenerate = () => {
        if (onComponentGenerate) {
            // Merge existing constraints with new dietary preferences
            const combinedConstraints = [
                ...(tripOverview.constraints || []),
                ...dietaryPreferences
            ];

            onComponentGenerate('meals', {
                destination: tripOverview.fullDestination || tripOverview.destination,
                startDate: tripOverview.startDate,
                endDate: tripOverview.endDate,
                duration: tripOverview.duration,
                budget: tripOverview.budget || tripOverview.totalBudget,
                travelStyle: tripOverview.travelStyle,
                travelType: tripOverview.travelType, // Ensure travelType is passed
                constraints: combinedConstraints
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

        if (!Array.isArray(items)) return null;

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
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.searchQuery || (place.name + " " + (tripOverview.fullDestination || tripOverview.destination)))}`}
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
            <div className="meals-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Local Cuisine & Dining</h2>
                </div>

                <div className="dietary-preferences" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '10px',
                    background: 'rgba(0,0,0,0.03)',
                    padding: '15px',
                    borderRadius: '8px',
                    width: '100%',
                    border: '1px solid #eee'
                }}>
                    <span style={{ gridColumn: '1 / -1', fontWeight: 'bold', fontSize: '1rem', marginBottom: '5px' }}>Dietary Preferences:</span>
                    {dietaryOptions.map((option) => (
                        <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                value={option}
                                checked={dietaryPreferences.includes(option)}
                                onChange={handleDietaryChange}
                                style={{ width: '16px', height: '16px' }}
                            />
                            {option}
                        </label>
                    ))}
                </div>

                <div className="header-actions" style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <div className="generation-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {meals && (
                            <button
                                className="share-btn"
                                onClick={copyToClipboard}
                                title="Copy Food Guide"
                                style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', padding: '10px' }}
                            >
                                🗒
                            </button>
                        )}
                        <button
                            className="generate-btn"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            style={{ fontSize: '1.2rem', padding: '12px 24px' }}
                        >
                            {isGenerating ? 'Curating Menu...' : (meals ? 'Regenerate Food Guide' : 'Generate Food Guide AI')}
                        </button>
                    </div>
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
