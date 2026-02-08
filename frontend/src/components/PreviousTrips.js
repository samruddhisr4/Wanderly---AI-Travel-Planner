import React, { useState, useEffect } from "react";
import authService from "../services/authService";

import "./PreviousTrips.css";

const PreviousTrips = ({ onSelectTrip }) => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedTripId, setExpandedTripId] = useState(null);

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        try {
            setLoading(true);
            const data = await authService.getTravelPlans();
            // data.plans contains the array of trips
            setTrips(data.plans || []);
            setError(null);
        } catch (err) {
            console.error("Error fetching trips:", err);
            setError("Failed to load your trip history.");
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (tripId) => {
        setExpandedTripId(expandedTripId === tripId ? null : tripId);
    };

    if (loading) {
        return <div className="loading-trips">Loading your trips...</div>;
    }

    if (error) {
        return (
            <div className="error-trips">
                <p>{error}</p>
                <button onClick={fetchTrips} className="retry-btn">
                    Retry
                </button>
            </div>
        );
    }

    if (trips.length === 0) {
        return (
            <div className="no-trips">
                <p>You haven't saved any trips yet. Start planning!</p>
            </div>
        );
    }

    return (
        <div className="previous-trips-container">
            <h2>Your Trip History</h2>
            <div className="trips-list">
                {trips.map((trip) => (
                    <div key={trip._id} className="trip-history-card">
                        <div
                            className={`trip-header ${expandedTripId === trip._id ? "active" : ""
                                }`}
                            onClick={() => toggleExpand(trip._id)}
                        >
                            <div className="trip-summary">
                                <h3>{trip.destination}</h3>
                                <span className="trip-dates">
                                    {new Date(trip.startDate).toLocaleDateString()} -{" "}
                                    {new Date(trip.endDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="trip-meta">
                                <span className="trip-budget">₹{trip.budget}</span>
                                <span className={`expand-icon`}>
                                    {expandedTripId === trip._id ? "▲" : "▼"}
                                </span>
                            </div>
                        </div>

                        {expandedTripId === trip._id && (
                            <div className="trip-details-expanded">
                                <div className="trip-actions">
                                    <button
                                        onClick={() => onSelectTrip(trip.planData)}
                                        className="view-full-plan-btn"
                                    >
                                        View Full Itinerary
                                    </button>
                                </div>
                                {/* Brief summary of itinerary */}
                                <div className="mini-itinerary">
                                    <p>
                                        <strong>Style:</strong> {trip.tripType}
                                    </p>
                                    <p>
                                        <strong>Accommodation:</strong> {trip.accommodation}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PreviousTrips;
