<template>
  <div class="dashboard-container">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <h1 class="logo">InQueue</h1>
      <div class="branch-info">
        <span class="bank-name">{{ bankName }}</span>
        <span class="branch-name">{{ branchName }}</span>
      </div>
      <div class="nav-actions">
        <button class="logout-btn" @click="logout">Logout</button>
      </div>
    </nav>

    <!-- Dashboard Content -->
    <div class="dashboard-content">
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="branch-details">
          <img :src="getBankLogo(bankName)" alt="Bank Logo" class="bank-logo">
          <div class="branch-text">
            <h3>{{ branchName }}</h3>
            <p>Branch ID: {{ branchId }}</p>
          </div>
        </div>

        <ul class="sidebar-menu">
          <li @click="navigateToDashboard"><span class="icon">📊</span>Dashboard</li>
          <li @click="navigateToAppointments"><span class="icon">🗓️</span>Appointments</li>
          <li class="active"><span class="icon">📈</span>Reports</li>
          <li @click="navigateToSettings"><span class="icon">⚙️</span>Settings</li>
        </ul>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Reports Container -->
        <div class="reports-container">
          <!-- Header with date range selector -->
          <div class="section-header">
            <h3>Branch Performance Analytics</h3>
            <div class="date-controls">
              <div class="date-tabs">
                <button
                    v-for="tab in dateTabs"
                    :key="tab.value"
                    :class="['date-tab', { active: timeRange === tab.value }]"
                    @click="timeRange = tab.value"
                >
                  {{ tab.label }}
                </button>
              </div>
              <div class="calendar-picker">
                <input type="date" v-model="customDate" :max="today" @change="timeRange = 'custom'" />
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading analytics data...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-state">
            <div class="error-icon">⚠️</div>
            <p>{{ error }}</p>
            <button @click="loadReportData" class="retry-btn">Retry</button>
          </div>

          <!-- Reports Content -->
          <template v-else>
            <!-- Summary Stats -->
            <div class="summary-stats">
              <div class="stat-card">
                <div class="stat-icon clients-icon">👥</div>
                <div class="stat-data">
                  <div class="stat-value">{{ reportData.summary.totalClients }}</div>
                  <div class="stat-label">Total Clients</div>
                </div>
                <div class="stat-trend" :class="getTrendClass(reportData.summary.clientsTrend)">
                  {{ getTrendArrow(reportData.summary.clientsTrend) }} {{ Math.abs(reportData.summary.clientsTrend || 0) }}%
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon wait-icon">⏱️</div>
                <div class="stat-data">
                  <div class="stat-value">{{ reportData.summary.avgWaitTime || 0 }} min</div>
                  <div class="stat-label">Avg. Wait Time</div>
                </div>
                <div class="stat-trend" :class="getTrendClass(reportData.summary.waitTimeTrend, true)">
                  {{ getTrendArrow(reportData.summary.waitTimeTrend, true) }} {{ Math.abs(reportData.summary.waitTimeTrend || 0) }}%
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon service-icon">⚡</div>
                <div class="stat-data">
                  <div class="stat-value">{{ reportData.summary.avgServiceTime || 0 }} min</div>
                  <div class="stat-label">Avg. Service Time</div>
                </div>
                <div class="stat-trend" :class="getTrendClass(reportData.summary.serviceTimeTrend, true)">
                  {{ getTrendArrow(reportData.summary.serviceTimeTrend, true) }} {{ Math.abs(reportData.summary.serviceTimeTrend || 0) }}%
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon completion-icon">✅</div>
                <div class="stat-data">
                  <div class="stat-value">{{ reportData.summary.completionRate || 0 }}%</div>
                  <div class="stat-label">Completion Rate</div>
                </div>
                <div class="stat-trend" :class="getTrendClass(reportData.summary.completionTrend)">
                  {{ getTrendArrow(reportData.summary.completionTrend) }} {{ Math.abs(reportData.summary.completionTrend || 0) }}%
                </div>
              </div>
            </div>

            <!-- Main Reports Grid -->
            <div class="reports-grid">
              <!-- Queue Traffic Over Time -->
              <div class="report-card full-width">
                <div class="card-header">
                  <h4>Branch Queue Traffic</h4>
                  <div class="card-actions">
                    <button class="action-btn" @click="downloadChart('queueTrafficChart')">
                      <span class="action-icon">📥</span>
                    </button>
                  </div>
                </div>
                <div class="chart-container large" id="queueTrafficContainer">
                  <!-- Canvas will be created dynamically -->
                </div>
              </div>

              <!-- Window Efficiency -->
              <div class="report-card">
                <div class="card-header">
                  <h4>Window Efficiency</h4>
                  <div class="card-actions">
                    <button class="action-btn" @click="downloadChart('windowEfficiencyChart')">
                      <span class="action-icon">📥</span>
                    </button>
                  </div>
                </div>
                <div class="chart-container" id="windowEfficiencyContainer">
                  <!-- Canvas will be created dynamically -->
                </div>
              </div>

              <!-- Service Type Distribution -->
              <div class="report-card">
                <div class="card-header">
                  <h4>Service Distribution</h4>
                  <div class="card-actions">
                    <button class="action-btn" @click="downloadChart('serviceDistributionChart')">
                      <span class="action-icon">📥</span>
                    </button>
                  </div>
                </div>
                <div class="chart-container" id="serviceDistContainer">
                  <!-- Canvas will be created dynamically -->
                </div>
              </div>
            </div>

            <!-- Window Efficiency Comparison Table -->
            <div class="data-table-section" v-if="reportData && reportData.windowsTable && reportData.windowsTable.length > 0">
              <div class="section-header">
                <h4>Window Efficiency Comparison</h4>
                <button class="download-btn" @click="downloadCSV('windowEfficiency')">
                  Download CSV
                </button>
              </div>
              <div class="data-table">
                <table>
                  <thead>
                  <tr>
                    <th>Window</th>
                    <th>Staff Member</th>
                    <th>Clients Served</th>
                    <th>Avg. Service Time</th>
                    <th>Avg. Wait Time</th>
                    <th>Completion Rate</th>
                    <th>Efficiency Score</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="window in reportData.windowsTable" :key="window.number">
                    <td>Window {{ window.number }}</td>
                    <td>{{ window.staff || 'Unassigned' }}</td>
                    <td>{{ window.clientsServed }}</td>
                    <td>{{ window.avgServiceTime }} min</td>
                    <td>{{ window.avgWaitTime }} min</td>
                    <td>{{ window.completionRate }}%</td>
                    <td>
                      <div class="efficiency-indicator">
                        <div class="efficiency-bar" :style="{
                                 width: getEfficiencyBarWidth(window.completionRate) + '%',
                                 backgroundColor: getEfficiencyColor(window.completionRate)
                        }"></div>
                        <span>{{ window.completionRate || 0 }}</span>
                      </div>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- No Data Available Message -->
            <div v-if="!hasChartData" class="no-data-message">
              <div class="no-data-icon">📈</div>
              <p>No data available for the selected time period</p>
              <p class="no-data-hint">Try selecting a different date range or check if appointments are booked</p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>



