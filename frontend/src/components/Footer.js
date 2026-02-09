import React from "react";
import "./Footer.css";

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-logo">
                    <h2 style={{ fontFamily: "Broadway", margin: 0 }}>Wanderly</h2>
                    <p>Your AI-powered travel companion.</p>
                </div>

                <div className="footer-description">
                    <p>
                        Wanderly is your AI-powered travel companion, designing personalized itineraries
                        tailored to your unique preferences. Start exploring the world with smarter,
                        stress-free planning today.
                    </p>
                </div>

                <div className="footer-links">
                    <div className="footer-column">
                        <h3>Explore</h3>
                        <a href="#home">Home</a>
                        <a href="#itinerary">Itinerary</a>
                        <a href="#budget">Budget</a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Wanderly AI. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
