# Wanderly - AI Travel Planner

A full-stack travel planning application that generates realistic, human-friendly travel itineraries using AI-powered prompt engineering. Built with React frontend and Node.js/Express backend.

## 🎯 Core Philosophy

**AI Reasoning First**: We prioritize thoughtful travel planning over exhaustive completeness. Our AI focuses on:
- Realistic daily pacing that prevents traveler burnout
- Budget-appropriate recommendations that match user constraints
- Practical activity distribution based on travel style (chill/balanced/fast-paced)
- Context-aware safety considerations for all travelers

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ 
- npm 
- Modern web browser

### Installation

1. **Clone and setup backend:**
```bash
cd Wanderly---AI-Travel-Planner/backend
npm install
```

2. **Start backend server:**
```bash
npm start
# Server runs on http://localhost:3004
```

3. **Setup frontend (in new terminal):**
```bash
cd ../frontend
npm install
```

4. **Start frontend development server:**
```bash
npm start
# App opens on http://localhost:3000
```

## 🧠 AI Architecture

### Prompt Engineering Approach
- **No model training**: Leverages existing LLM capabilities through carefully crafted prompts
- **Travel style adaptation**: Adjusts activity density (2-4 activities/day) based on user preference
- **Budget intelligence**: Distributes costs across 5 categories with realistic percentages
- **Safety integration**: Incorporates women-specific safety considerations and emergency resources

### Response Structure
```json
{
  "tripSummary": {"destination", "duration", "travelStyle"},
  "budgetBreakdown": {"accommodation", "food", "transport", "activities", "contingency"},
  "dailyItinerary": [{"day", "date", "activities", "meals", "accommodation"}],
  "recommendations": {"stay", "food"},
  "safetyInformation": {"womenSpecific", "generalGuidelines"}
}
```

## ⚖️ Practical Constraints

### Technical Limitations
- **Trip duration**: 1-30 days maximum (prevents abuse and ensures quality)
- **Budget ranges**: Validated positive numbers only
- **Travel styles**: Predefined options (chill, balanced, fast-paced)
- **Constraints**: Whitelisted requirements for security

### Data Validation
- Dates: Must be chronological and within reasonable ranges
- Budget: Positive numbers with minimum viable thresholds
- Destination: Required field with format validation
- Travel type: Limited to prevent inappropriate content

## 🛡️ Ethics & Safety

### Responsible AI Implementation
- **Non-alarmist safety guidance**: Factual information without fear-mongering
- **Women's safety focus**: Dedicated helpline integration and safer area recommendations
- **Cultural sensitivity**: Appropriate dress codes and behavior guidance for conservative regions
- **Graceful degradation**: Falls back to universal safety principles when specific data unavailable

### Data Privacy
- No personal information storage
- Client-side form validation
- Secure API communication
- No tracking or analytics by default

### Inclusive Design
- Accessibility considerations in UI components
- Clear labeling avoiding system failure implications
- Responsive design for all device sizes
- Semantic HTML structure for screen readers

## 📁 Project Structure

```
Wanderly---AI-Travel-Planner/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic (AI orchestration)
│   │   ├── routes/         # API endpoints
│   │   └── config/         # Server configuration
│   └── server.js           # Main entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   └── services/       # API communication
│   └── public/             # Static assets
└── shared/                 # Common utilities
```

## 🧪 Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend  
npm start    # React development server with hot reload
```

### Testing
- Manual testing via `test.html` in project root
- API endpoints testable with curl or Postman
- Component testing through browser developer tools

## 🔧 Configuration

### Environment Variables (.env)
```env
PORT=3004
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Customization Points
- Travel style configurations in `backend/src/services/ai-service.js`
- Safety guidelines in `backend/src/services/safety-service.js`
- UI components in `frontend/src/components/`
- Styling variables in CSS files

## 📈 Future Enhancements

- [ ] Integration with actual LLM APIs
- [ ] User account system for saving plans
- [ ] Real-time booking integration (flight/hotel)
- [ ] Map integration with location markers
- [ ] Multi-language support
- [ ] Mobile app version

## 🤝 Contributing

This project follows practical, interview-ready design principles:
- Clear separation of concerns
- Professional code organization
- Minimalist yet functional UI
- Robust error handling
- Scalable architecture patterns

Focus on improving:
- Edge case handling
- User experience refinement
- Performance optimization
- Security hardening

## 📄 License

This project is for educational/portfolio purposes. The AI planning logic is proprietary methodology demonstrating practical application development skills.

---

*Built with ❤️ for fellow travelers who deserve thoughtful planning assistance*