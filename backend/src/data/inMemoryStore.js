// In-memory data store for users and travel plans
// This module avoids circular dependencies between controllers and middleware

let users = [];
let travelPlans = [];

module.exports = {
  users,
  travelPlans,

  // User methods
  addUser: function (user) {
    users.push(user);
    return user;
  },

  findUserByEmail: function (email) {
    return users.find((u) => u.email === email);
  },

  findUserById: function (id) {
    return users.find((u) => u._id === id);
  },

  updateUser: function (id, updates) {
    const index = users.findIndex((u) => u._id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      return users[index];
    }
    return null;
  },

  // Travel plan methods
  addTravelPlan: function (plan) {
    travelPlans.push(plan);
    return plan;
  },

  findTravelPlansByUserId: function (userId) {
    return travelPlans.filter((p) => p.userId === userId);
  },

  findTravelPlanById: function (id) {
    return travelPlans.find((p) => p._id === id);
  },

  updateTravelPlan: function (id, updates) {
    const index = travelPlans.findIndex((p) => p._id === id);
    if (index !== -1) {
      travelPlans[index] = { ...travelPlans[index], ...updates };
      return travelPlans[index];
    }
    return null;
  },

  deleteTravelPlan: function (id) {
    const index = travelPlans.findIndex((p) => p._id === id);
    if (index !== -1) {
      return travelPlans.splice(index, 1)[0];
    }
    return null;
  },

  findTravelPlanByIdAndUserId: function (planId, userId) {
    return travelPlans.find((p) => p._id === planId && p.userId === userId);
  },

  findUserTravelPlans: function (userId) {
    return travelPlans
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
};