<script>
import {axiosInstance} from '@/main';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import {parseTimeSlot} from '@/utils/timeSlotUtils';

Chart.defaults.font.family = "'Arial', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.display = true;
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

export default {
  name: 'BranchReports',
  data() {
    return {
      branchId: '',
      branchName: '',
      bankName: '',
      bankId: '',

      timeRange: 'today',
      customDate: new Date().toISOString().split('T')[0],
      today: new Date().toISOString().split('T')[0],
      serviceDuration: null,
      waitDuration: null,
      dateTabs: [
        {label: 'Today', value: 'today'},
        {label: 'Yesterday', value: 'yesterday'},
        {label: 'This Week', value: 'week'},
        {label: 'This Month', value: 'month'},
        {label: 'Custom', value: 'custom'}
      ],

      loading: true,
      error: null,
      useSampleData: false,
      charts: {},

      reportData: {
        summary: {
          totalClients: 0,
          avgWaitTime: 0,
          avgServiceTime: 0,
          completionRate: 0,
          clientsTrend: 0,
          waitTimeTrend: 0,
          serviceTimeTrend: 0,
          completionTrend: 0
        },
        windowsTable: [],
        queueTraffic: {labels: [], datasets: []},
        serviceDistribution: {labels: [], datasets: []}
      },
      previousReportData: null,

      showRawData: false,
      tokenPresent: false,

      bankLogos: {
        'Acba Bank': '/logos/acba.png',
        'Ameriabank': '/logos/ameriabank.png',
        'AMIO bank': '/logos/amio.png',
        'Araratbank': '/logos/araratbank.png',
        'Ardshinbank': '/logos/ardshinbank.png',
        'Ardshininvestbank': '/logos/ardshinbank.png',
        'Armeconombank': '/logos/armeconombank.jpg',
        'Artsakhbank': '/logos/artsakhbank.png',
        'Byblos Bank Armenia': '/logos/byblos.webp',
        'Converse Bank': '/logos/converse.jpg',
        'Evocabank': '/logos/evocabank.png',
        'Fast Bank': '/logos/fast.jpeg',
        'ID Bank': '/logos/idbank.png',
        'Idram': '/logos/idram.png',
        'Inecobank': '/logos/inecobank.png',
        'VTB Bank (Armenia)': '/logos/vtb.png'
      }
    };
  },

  computed: {
    hasChartData() {
      const queueTrafficHasData = this.reportData?.queueTraffic?.datasets?.[0]?.data?.some(val => val > 0);
      const serviceDistributionHasData = this.reportData?.serviceDistribution?.datasets?.[0]?.data?.some(val => val > 0);
      const windowsTableHasData = this.reportData?.windowsTable?.length > 0 &&
          this.reportData.windowsTable.some(w => w.clientsServed > 0);
      return queueTrafficHasData || serviceDistributionHasData || windowsTableHasData;
    }
  },

  props: {
    initialDate: {
      type: String,
      default: null
    }
  },

  watch: {
    timeRange() {
      this.loadReportData();
      if (this.timeRange === 'custom') {
        localStorage.setItem('lastReportDate', this.customDate);
      }
    },
    customDate() {
      if (this.timeRange === 'custom') {
        localStorage.setItem('lastReportDate', this.customDate);
        this.loadReportData();
      }
    }
  },

  created() {
    this.charts = {};
    this.boundResizeHandler = this.handleResize.bind(this);

    Chart.defaults.font.family = "'Arial', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.display = true;
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;

    this.branchId = localStorage.getItem('branchId') || '';
    this.branchName = localStorage.getItem('branchName') || '';
    this.bankName = localStorage.getItem('bankName') || '';
    this.bankId = localStorage.getItem('bankId') || '';

    // Cleaning up old report data from localStorage
    try {
      Object.keys(localStorage)
          .filter(key => key.startsWith('reportData_'))
          .forEach(key => {
            try {
              const data = JSON.parse(localStorage.getItem(key));
              // Removing data older than 30 days
              if (data?.timestamp && new Date(data.timestamp) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
                localStorage.removeItem(key);
              }
            } catch (e) {
              console.warn(`Failed to parse stored report data (${key}):`, e);
              localStorage.removeItem(key); // Remove corrupted data
            }
          });
    } catch (error) {
      console.error('Error cleaning up report data:', error);
    }

    // Trying to load cached report data if available
    try {
      const storedDataString = localStorage.getItem('reportData_today');
      if (storedDataString) {
        const storedData = JSON.parse(storedDataString);
        if (storedData && storedData.summary) {
          this.reportData.summary = {...storedData.summary};
        }
      }
    } catch (e) {
      console.warn('Failed to load stored report data:', e);
    }
  },

  mounted() {
    if (!this.branchId || !this.bankId) {
      console.warn('Missing branch info, redirecting to login');
      this.$router.push({name: 'BranchLogin'});
      return;
    }
    const dateParam = this.$route.query.date || localStorage.getItem('lastReportDate');
    if (dateParam) {
      try {
        const parsedDate = parseTimeSlot(dateParam);
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          this.customDate = parsedDate.toISOString().split('T')[0];
          this.timeRange = 'custom';
        }
      } catch (e) {
        console.error('Error parsing date parameter:', e);
      }
    }
    window.addEventListener('resize', this.boundResizeHandler);
    setTimeout(() => {
      this.loadReportData();
    }, 100);
  },

  beforeUnmount() {
    this.destroyAllCharts();
    window.removeEventListener('resize', this.boundResizeHandler);
  },

  methods: {

    handleResize() {
      // Debounce the resize by destroying and re-rendering charts
      if (this._resizeTimer) {
        clearTimeout(this._resizeTimer);
      }
      this._resizeTimer = setTimeout(() => {
        console.log('Rebuilding charts after resize');
        this.renderCharts();
      }, 250);
    },

    async loadReportData() {
      this.loading = true;
      this.error = null;
      this.destroyAllCharts();

      try {
        const params = {
          timeRange: this.timeRange
        };

        if (this.timeRange === 'custom' && this.customDate) {
          params.date = this.customDate;
          console.log(`Loading reports for custom date: ${this.customDate}`);
        }

        const token = localStorage.getItem('branchToken');
        if (!token) {
          console.error('Authentication token missing');
          this.error = 'Authentication error: Please log in again';
          this.$router.push({name: 'BranchLogin'});
          return;
        }

        const requestUrl = `/branch/${this.branchId}/reports`;
        console.log(`Requesting reports with params:`, params);

        const response = await axiosInstance.get(requestUrl, {
          params,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.data) {
          throw new Error('No data received from server');
        }

        this.reportData = this.processReportData(response.data);
        this.storeReportData();

        if (this.reportData.summary.totalClients > 0) {
          const storageKey = `reportData_${this.timeRange}`;
          const storageData = {
            timestamp: new Date().toISOString(),
            summary: {...this.reportData.summary},
            timeRange: this.timeRange,
            customDate: this.timeRange === 'custom' ? this.customDate : null
          };

          localStorage.setItem(storageKey, JSON.stringify(storageData));

          if (this.timeRange === 'custom' && this.customDate) {
            const dateKey = `reportData_date_${this.customDate}`;
            localStorage.setItem(dateKey, JSON.stringify(storageData));
          }
        }

        const previousPeriodData = this.getPreviousPeriodData();

        if (this.reportData.summary.totalClients > 0) {
          const now = new Date();
          const storageData = {
            timestamp: now.toISOString(),
            summary: {...this.reportData.summary},
            timeRange: this.timeRange,
            date: now.toISOString().split('T')[0] // Store actual date
          };

          localStorage.setItem(`reportData_${this.timeRange}`, JSON.stringify(storageData));
          localStorage.setItem(`reportData_date_${storageData.date}`, JSON.stringify(storageData));

          if (this.timeRange === 'yesterday') {
            localStorage.setItem('reportData_2daysago', JSON.stringify(storageData));
          }
        }


        if (previousPeriodData && previousPeriodData.summary) {
          this.calculateTrends(this.reportData, previousPeriodData);
        }

        this.validateReportData();

        this.$nextTick(() => {
          setTimeout(() => {
            this.renderCharts();
          }, 100);
        });

        if (this.reportData.summary.totalClients > 0) {
          try {
            const currentDate = new Date().toISOString();
            const storageKey = `reportData_${this.timeRange}`;

            localStorage.setItem(storageKey, JSON.stringify({
              timestamp: currentDate,
              summary: {...this.reportData.summary}
            }));

            // Also storing by actual date for custom date queries
            if (this.timeRange === 'custom') {
              const dateKey = `reportData_date_${this.customDate}`;
              localStorage.setItem(dateKey, JSON.stringify({
                timestamp: currentDate,
                summary: {...this.reportData.summary}
              }));
            }
          } catch (e) {
            console.warn('Failed to store report data in localStorage:', e);
          }
        }
      } catch (error) {
        console.error('Error loading report data:', error);

        if (error.response) {
          const status = error.response.status;
          const errorMsg = error.response.data?.error || 'Unknown error';

          if (status === 401 || status === 403) {
            this.error = 'Authentication error: Please log in again';
            setTimeout(() => {
              this.$router.push({name: 'BranchLogin'});
            }, 2000);
          } else {
            this.error = `Server error ${status}: ${errorMsg}`;
          }
          console.error('Error response:', error.response.data);
        } else if (error.request) {
          this.error = 'No response from server. Please check your connection.';
          console.error('No response received:', error.request);
        } else {
          this.error = `Error: ${error.message}`;
        }
        this.reportData = this.createEmptyDataset();
      } finally {
        this.loading = false;
      }
    },

    getPreviousPeriodData() {
      let previousPeriodKey = null;

      try {
        // Determine the appropriate previous period based on the current timeRange
        switch (this.timeRange) {
          case 'today':
            previousPeriodKey = 'reportData_yesterday';
            break;
          case 'yesterday':
            // For yesterday, we could compare with day before yesterday, but we don't store that
            // Instead, we'll compare with the average of the week
            previousPeriodKey = 'reportData_week';
            break;
          case 'week':
            // Compare with last month's data as a reference
            previousPeriodKey = 'reportData_month';
            break;
          case 'month':
            // For month, we don't have a good previous comparison in our simple system
            return null;
          case 'custom':
            // For custom dates, compare with yesterday's data as a reference
            previousPeriodKey = 'reportData_yesterday';
            break;
        }

        // Try to get the data for the previous period
        if (previousPeriodKey) {
          const data = localStorage.getItem(previousPeriodKey);
          if (data) {
            const parsedData = JSON.parse(data);
            console.log(`Retrieved comparison data from ${previousPeriodKey}, timestamp: ${parsedData.timestamp}`);
            return parsedData;
          }
        }

        // If no appropriate previous period found, use any available data
        // This helps during initial usage when not all periods have data yet
        const keys = ['reportData_today', 'reportData_yesterday', 'reportData_week', 'reportData_month'];
        for (const key of keys) {
          if (key !== `reportData_${this.timeRange}`) { // Don't compare with self
            const data = localStorage.getItem(key);
            if (data) {
              const parsedData = JSON.parse(data);
              console.log(`Using ${key} as fallback comparison data, timestamp: ${parsedData.timestamp}`);
              return parsedData;
            }
          }
        }
        return null;
      } catch (e) {
        console.error('Error getting previous period data:', e);
        return null;
      }
    },

    storeReportData() {
      if (!this.reportData?.summary || this.reportData.summary.totalClients === 0) return;

      const now = new Date();
      const storageData = {
        timestamp: now.toISOString(),
        summary: {...this.reportData.summary},
        timeRange: this.timeRange,
        date: this.timeRange === 'custom' ? this.customDate : now.toISOString().split('T')[0]
      };

      try {
        localStorage.setItem(`reportData_${this.timeRange}`, JSON.stringify(storageData));
        localStorage.setItem(`reportData_date_${storageData.date}`, JSON.stringify(storageData));
      } catch (e) {
        console.error('LocalStorage write error:', e);
      }
    },

    calculateTrends(currentData, previousData) {
      if (!previousData || !previousData.summary) return;

      const current = currentData.summary;
      const previous = previousData.summary;

      // Calculate trends with proper handling of zero values
      if (previous.totalClients > 0) {
        current.clientsTrend = Math.round(
            ((current.totalClients - previous.totalClients) / previous.totalClients) * 100
        );
      } else if (current.totalClients > 0) {
        current.clientsTrend = 100; // 100% increase from zero
      } else {
        current.clientsTrend = 0;
      }

      if (previous.avgWaitTime > 0) {
        current.waitTimeTrend = Math.round(
            ((current.avgWaitTime - previous.avgWaitTime) / previous.avgWaitTime) * 100
        );
      } else if (current.avgWaitTime > 0) {
        current.waitTimeTrend = 100;
      } else {
        current.waitTimeTrend = 0;
      }

      if (previous.avgServiceTime > 0) {
        current.serviceTimeTrend = Math.round(
            ((current.avgServiceTime - previous.avgServiceTime) / previous.avgServiceTime) * 100
        );
      } else if (current.avgServiceTime > 0) {
        current.serviceTimeTrend = 100;
      } else {
        current.serviceTimeTrend = 0;
      }

      if (previous.completionRate > 0) {
        current.completionTrend = Math.round(
            ((current.completionRate - previous.completionRate) / previous.completionRate) * 100
        );
      } else if (current.completionRate > 0) {
        current.completionTrend = 100;
      } else {
        current.completionTrend = 0;
      }

      // Apply capping to very large percentage increases for better display
      const capTrend = (value) => Math.min(Math.max(value, -999), 999);

      current.clientsTrend = capTrend(current.clientsTrend);
      current.waitTimeTrend = capTrend(current.waitTimeTrend);
      current.serviceTimeTrend = capTrend(current.serviceTimeTrend);
      current.completionTrend = capTrend(current.completionTrend);
    },

    processReportData(data) {
      const emptyDataset = this.createEmptyDataset();

      if (!data || typeof data !== 'object') {
        return emptyDataset;
      }

      return {
        summary: {
          totalClients: data.summary?.totalClients || 0,
          avgWaitTime: Math.round(data.summary?.avgWaitTime) || 0,
          avgServiceTime: Math.round(data.summary?.avgServiceTime) || 0,
          completionRate: Math.round(data.summary?.completionRate) || 0,
          clientsTrend: data.summary?.clientsTrend || 0,
          waitTimeTrend: data.summary?.waitTimeTrend || 0,
          serviceTimeTrend: data.summary?.serviceTimeTrend || 0,
          completionTrend: data.summary?.completionTrend || 0
        },
        windowsTable: Array.isArray(data.windowsTable)
            ? data.windowsTable.map(window => ({
              number: window.number,
              staff: window.staff || 'Unassigned',
              clientsServed: window.clientsServed || 0,
              avgServiceTime: Math.round(window.avgServiceTime) || 0,
              avgWaitTime: Math.round(window.avgWaitTime) || 0,
              completionRate: Math.round(window.completionRate) || 0
            }))
            : [],
        queueTraffic: data.queueTraffic || {
          labels: Array.from({length: 10}, (_, i) => `${i + 9}:00`),
          datasets: [{
            label: 'Clients in Queue',
            data: Array(10).fill(0),
            borderColor: '#42b983',
            fill: false
          }]
        },
        serviceDistribution: (() => {
          const sd = data.serviceDistribution || {
            labels: ['No Data'],
            datasets: [{data: [1], backgroundColor: []}]
          };

          if (sd.datasets[0] && !sd.datasets[0].backgroundColor) {
            sd.datasets[0].backgroundColor = this.getPieColors(sd.datasets[0].data.length);
          }
          return sd;
        })()
      };
    },

    createEmptyDataset() {
      return {
        summary: {
          totalClients: 0,
          avgWaitTime: 0,
          avgServiceTime: 0,
          completionRate: 0,
          clientsTrend: 0,
          waitTimeTrend: 0,
          serviceTimeTrend: 0,
          completionTrend: 0
        },
        windowsTable: [],
        queueTraffic: {
          labels: [],
          datasets: [{label: 'Clients in Queue', data: [], borderColor: '#42b983', fill: false}]
        },
        serviceDistribution: {
          labels: [],
          datasets: [{data: [], backgroundColor: []}]
        }
      };
    },

    getTrendClass(value, isInverted = false) {
      if (!value || value === 0) return '';
      let isPositive = value > 0;
      if (isInverted) isPositive = !isPositive;
      return isPositive ? 'positive' : 'negative';
    },

    getTrendArrow(value, isInverted = false) {
      if (!value || value === 0) return '-';
      let isPositive = value > 0;
      if (isInverted) isPositive = !isPositive;
      return isPositive ? '↑' : '↓';
    },

    getPieColors(count) {
      const palette = [
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(46, 204, 113, 0.7)',
        'rgba(231, 76, 60, 0.7)',
        'rgba(142, 68, 173, 0.7)',
        'rgba(241, 196, 15, 0.7)'
      ];
      return Array(count).fill().map((_, i) => palette[i % palette.length]);
    },

    destroyAllCharts() {
      const chartKeys = Object.keys(this.charts);

      chartKeys.forEach(key => {
        try {
          if (this.charts[key]) {
            this.charts[key].destroy();
            this.charts[key] = null;
          }
        } catch (e) {
          console.error(`Error destroying chart ${key}:`, e);
        }
      });

      this.charts = {};

      try {
        const containers = [
          document.getElementById('queueTrafficContainer'),
          document.getElementById('serviceDistContainer'),
          document.getElementById('windowEfficiencyContainer')
        ];

        containers.forEach(container => {
          if (container) {
            // Removing all canvas elements from this container
            const canvases = container.querySelectorAll('canvas');
            canvases.forEach(canvas => {
              canvas.remove();
            });
          }
        });
      } catch (error) {
        console.error('Error cleaning up canvas elements:', error);
      }
    },

    validateReportData() {
      if (!this.reportData) return;

      const queueTrafficHasData = this.reportData.queueTraffic.datasets?.[0]?.data?.some(val => val > 0);
      const serviceDistributionHasData =
          this.reportData.serviceDistribution.labels[0] !== 'No Data' &&
          this.reportData.serviceDistribution.datasets[0].data.some(val => val > 1);
      const windowsTableHasData =
          this.reportData.windowsTable.length > 0 &&
          this.reportData.windowsTable.some(w => w.clientsServed > 0);

      if (!queueTrafficHasData) {
        console.warn('Queue traffic chart has no data');
      }

      if (!serviceDistributionHasData) {
        console.warn('Service distribution chart has no data');
      }

      if (!windowsTableHasData) {
        console.warn('Window efficiency data is empty');
      }

      // Checking for suspicious values that might indicate filtering issues
      if (!this.hasChartData && this.timeRange !== 'custom') {
        console.warn(`[Report warning] No data found for time range "${this.timeRange}" - possible date filtering issue`);
      }
    },

    renderCharts() {
      this.destroyAllCharts();

      this.renderQueueTrafficWithVanillaCanvas();

      const serviceDistContainer = document.getElementById('serviceDistContainer');
      if (serviceDistContainer && this.reportData.serviceDistribution?.labels?.length) {
        try {
          serviceDistContainer.innerHTML = '';

          const canvas = document.createElement('canvas');
          canvas.id = 'serviceDistributionChart';
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          serviceDistContainer.appendChild(canvas);

          setTimeout(() => {
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              console.error('Could not get context for service distribution chart');
              return;
            }

            this.charts.serviceDistribution = new Chart(ctx, {
              type: 'pie',
              data: {
                labels: this.reportData.serviceDistribution.labels,
                datasets: [{
                  data: this.reportData.serviceDistribution.datasets?.[0]?.data || [1],
                  backgroundColor: this.reportData.serviceDistribution.datasets?.[0]?.backgroundColor ||
                      this.getPieColors(this.reportData.serviceDistribution.labels.length)
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                  duration: 0
                },
                plugins: {
                  legend: {position: 'right'}
                }
              }
            });
          }, 300);
        } catch (error) {
          console.error('Error creating service distribution chart:', error);
        }
      }

      // Window efficiency chart
      if (this.reportData.windowsTable?.length > 0) {
        const windowEfficiencyContainer = document.getElementById('windowEfficiencyContainer');
        if (windowEfficiencyContainer) {
          try {
            // Cleaning the container
            windowEfficiencyContainer.innerHTML = '';

            // Creating a new canvas
            const canvas = document.createElement('canvas');
            canvas.id = 'windowEfficiencyChart';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            windowEfficiencyContainer.appendChild(canvas);

            setTimeout(() => {
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                console.error('Could not get context for window efficiency chart');
                return;
              }

              const windowsData = this.reportData.windowsTable;
              const labels = windowsData.map(w => `Window ${w.number}`);

              this.charts.windowEfficiency = new Chart(ctx, {
                type: 'bar',
                data: {
                  labels: labels,
                  datasets: [
                    {
                      label: 'Clients Served',
                      data: windowsData.map(w => w.clientsServed),
                      backgroundColor: 'rgba(54, 162, 235, 0.7)'
                    },
                    {
                      label: 'Avg Service Time (min)',
                      data: windowsData.map(w => w.avgServiceTime),
                      backgroundColor: 'rgba(255, 159, 64, 0.7)'
                    }
                  ]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: {
                    duration: 0
                  },
                  plugins: {
                    legend: {position: 'top'},
                    tooltip: {mode: 'index', intersect: false}
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {display: true, text: 'Count / Time'}
                    }
                  }
                }
              });
            }, 300);
          } catch (error) {
            console.error('Error creating window efficiency chart:', error);
          }
        }
      } else {
        console.log('Skipping window efficiency chart - no data available');
      }
    },

    renderQueueTrafficWithVanillaCanvas() {
      const container = document.getElementById('queueTrafficContainer');
      if (!container) return;

      container.innerHTML = '';

      // Creating canvas element
      const canvas = document.createElement('canvas');
      canvas.id = 'queueTrafficChart';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      container.appendChild(canvas);

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const labels = this.reportData.queueTraffic.labels ||
          Array.from({length: 10}, (_, i) => `${i + 9}:00`);
      const data = this.reportData.queueTraffic.datasets?.[0]?.data ||
          Array(10).fill(0);

      const maxValue = Math.max(...data, 1);

      const padding = 40;
      const chartWidth = width - (padding * 2);
      const chartHeight = height - (padding * 2);
      const pointRadius = 4;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#2d3748';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Branch Queue Traffic', width / 2, 20);

      ctx.fillStyle = '#42b983';
      ctx.fillRect(width - 100, 15, 10, 10);
      ctx.fillStyle = '#2d3748';
      ctx.textAlign = 'left';
      ctx.font = '12px Arial';
      ctx.fillText('Clients in Queue', width - 85, 23);

      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight - (chartHeight * (i / 5)));
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.fillText(Math.round(maxValue * (i / 5)), padding - 5, y + 4);
      }

      ctx.textAlign = 'center';
      const step = chartWidth / (labels.length - 1);
      for (let i = 0; i < labels.length; i++) {
        const x = padding + (i * step);
        ctx.fillStyle = '#64748b';
        ctx.fillText(labels[i], x, height - padding + 15);
      }

      if (data.length > 0) {
        ctx.beginPath();
        for (let i = 0; i < data.length; i++) {
          const x = padding + (i * step);
          const y = height - padding - ((data[i] / maxValue) * chartHeight);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = '#42b983';
        ctx.lineWidth = 2;
        ctx.stroke();

        for (let i = 0; i < data.length; i++) {
          const x = padding + (i * step);
          const y = height - padding - ((data[i] / maxValue) * chartHeight);

          ctx.beginPath();
          ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#42b983';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      this.charts.queueTraffic = {
        canvas: canvas,
        destroy: function () {
        }
      };
    },


    getEfficiencyBarWidth(value) {
      // Preventing null/undefined values from causing issues
      return value || 0;
    },

    getEfficiencyColor(score) {
      score = Number(score) || 0;
      if (score >= 90) return '#10B981';
      if (score >= 75) return '#2563EB';
      if (score >= 60) return '#F59E0B';
      return '#EF4444';
    },

    downloadChart(chartId) {
      try {
        // Finding the canvas element by ID
        const canvas = document.getElementById(chartId);
        if (!canvas) {
          console.error(`Canvas with ID "${chartId}" not found`);
          return;
        }

        // Checking if chart instance exists
        const chartKey = chartId === 'queueTrafficChart' ? 'queueTraffic' :
            chartId === 'serviceDistributionChart' ? 'serviceDistribution' :
                chartId === 'windowEfficiencyChart' ? 'windowEfficiency' : null;

        if (!chartKey || !this.charts[chartKey]) {
          console.error(`Chart instance for "${chartId}" not found`);
          return;
        }

        // Useing a safer approach to generate the image (with error handling)
        try {
          // Creating download link
          const link = document.createElement('a');
          link.download = `inqueue-${chartId}-report.png`;

          // Getting the data URL with proper error handling
          try {
            link.href = canvas.toDataURL('image/png');
          } catch (imgError) {
            console.error('Error creating image data URL:', imgError);
            // Trying a different approach if the first one fails
            link.href = canvas.toDataURL();
          }
          link.click();
        } catch (downloadError) {
          console.error('Error during download process:', downloadError);
          alert('Could not download the chart image. Please try again later.');
        }
      } catch (error) {
        console.error('Error in downloadChart:', error);
      }
    },

    downloadCSV(dataType) {
      if (!this.reportData.windowsTable || !this.reportData.windowsTable.length) return;

      try {
        let csvContent = '';

        if (dataType === 'windowEfficiency') {
          csvContent = 'Window,Staff Member,Clients Served,Avg Service Time,Avg Wait Time,Completion Rate\n';

          this.reportData.windowsTable.forEach(window => {
            csvContent += `Window ${window.number},`;
            csvContent += `"${window.staff || 'Unassigned'}",`;
            csvContent += `${window.clientsServed},`;
            csvContent += `${window.avgServiceTime},`;
            csvContent += `${window.avgWaitTime},`;
            csvContent += `${window.completionRate}\n`;
          });
        }

        const blob = new Blob([csvContent], {type: 'text/csv'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `inqueue-${dataType}-report.csv`;
        link.click();
      } catch (error) {
        console.error('Error downloading CSV:', error);
      }
    },

    navigateToSettings() {
      this.$router.push({name: 'BranchSettings'});
    },
    navigateToAppointments() {
      this.$router.push({name: 'BranchAppointments'});
    },
    navigateToDashboard() {
      this.$router.push({name: 'BranchDashboard'});
    },

    getBankLogo(bankName) {
      return this.bankLogos[bankName] || '/logos/default-bank.png';
    },
    logout() {
      localStorage.removeItem('branchToken');
      localStorage.removeItem('branchId');
      localStorage.removeItem('branchName');
      localStorage.removeItem('bankName');
      localStorage.removeItem('bankId');
      this.$router.push({name: 'BranchLogin'});
    }
  }
};
</script>


<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f6f8fa;
  font-family: Arial, sans-serif;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #42b983;
  padding: 0.8rem 1.5rem;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

.branch-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bank-name {
  font-weight: bold;
}

.branch-name {
  font-size: 0.9rem;
  opacity: 0.9;
}

.nav-actions {
  display: flex;
  align-items: center;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dashboard-content {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 250px;
  background-color: #1e2938;
  color: #eaeaea;
  padding: 1.5rem 0;
}

.branch-details {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0 1.5rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;
}

.bank-logo {
  width: 50px;
  height: 50px;
  object-fit: contain;
  background: #1e2938;
  border-radius: 8px;
  padding: 2px;
}

.branch-text h3 {
  margin: 0;
  font-size: 1.1rem;
}

.branch-text p {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
  opacity: 0.7;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-menu li {
  padding: 0.8rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.sidebar-menu li:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar-menu li.active {
  background-color: #42b983;
  color: white;
  font-weight: bold;
}

.sidebar-menu .icon {
  margin-right: 12px;
  font-size: 1.1rem;
}

.main-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.reports-container {
  font-family: 'Arial', sans-serif;
  color: #2d3748;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.section-header h3,
.section-header h4 {
  margin: 0;
  color: #2d3748;
  font-weight: 600;
}

.date-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-tabs {
  display: flex;
  gap: 0.25rem;
}

.date-tab {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.date-tab:hover {
  background-color: #f1f5f9;
}

.date-tab.active {
  background-color: #42b983;
  color: white;
  border-color: #42b983;
}

.calendar-picker input {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #64748b;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 1.25rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 1.75rem;
  margin-right: 1rem;
  padding: 0.75rem;
  border-radius: 50%;
}

.clients-icon {
  background-color: rgba(54, 162, 235, 0.15);
  color: #2563eb;
}

.wait-icon {
  background-color: rgba(255, 159, 64, 0.15);
  color: #e67e22;
}

.service-icon {
  background-color: rgba(75, 192, 192, 0.15);
  color: #10b981;
}

.completion-icon {
  background-color: rgba(153, 102, 255, 0.15);
  color: #8b5cf6;
}

.stat-data {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
}

.stat-trend {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.stat-trend.positive {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-trend.negative {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.report-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.report-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h4 {
  margin: 0;
  font-weight: 600;
  color: #2d3748;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #64748b;
  padding: 0.25rem;
  transition: color 0.2s;
}

.action-btn:hover {
  color: #2d3748;
}

.action-icon {
  font-size: 1rem;
}

.chart-container {
  height: 230px;
  position: relative;
}

.chart-container.large {
  height: 300px;
}

.data-table-section {
  background-color: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.download-btn {
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.download-btn:hover {
  background-color: #3aa876;
}

.data-table {
  overflow-x: auto;
  margin-top: 1rem;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.data-table th {
  font-weight: 600;
  color: #4a5568;
  background-color: #f7fafc;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background-color: #f8fafc;
}

.efficiency-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.efficiency-bar {
  height: 8px;
  border-radius: 4px;
  min-width: 5px;
}

.loading-state,
.error-state,
.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #718096;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #42b983;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-icon,
.no-data-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  margin-top: 1rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background-color: #3aa876;
}

.no-data-icon {
  opacity: 0.5;
}

.no-data-hint {
  font-size: 0.875rem;
  color: #a0aec0;
  margin-top: 0.5rem;
}

@media (max-width: 1024px) {
  .dashboard-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    padding: 1rem 0;
  }

  .sidebar-menu li {
    padding: 0.6rem 1rem;
  }

  .reports-grid {
    grid-template-columns: 1fr;
  }

  .report-card.full-width {
    grid-column: auto;
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .date-controls {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }

  .date-tabs {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .calendar-picker {
    width: 100%;
  }

  .calendar-picker input {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .summary-stats {
    grid-template-columns: 1fr;
  }
}
</style>