import React, { useState } from 'react';
import './AccommodationPage.css';

const AccommodationPage = ({ travelPlan, onComponentGenerate, loadingComponent }) => {
    const [loading, setLoading] = useState(false);

    if (!travelPlan) return <div className="accommodation-page">No plan available.</div>;

    const { accommodation, tripOverview } = travelPlan;
    const isGenerating = loadingComponent === 'accommodation' || loading;

    const handleGenerate = () => {
        if (onComponentGenerate) {
            onComponentGenerate('accommodation', {
                destination: tripOverview.fullDestination || tripOverview.destination,
                startDate: tripOverview.startDate,
                endDate: tripOverview.endDate,
                duration: tripOverview.duration,
                budget: tripOverview.budget || tripOverview.totalBudget,
                travelStyle: tripOverview.travelStyle,
                travelType: tripOverview.travelType,
                constraints: tripOverview.constraints || []
            });
        }
    };

    const copyToClipboard = () => {
        if (!accommodation || !Array.isArray(accommodation)) return;

        let text = `Accommodation Options for ${tripOverview.destination}\n\n`;
        accommodation.forEach((hotel, idx) => {
            text += `${idx + 1}. ${hotel.name} (${hotel.type})\n`;
            text += `   Price: ${hotel.pricePerNight}\n`;
            text += `   Rating: ${hotel.rating}\n`;
            text += `   Location: ${hotel.location}\n`;
            text += `   Link: https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.searchQuery || hotel.name)}\n\n`;
        });

        navigator.clipboard.writeText(text).then(() => alert("Accommodation options copied!"));
    };

    return (
        <div className="accommodation-page">
            <div className="accommodation-header">
                <h2>Accommodation Options</h2>
                <div className="header-actions">
                    <div className="header-actions">
                        <div className="generation-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {accommodation && (
                                <button
                                    className="share-btn"
                                    onClick={copyToClipboard}
                                    title="Copy to Clipboard"
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
                                {isGenerating ? 'Generating...' : (accommodation ? 'Regenerate Options' : 'Generate Options AI')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {!accommodation ? (
                <div className="no-data">
                    <p>No accommodation options generated yet.</p>
                    <p>Click "Generate Options AI" to get recommendations tailored to your budget.</p>
                </div>
            ) : (
                <div className="accommodation-list">
                    {Array.isArray(accommodation) && accommodation.map((item, index) => (
                        <div key={index} className="accommodation-card">
                            <div className="card-header">
                                <h3>{item.name}</h3>
                                <span className="rating">⭐ {item.rating}</span>
                                <span className="price-tag">{item.pricePerNight}</span>
                            </div>
                            <p className="type">{item.type} • {item.location}</p>
                            <p className="description">{item.description}</p>

                            <div className="amenities">
                                {item.amenities && item.amenities.map((am, i) => (
                                    <span key={i} className="amenity-tag">{am}</span>
                                ))}
                            </div>

                            <div className="card-actions">
                                <a
                                    href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(item.searchQuery || (item.name + " " + (tripOverview.fullDestination || tripOverview.destination)))}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="book-link booking"
                                >
                                    View on Booking.com
                                </a>
                                <a
                                    href={`https://www.airbnb.com/s/${encodeURIComponent(item.searchQuery || (item.name + " " + (tripOverview.fullDestination || tripOverview.destination)))}/homes`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="book-link airbnb"
                                >
                                    View on Airbnb
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AccommodationPage;
