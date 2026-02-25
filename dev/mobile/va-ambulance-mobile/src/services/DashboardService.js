/**
 * Dashboard Service - Stats aggregation
 * NEW: Was referenced but not implemented in original output
 */
import api from './api';

const DashboardService = {
  /**
   * Get dashboard statistics
   * Returns: { totalTrips, totalMiles, avgResponseTime, totalCost,
   *            tripsByStatus, tripsByType, recentTrips }
   */
  async getStats() {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  /**
   * Get dashboard stats for a date range
   * @param {string} dateFrom - ISO date string
   * @param {string} dateTo - ISO date string
   */
  async getStatsByDateRange(dateFrom, dateTo) {
    const response = await api.get('/dashboard/stats', {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return response.data;
  },

  /**
   * Get cost avoidance summary (AAVA vs contracted)
   */
  async getCostAvoidance() {
    const response = await api.get('/dashboard/cost-avoidance');
    return response.data;
  },
};

export default DashboardService;
