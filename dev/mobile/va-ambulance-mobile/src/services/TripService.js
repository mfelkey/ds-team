/**
 * Trip Service - CRUD operations for ambulance trips
 * FIX: Removed token param from all methods. Auth token is injected
 * automatically by api.js interceptor.
 */
import api from './api';

const TripService = {
  /**
   * Get all trips with optional filters
   * @param {Object} filters - { status, type, region, dateFrom, dateTo }
   */
  async getAllTrips(filters = {}) {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.type) params.type = filters.type;
    if (filters.region) params.region = filters.region;
    if (filters.dateFrom) params.date_from = filters.dateFrom;
    if (filters.dateTo) params.date_to = filters.dateTo;

    const response = await api.get('/trips', { params });
    return response.data;
  },

  /**
   * Get single trip by ID
   * @param {string} tripId
   */
  async getTripById(tripId) {
    const response = await api.get(`/trips/${tripId}`);
    return response.data;
  },

  /**
   * Create a new trip
   * @param {Object} tripData
   */
  async createTrip(tripData) {
    const response = await api.post('/trips', tripData);
    return response.data;
  },

  /**
   * Update an existing trip
   * @param {string} tripId
   * @param {Object} tripData
   */
  async updateTrip(tripId, tripData) {
    const response = await api.put(`/trips/${tripId}`, tripData);
    return response.data;
  },

  /**
   * Delete a trip
   * @param {string} tripId
   */
  async deleteTrip(tripId) {
    const response = await api.delete(`/trips/${tripId}`);
    return response.data;
  },
};

export default TripService;
