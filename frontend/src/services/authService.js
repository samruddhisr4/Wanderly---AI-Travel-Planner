import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3005/api";

class AuthService {
  // Store token in localStorage
  setToken(token) {
    localStorage.setItem("token", token);
  }

  // Get token from localStorage
  getToken() {
    return localStorage.getItem("token");
  }

  // Remove token from localStorage
  removeToken() {
    localStorage.removeItem("token");
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    return !!token;
  }

  // Get user info from token (decoded)
  getUserInfo() {
    const token = this.getToken();
    if (!token) return null;

    try {
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
      };
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/register`,
        userData
      );
      if (response.data.token) {
        this.setToken(response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Registration failed" };
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        credentials
      );
      if (response.data.token) {
        this.setToken(response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Login failed" };
    }
  }

  // Logout user
  logout() {
    this.removeToken();
  }

  // Get user's travel plans
  async getTravelPlans() {
    try {
      const token = this.getToken();
      const response = await axios.get(`${API_BASE_URL}/travel/plans`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to fetch travel plans" };
    }
  }

  // Save travel plan for user
  async saveTravelPlan(planData) {
    try {
      const token = this.getToken();
      const response = await axios.post(
        `${API_BASE_URL}/travel/plans`,
        planData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to save travel plan" };
    }
  }

  // Update travel plan
  async updateTravelPlan(planId, planData) {
    try {
      const token = this.getToken();
      const response = await axios.put(
        `${API_BASE_URL}/travel/plans/${planId}`,
        planData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to update travel plan" };
    }
  }

  // Delete travel plan
  async deleteTravelPlan(planId) {
    try {
      const token = this.getToken();
      const response = await axios.delete(
        `${API_BASE_URL}/travel/plans/${planId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Failed to delete travel plan" };
    }
  }
}

const authService = new AuthService();
export default authService;
