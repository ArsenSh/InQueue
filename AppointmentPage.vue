<template>
  <div class="appointment-page">
    <h1>Schedule an Appointment</h1>

    <!-- Success Message -->
    <div v-if="bookingSuccess" class="success-message">
      <h2>Appointment Booked Successfully!</h2>

      <!-- QR Code Section -->
      <div class="qr-section">
        <h3 class="qr-title">Activate with QR Code</h3>
        <qrcode-vue
            :value="qrData"
            :size="200"
            level="H"
            class="qr-code"
            renderAs="svg"
            color="#000000"
            type="image/svg+xml"
        />
        <div class="activation-code">
          <span class="code-label">Activation Code:</span>
          <span class="code-value">{{ appointmentPassword }}</span>
        </div>
      </div>

      <!-- Appointment Details -->
      <div class="booking-details">
        <div class="detail-section">
          <h3>Bank Information</h3>
          <p><strong> {{ bankName }}</strong></p>
          <div class="bank-logo">
            <img :src="getBankLogo(bankName)" :alt="bankName + ' logo'" />
          </div>
          <p>{{ branchName }}</p>
          <p>{{ branchAddress }}</p>
        </div>

        <div class="detail-section">
          <h3>Appointment Details</h3>
          <p><strong>Date:</strong> {{ formattedBookingDate }}</p>
          <p><strong>Time:</strong> {{ formatTime(selectedTime) }}</p>
          <p><strong>Client Type:</strong> {{ selectedEntityType }}</p>
          <p><strong>Service Type:</strong> {{ selectedDeal.description }}</p>
        </div>

        <div class="detail-section">
          <h3>Your Information</h3>
          <p v-if="isBusinessEntityType()"><strong>Company:</strong> {{ companyName }}</p>
          <p><strong>Name:</strong> {{ customerName }}</p>
          <p><strong>Phone:</strong> {{ phoneNumber }}</p>
          <p><strong>Email:</strong> {{ email }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="deleteAppointment" class="cancel-button" :disabled="isDeleting">
          {{ isDeleting ? 'Canceling...' : 'Cancel Appointment' }}
        </button>

        <button @click="resetForm" class="book-again-button">
          Book Another Appointment
        </button>

        <button @click="goToHomePage" class="home-button">
          Back to Homepage
        </button>
      </div>
    </div>

    <div v-else>
      <div v-if="!bankId || !branchId">
        <p>Error: Bank or Branch not found.</p>
      </div>
      <div v-else>
        <!-- Step 1: Select Entity Type -->
        <div v-if="currentStep === 1" class="step-container">
          <h2>What type of client are you?</h2>
          <div class="option-buttons">
            <button
                v-for="entity in entityTypes"
                :key="entity"
                @click="selectEntityType(entity)"
                :class="{ active: selectedEntityType === entity }"
            >
              {{ entity }}
            </button>
            <button @click="goToHomePage" class="home-button2">
              Back to Homepage
            </button>
          </div>
          <div v-if="entityTypes.length === 0" class="no-options">
            <p>No client types available for this bank</p>
          </div>
        </div>

        <!-- Step 2: Select Deal Type -->
        <div v-if="currentStep === 2" class="step-container">
          <h2>Select service type</h2>
          <div v-if="Object.keys(groupedDeals).length === 0">
            <p>No available deals for this entity type.</p>
          </div>
          <div v-else class="service-selection-container">
            <div v-for="(dealGroup, groupName) in groupedDeals" :key="groupName" class="service-group">
              <button
                  class="service-type-header"
                  @click="toggleServiceGroup(groupName)"
                  :class="{
      'expanded': expandedGroups[groupName],
      'direct-access': dealGroup.length === 1 && dealGroup[0].description === groupName
    }"
              >
                <span>{{ groupName }}</span>
                <span class="toggle-icon" v-if="!(dealGroup.length === 1 && dealGroup[0].description === groupName)">
      <i class="chevron-icon" :class="{'rotated': expandedGroups[groupName]}"></i>
    </span>
              </button>

              <div class="sub-services-container" :class="{ 'expanded': expandedGroups[groupName] }">
                <div class="sub-services">
                  <button
                      v-for="deal in dealGroup"
                      :key="deal._id"
                      @click="selectDealType(deal)"
                      class="sub-service-button"
                      :class="{ active: selectedDeal && selectedDeal._id === deal._id }"
                  >
                    {{ deal.description }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button
              class="back-button"
              @click="currentStep--"
          >
            Back
          </button>
        </div>


        <!-- Step 3: Date & Time Selection -->
        <div v-if="currentStep === 3" class="step-container">
          <div class="custom-calendar">
            <div class="calendar-header">
              <button
                  class="calendar-nav-btn"
                  @click="prevMonth"
                  :disabled="!canGoToPrevMonth"
                  :class="{ 'disabled-nav': !canGoToPrevMonth }"
              >&lt;</button>
              <h3>{{ currentMonthName }} {{ currentYear }}</h3>
              <button
                  class="calendar-nav-btn"
                  @click="nextMonth"
                  :disabled="!canGoToNextMonth"
                  :class="{ 'disabled-nav': !canGoToNextMonth }"
              >&gt;</button>
            </div>

            <div class="weekdays">
              <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
            </div>

            <div class="calendar-days">
              <div
                  v-for="day in calendarDays"
                  :key="day.date"
                  :class="{
                          'calendar-day': true,
                          'disabled': day.disabled,
                          'today': day.isToday,
                          'selected': isSelectedDay(day.date),
                          'empty': !day.inMonth,
                          'weekend': day.isWeekend,
                          'future-limit': day.isFutureLimit
                          }"
                  @click="selectDay(day)"
              >
                <span v-if="day.inMonth">{{ day.dayNumber }}</span>
              </div>
            </div>
          </div>

          <div class="time-slots">
            <h3>Available Time Slots</h3>

            <div v-if="loadingTimes" class="loading-times">
              Loading available times...
            </div>
            <div v-else-if="isPastBusinessHours()" class="no-times-message">
              <p>No appointments available after 6 PM. Please select another date.</p>
            </div>

            <div v-else-if="availableTimes && availableTimes.length > 0" class="time-slots-content">
              <template v-if="groupedTimeSlots.length > 0">
                <div v-for="hour in groupedTimeSlots" :key="hour.hourLabel" class="hour-group">
                  <h4 class="hour-label">{{ hour.hourLabel }}</h4>
                  <ul class="minute-slots">
                    <li v-for="time in hour.times" :key="time">
                      <button
                          @click="selectTime(time)"
                          :disabled="isTimeBooked(time) || isPastTime(time)"
                          :class="{
    'disabled-btn': isTimeBooked(time) || isPastTime(time),
    'selected-btn': time === selectedTime,
    'time-slot-btn': true
  }"
                      >
                        {{ formatTime(time) }}
                        <span v-if="isTimeBooked(time)" class="booked-badge">Booked</span>
                        <span v-else-if="isPastTime(time)" class="past-badge">Past</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </template>
              <div v-else class="no-times-message">
                <p>No available time slots found.</p>
              </div>
            </div>

            <div v-else-if="selectedDate" class="no-times-message">
              <p>No available time slots for selected date.</p>
            </div>

            <div v-else class="select-date-message">
              <p>Select a date to view available times.</p>
            </div>
          </div>

          <div class="navigation-buttons">
            <button
                class="back-button"
                @click="currentStep--"
            >
              Back
            </button>
            <button
                class="next-button"
                @click="currentStep++"
                :disabled="!selectedTime"
            >
              Continue
            </button>
          </div>
        </div>

        <!-- Step 4: Confirm Details -->
        <div v-if="currentStep === 4" class="step-container">
          <h2>Confirm your appointment</h2>
          <div class="appointment-summary">
            <div class="bank-info-header">
              <div class="bank-logo-container">
                <div class="bank-logo">
                  <img :src="getBankLogo(bankName)" :alt="bankName + ' logo'" />
                </div>
                <h3>{{ bankName }}</h3>
              </div>
              <div class="branch-info">
                <p>{{ branchName }}</p>
                <p>{{ branchAddress }}</p>
              </div>
            </div>

            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">Service Type</span>
                <span class="detail-value">{{ selectedDeal.description }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date</span>
                <span class="detail-value">{{ formatDate(selectedDate) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time</span>
                <span class="detail-value">{{ formatTime(selectedTime) }}</span>
              </div>
            </div>
          </div>

          <div class="appointment-form">
            <h3>Your Information</h3>
            <form @submit.prevent="bookAppointment">
              <div class="form-row">
                <label for="customerName">Full Name</label>
                <input id="customerName" v-model="customerName" type="text" required placeholder="Enter your full name" />
              </div>
              <div class="form-row">
                <label for="phoneNumber">Phone</label>
                <input id="phoneNumber" v-model="phoneNumber" type="tel" required placeholder="Enter your phone number" />
              </div>
              <div class="form-row">
                <label for="email">Email</label>
                <input id="email" v-model="email" type="email" required placeholder="Enter your email address" />
              </div>
              <div v-if="isBusinessEntityType()" class="form-row">
                <label for="companyName">Company Name</label>
                <input id="companyName" v-model="companyName" type="text" required placeholder="Enter your company name" />
              </div>

              <div class="form-actions">
                <button type="button" class="back-button" @click="currentStep--"> Back </button>
                <button
                    type="submit"
                    class="submit-button"
                    :disabled="isBooking"
                >
                  {{ isBooking ? 'Booking...' : 'Book Appointment' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import QrcodeVue from 'vue-qrcode';

export default {
  name: 'CustomCalendar',
  components: { QrcodeVue },
  props: {
    value: {
      type: String,
      default: ''
    },
    minDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    }
  },

  data() {
    return {
      currentStep: 1,
      entityTypes: [],
      expandedGroups: {},
      selectedEntityType: null,
      selectedDeal: null,
      selectedTime: '',
      customerName: '',
      errorMessage: '',
      phoneNumber: '',
      email: '',
      companyName: '',
      availableTimes: [],
      busyTimes: [],
      bankId: this.$route.params.bankId,
      branchId: this.$route.params.branchId,
      bankName: '',
      branchName: '',
      branchAddress: '',
      allDeals: [],
      bookingSuccess: false,
      requireCompanyName: false,
      isBooking: false,
      formattedBookingDate: '',
      currentDate: new Date(),
      selectedDate: null,
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      loadingTimes: false,
      appointmentPassword: '',
      qrData: '',
      showQR: false,
      isDeleting: false,
      appointmentId: null,
      autoSelectFirstTime: false,
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
    }
  },

  computed: {
    currentYear() { return this.currentDate.getFullYear(); },
    currentMonth() { return this.currentDate.getMonth(); },
    currentMonthName() { return new Date(this.currentYear, this.currentMonth, 1).toLocaleString('default', { month: 'long' }); },
    calendarDays() {
      const days = [];
      const firstDay = new Date(this.currentYear, this.currentMonth, 1);
      const startDay = new Date(firstDay);
      startDay.setDate(startDay.getDate() - startDay.getDay());

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const minDateTime = today.getTime();

      const oneMonthLater = new Date(today);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      oneMonthLater.setHours(23, 59, 59, 999);

      for (let i = 0; i < 42; i++) {
        const currentDay = new Date(startDay);
        currentDay.setDate(startDay.getDate() + i);

        const isToday = this.isToday(currentDay);
        const inMonth = currentDay.getMonth() === this.currentMonth;
        const dayTime = currentDay.getTime();
        const dayOfWeek = currentDay.getDay();

        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isPastDay = dayTime < minDateTime;
        const isFutureLimit = dayTime > oneMonthLater.getTime();

        days.push({
          date: this.formatYYYYMMDD(currentDay),
          dayNumber: currentDay.getDate(),
          isToday,
          inMonth,
          isPastDay,
          isWeekend,
          isFutureLimit,
          disabled: isPastDay || isFutureLimit || isWeekend
        });

        if (i >= 35 && currentDay.getDay() === 6 &&
            days.filter(d => d.inMonth).length >= 30) {
          break;
        }
      }
      return days;
    },

    groupedTimeSlots() {
      if (!this.availableTimes) {
        console.warn('availableTimes is undefined');
        return [];
      }

      const times = Array.isArray(this.availableTimes)
          ? this.availableTimes
          : [];

      const hourGroups = {};
      console.log("Grouping time slots:", times);
      times.forEach(time => {
        if (typeof time !== 'string') {
          console.warn('Invalid time format:', time);
          return;
        }

        // Normalizing the time string
        const normalizedTime = time.trim().replace(/\s+/g, '');

        // Parsing the normalized time
        let parts;
        if (normalizedTime.includes('/')) {
          parts = normalizedTime.split('/');
          if (parts.length < 5) {
            console.warn('Malformed time string:', normalizedTime);
            return;
          }
        } else if (normalizedTime.includes(':')) {
          const [hours, minutes] = normalizedTime.split(':');
          parts = ['', '', '', hours, minutes];
        } else {
          console.warn('Unknown time format:', normalizedTime);
          return;
        }

        const hour = parts[3]; // Hour is at index 3 in "DD/MM/YY/HH/MM"
        const hourLabel = `${hour.padStart(2, '0')}:00`;

        if (!hourGroups[hour]) {
          hourGroups[hour] = {
            hour,
            hourLabel,
            times: []
          };
        }
        hourGroups[hour].times.push(normalizedTime);
      });

      const sortedGroups = Object.values(hourGroups).sort((a, b) => a.hour - b.hour);
      console.log('Grouped Time Slots:', sortedGroups);
      return sortedGroups;
    },

    canGoToNextMonth() {
      const today = new Date();
      const currentViewMonth = new Date(this.currentYear, this.currentMonth, 1);
      const maxAllowedMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return currentViewMonth < maxAllowedMonth;
    },

    canGoToPrevMonth() {
      const today = new Date();
      const currentViewMonth = new Date(this.currentYear, this.currentMonth, 1);
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return currentViewMonth > currentMonth;
    },

    selectedEntityDeals() {
      if (!this.selectedEntityType || !this.allDeals.length) return [];
      return this.allDeals.filter(deal => deal.type === this.selectedEntityType || deal.isEmptyType);
    },

    groupedDeals() {
      return this.groupDealsByServiceType(this.selectedEntityDeals);
    },
  },

  watch: {
    selectedDate(newDate) {
      console.log("Selected date changed to:", newDate);
      if (newDate) {
        this.fetchAvailableTimes();
      }
    },
    currentStep(newVal) {
      if (newVal === 3) {
        this.$nextTick(() => {
          this.focusDateInput();
        });
      }
    },
    availableTimes: {
      handler(newTimes) {
        if (newTimes && newTimes.length) {
          this.$nextTick(() => {
            this.scrollToCurrentTime();
            this.preselectTimeSlot();
            if (this.selectedDate && this.isToday(new Date(this.selectedDate))) {
              this.markCurrentHourGroup();
            }
          });
        }
      },
      deep: true
    },
    value(newVal) {
      this.selectedDate = newVal;
      if (newVal) {
        const selectedDate = new Date(newVal);
        this.currentDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1
        );
      }
    }
  },

  async created() {
    try {
      await this.fetchBankDetails();
      await this.fetchEntityTypes();
      await this.fetchDeals();
    } catch (error) {
      console.error('Initialization error:', error);
    }
  },

  mounted() {
    this.extendDOMQuerySelector();
    this.setupTimeSlotObserver();
  },

  methods: {
    setupTimeSlotObserver() {
      const timeSlotsContainer = document.querySelector('.time-slots');
      if (!timeSlotsContainer) return;
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            const timeSlotContent = document.querySelector('.time-slots-content');
            if (timeSlotContent) {
              this.scrollToCurrentTime();
              this.preselectTimeSlot();
              observer.disconnect();
            }
          }
        }
      });

      observer.observe(timeSlotsContainer, {
        childList: true,
        subtree: true
      });
    },

    getBankLogo(bankName) {
      if (this.bankLogos[bankName]) {
        return this.bankLogos[bankName];
      }
      const bankKey = Object.keys(this.bankLogos).find(
          key => key.toLowerCase() === bankName.toLowerCase()
      );
      if (bankKey) {
        return this.bankLogos[bankKey];
      }
      console.warn(`No logo found for bank: ${bankName}`);
      return '/logos/default-bank.png';
    },

    async fetchBankDetails() {
      try {
        const response = await fetch(`http://localhost:5000/api/getBank/${this.branchId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch bank details');
        }
        const data = await response.json();
        console.log('Branch Data:', data);

        if (!data || !data.bankName || !data.branch) {
          alert('Branch not found');
          return;
        }

        this.bankName = data.bankName || 'Unknown Bank';
        this.branchName = data.branch.name || 'Unknown Branch';
        this.branchAddress = data.branch.address || 'Address not available';
        this.entityTypes = data.entityTypes || [];
        this.deals = data.branch.deals || [];
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to load bank details. Check console for details');
      }
    },

    focusDateInput() {
      if (this.$refs.dateInput) {
        this.$refs.dateInput.focus();
        this.$refs.dateInput.click();
        if (!("showPicker" in HTMLInputElement.prototype)) {
          this.$refs.dateInput.dispatchEvent(new MouseEvent('mousedown'));
        } else {
          this.$refs.dateInput.showPicker();
        }
      }
    },



    toggleServiceGroup(groupName) {
      const dealGroup = this.groupedDeals[groupName];

      if (dealGroup.length === 1 && dealGroup[0].description === groupName) {
        this.selectDealType(dealGroup[0]);
        return;
      }

      const updatedGroups = {...this.expandedGroups};
      updatedGroups[groupName] = !updatedGroups[groupName];
      this.expandedGroups = updatedGroups;
      console.log('Toggled group:', groupName, 'New state:', this.expandedGroups[groupName]);
    },

    selectEntityType(entity) {
      console.log('Selected entity type:', entity);

      this.groupedDeals && Object.keys(this.groupedDeals).forEach(group => {
        this.expandedGroups[group] = false;
      });
      this.selectedEntityType = entity;
      this.currentStep = 2;
    },

    groupDealsByServiceType(deals) {
      if (!deals) return {};

      return deals.reduce((acc, deal) => {
        const groupName = deal.serviceType;
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(deal);
        return acc;
      }, {});
    },

    async fetchEntityTypes() {
      try {
        const response = await fetch(`http://localhost:5000/api/banks/${this.bankId}/entityTypes`);
        if (response.ok) {
          this.entityTypes = await response.json();
          return;
        }

        const dealsResponse = await fetch(`http://localhost:5000/api/banks/${this.bankId}/deals`);
        const dealsData = await dealsResponse.json();
        this.entityTypes = [...new Set(dealsData.map(deal => deal.type))];
      } catch (error) {
        console.error('Error fetching entity types:', error);
        this.entityTypes = [];
      }
    },

    async fetchDeals() {
      try {
        const response = await fetch(
            `http://localhost:5000/api/banks/${this.bankId}/deals`
        );
        const dealsData = await response.json();

        this.allDeals = dealsData.flatMap(deal =>
            deal.dealTypes.map(dt => ({
              ...dt,
              type: deal.type,
              requireCompanyName: deal.requireCompanyName || false,
              _id: dt._id || new Date().getTime()
            }))
        );

        this.entityRequiresCompany = dealsData.reduce((acc, deal) => {
          acc[deal.type] = deal.requireCompanyName || false;
          return acc;
        }, {});
      } catch (error) {
        console.error('Error fetching deals:', error);
        this.allDeals = [];
      }
    },

    selectDealType(deal) {
      console.log('Deal selected:', deal);

      this.selectedDeal = {
        serviceType: deal.serviceType,
        description: deal.description
      };

      if (deal.serviceType === deal.description) {
        console.log('Skipping to calendar - identical serviceType/description');
        this.currentStep = 3;
      } else {
        console.log('Regular flow - incrementing step');
        this.currentStep++;
      }
    },

    async refreshBusyTimes() {
      try {
        const response = await fetch(`http://localhost:5000/api/getBusyTimes/${this.branchId}`);
        const data = await response.json();
        this.busyTimes = data.busyTimes || [];
      } catch (error) {
        console.error("Error refreshing busy times:", error);
      }
    },

    isPastBusinessHours() {
      const now = new Date();
      const currentHour = now.getHours();
      const selectedDateObj = new Date(this.selectedDate);
      const isToday = this.isToday(selectedDateObj);

      return isToday && currentHour >= 18;
    },

    scrollToCurrentTime() {
      if (!this.selectedDate || !this.availableTimes.length || this.loadingTimes) {
        return;
      }

      const today = new Date();
      const selectedDateObj = new Date(this.selectedDate);
      const isToday = this.isToday(selectedDateObj);

      if (!isToday) {
        return;
      }

      const currentHour = today.getHours();

      // Adding this check to prevent scrolling during non-business hours
      if (currentHour < 9 || currentHour >= 18) {
        return; // Will leave view at 9AM (top)
      }

      this.$nextTick(() => {
        try {
          const hourLabels = document.querySelectorAll('.hour-label');
          let targetElement = null;
          for (const label of hourLabels) {
            if (label.textContent.includes(`${currentHour}:00`)) {
              targetElement = label;
              break;
            }
          }
          if (!targetElement) {
            for (const label of hourLabels) {
              const hourText = label.textContent.trim();
              const hourValue = parseInt(hourText.split(':')[0]);

              if (hourValue >= currentHour) {
                targetElement = label;
                break;
              }
            }
          }

          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            const timeSlots = document.querySelectorAll('.time-slot-btn:not(.past-time):not(.disabled-btn)');
            if (timeSlots.length > 0) {
              timeSlots[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        } catch (error) {
          console.error('Error scrolling to current time:', error);
        }
      });
    },

    logTimeComparison(time) {
      console.group('Time Slot Debug');
      console.log('Time:', time);
      console.log('Normalized:', this.normalizeTimeString(time));
      console.log('Busy Times:', this.busyTimes);
      console.log('Is Booked:', this.isTimeBooked(time));
      console.groupEnd();
    },

    markCurrentHourGroup() {
      if (!this.selectedDate) return;
      const now = new Date();
      const selectedDate = new Date(this.selectedDate);
      if (!this.isToday(selectedDate)) return;
      const currentHour = now.getHours();
      setTimeout(() => {
        document.querySelectorAll('.hour-group').forEach(group => {
          group.classList.remove('current-hour');
        });

        try {
          const hourLabels = document.querySelectorAll('.hour-label');
          for (const label of hourLabels) {
            if (label.textContent.includes(`${currentHour}:00`)) {
              const hourGroup = label.closest('.hour-group');
              if (hourGroup) {
                hourGroup.classList.add('current-hour');
                hourGroup.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
              break;
            }
          }
        } catch (error) {
          console.warn("Error highlighting current hour:", error);
        }
      }, 100);
    },

    async fetchAvailableTimes() {
      console.log("fetchAvailableTimes called with selectedDate:", this.selectedDate);

      if (!this.selectedDate) {
        console.log("No selectedDate, returning early");
        return;
      }

      this.loadingTimes = true;
      this.availableTimes = [];
      this.selectedTime = null;

      if (this.isPastBusinessHours()) {
        console.log("Past business hours, showing no available times");
        this.loadingTimes = false;
        this.availableTimes = [];
        return;
      }

      try {
        const formattedDate = this.formatDateForAPI(this.selectedDate);
        console.log("Formatted date for API:", formattedDate);
        const encodedDate = encodeURIComponent(formattedDate);
        const busyUrl = `http://localhost:5000/api/getBusyTimes/${this.branchId}`;
        const timesUrl = `http://localhost:5000/api/available-times/${this.bankId}/${this.branchId}/${encodedDate}`;

        const [busyRes, timesRes] = await Promise.all([
          fetch(busyUrl),
          fetch(timesUrl)
        ]);

        if (!busyRes.ok) throw new Error(`Failed to fetch booked times. Status: ${busyRes.status}`);
        if (!timesRes.ok) throw new Error(`Failed to fetch available times. Status: ${timesRes.status}`);

        const [busyData, timesData] = await Promise.all([
          busyRes.json(),
          timesRes.json()
        ]);

        console.log("Raw busy times:", busyData.busyTimes);
        console.log("Raw available times:", timesData.availableTimes);

        // Normalize and validate all time strings
        this.busyTimes = this.normalizeTimeArray(busyData.busyTimes);
        const rawAvailableTimes = this.normalizeTimeArray(timesData.availableTimes);

        console.log("Normalized busy times:", this.busyTimes);
        console.log("Normalized available times:", rawAvailableTimes);

        // Create Set for O(1) lookups
        const busyTimesSet = new Set(this.busyTimes);

        // Filter out busy times and invalid slots
        let availableTimes = rawAvailableTimes.filter(time => {
          const isBooked = busyTimesSet.has(time);
          if (isBooked) {
            console.warn(`Excluding booked time slot: ${time}`);
          }
          return !isBooked;
        });

        console.log("After filtering busy times:", availableTimes);

        if (this.isToday(new Date(this.selectedDate))) {
          availableTimes = availableTimes.filter(time => {
            const isPast = this.isPastTime(time);
            if (isPast) {
              console.warn(`Excluding past time slot: ${time}`);
            }
            return !isPast;
          });
          console.log("After filtering past times:", availableTimes);
        }

        this.availableTimes = availableTimes;

        if (this.availableTimes.length === 0) {
          console.warn("No available times found from API. Generating default times.");
          this.generateTimes(new Date(this.selectedDate));
        }

        this.$nextTick(() => {
          if (this.isToday(new Date(this.selectedDate))) {
            this.markCurrentHourGroup();
          }
          this.scrollToCurrentTime();
          this.preselectTimeSlot();
        });

      } catch (error) {
        console.error("Error in fetchAvailableTimes:", error);
        this.errorMessage = "Failed to load available time slots. Please try again.";

        try {
          await this.refreshBusyTimes();
          this.generateTimes(new Date(this.selectedDate));
        } catch (fallbackError) {
          console.error("Fallback generation failed:", fallbackError);
          this.availableTimes = [];
        }
      } finally {
        this.loadingTimes = false;
      }
    },

    formatDateForAPI(dateString) {
      let day, month, year;

      if (dateString.includes('-')) {
        [year, month, day] = dateString.split('-');
      } else {
        [day, month, year] = dateString.split('/');
      }

      return `${day}/${month}/${year.slice(-2)}`;
    },

    normalizeTimeArray(times) {
      if (!Array.isArray(times)) return [];

      return times
          .map(time => this.normalizeTimeString(time))
          .filter(time => time !== '');
    },

    normalizeTimeString(time) {
      if (!time || typeof time !== 'string') return '';

      const cleanTime = time.trim().replace(/\s+/g, '');

      // Handle both "DD/MM/YY/HH/MM" and "HH:MM" formats
      if (cleanTime.includes('/')) {
        const parts = cleanTime.split('/');
        if (parts.length >= 5) {
          // Reconstruct in consistent format
          return parts.slice(0, 5).join('/');
        }
      } else if (cleanTime.includes(':')) {
        // For HH:MM format, construct full time string using selected date
        if (this.selectedDate) {
          const date = new Date(this.selectedDate);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const yearShort = String(date.getFullYear()).slice(2);
          const [hours, minutes] = cleanTime.split(':');

          if (hours && minutes) {
            return `${day}/${month}/${yearShort}/${hours.padStart(2, '0')}/${minutes.padStart(2, '0')}`;
          }
        }
      }

      console.warn(`Invalid time format: ${time}`);
      return '';
    },

    generateTimes(date) {
      const times = [];
      const startHour = 9; // Starting from 9 AM
      const endHour = 18; // Until 6 PM
      // Check if the selected date is today
      const isToday = this.isToday(date);
      let currentHour = 0;
      let currentMinute = 0;

      if (isToday) {
        const now = new Date();
        currentHour = now.getHours();
        currentMinute = now.getMinutes();
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute -= 60;
        }
      }

      for (let hour = startHour; hour < endHour; hour++) {
        if (isToday && hour < currentHour) {
          continue;
        }

        for (let minute = 0; minute < 60; minute += 5) {
          if (isToday && hour === currentHour && minute < currentMinute) {
            continue;
          }

          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const yearShort = String(date.getFullYear()).slice(2);

          const formattedTime = `${day}/${month}/${yearShort}/${String(hour).padStart(2, '0')}/${String(minute).padStart(2, '0')}`;
          times.push(formattedTime);
        }
      }

      const busyTimesSet = new Set(this.busyTimes);
      const filteredTimes = times.filter(time => !busyTimesSet.has(time.trim().replace(/\s+/g, '')));
      this.availableTimes = filteredTimes;
      console.log(`Generated ${times.length} time slots, ${filteredTimes.length} after filtering out busy times`);
    },

    goToHomePage() {
      this.$router.push('/');
    },

    isPastTime(time) {
      if (!time) return false;

      let parts;
      if (time.includes('/')) {
        parts = time.split('/');
        if (parts.length < 5) return false;
      } else if (time.includes(':')) {
        // Handle HH:MM format
        const [hours, minutes] = time.split(':');
        parts = ['', '', '', hours, minutes];
      } else {
        return false;
      }

      const [day, month, yearShort, hours, minutes] = parts;
      const fullYear = 2000 + parseInt(yearShort);
      const now = new Date();
      const slotDate = new Date(fullYear, month - 1, day, hours, minutes);
      console.log(`Time slot: ${time}, Date: ${slotDate}, Now: ${now}, isPast: ${slotDate < now}`);

      if (slotDate.getFullYear() > now.getFullYear()) {
        return false;
      }
      if (slotDate.getFullYear() < now.getFullYear()) {
        return true;
      }
      return slotDate < now;
    },

    isTimeBooked(time) {
      if (!time || !this.busyTimes || !this.busyTimes.length) return false;
      const normalizedInput = this.normalizeTimeString(time);
      return this.busyTimes.some(busyTime => {
        const normalizedBusy = this.normalizeTimeString(busyTime);
        return normalizedBusy === normalizedInput;
      });
    },


    formatTime(time) {
      if (!time) return '';

      if (typeof time === 'string') {
        if (time.includes('/')) {
          const parts = time.split('/');
          if (parts.length >= 5) {
            const hours = parts[3].padStart(2, '0');
            const minutes = parts[4].padStart(2, '0');
            return `${hours}:${minutes}`;
          }
        } else if (time.includes(':')) {
          return time;
        }
      }
      return time;
    },

    nextMonth() {
      this.selectedDate = null;
      if (!this.canGoToNextMonth) return;
      this.applyMonthTransition(() => {
        const newDate = new Date(this.currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        this.currentDate = newDate;
      });
    },

    prevMonth() {
      this.selectedDate = null;
      if (!this.canGoToPrevMonth) return;
      this.applyMonthTransition(() => {
        const newDate = new Date(this.currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        this.currentDate = newDate;
      });
    },

    selectTime(time) {
      this.logTimeComparison(time);
      this.selectedTime = time;
    },

    applyMonthTransition(changeMonthFn) {
      const calendarEl = document.querySelector('.calendar-days');
      if (calendarEl) {
        calendarEl.style.opacity = '0';

        setTimeout(() => {
          changeMonthFn();

          setTimeout(() => {
            calendarEl.style.opacity = '1';
          }, 50);
        }, 150);
      } else {
        changeMonthFn();
      }
    },

    selectDay(day) {
      if (day.disabled || !day.inMonth) return;
      const selectedDateObj = new Date(day.date);

      if (selectedDateObj.getMonth() !== this.currentMonth) {
        this.currentDate = new Date(
            selectedDateObj.getFullYear(),
            selectedDateObj.getMonth(),
            1
        );
      }

      this.selectedDate = day.date;
      console.log("Selected date set to:", this.selectedDate);

      this.selectedTime = null;

      this.$emit('input', day.date);
      this.$emit('change', day.date);
      this.fetchAvailableTimes();
      this.$nextTick(() => {
        const timeSlots = document.querySelector('.time-slots');
        if (timeSlots) {
          timeSlots.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    },

    preselectTimeSlot() {
      if (this.autoSelectFirstTime && !this.selectedTime) {
        const firstAvailableTime = this.findFirstAvailableTime();
        if (firstAvailableTime) {
          this.selectedTime = firstAvailableTime;
          this.$nextTick(() => {
            const selectedTimeButton = document.querySelector('.time-slot-btn.selected-btn');
            if (selectedTimeButton) {
              selectedTimeButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          });
        }
      }
    },

    extendDOMQuerySelector() {
      if (window.containsSelectorApplied) return;
      window.containsSelectorApplied = true;
      window.findElementContainingText = function(selector, text) {
        const elements = document.querySelectorAll(selector);
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].textContent.includes(text)) {
            return elements[i];
          }
        }
        return null;
      };
    },

    findFirstAvailableTime() {
      if (!this.availableTimes || this.availableTimes.length === 0) return null;
      const sortedTimes = [...this.availableTimes].sort((a, b) => {
        const partsA = a.split('/');
        const partsB = b.split('/');
        // Compare hour first
        const hourA = parseInt(partsA[3]);
        const hourB = parseInt(partsB[3]);
        if (hourA !== hourB) return hourA - hourB;
        // If same hour, compare minutes
        const minuteA = parseInt(partsA[4]);
        const minuteB = parseInt(partsB[4]);
        return minuteA - minuteB;
      });
      // Filter out past times and booked times
      const validTimes = sortedTimes.filter(time => {
        return !this.isPastTime(time) && !this.isTimeBooked(time);
      });
      // Return the first valid time, or null if none found
      return validTimes.length > 0 ? validTimes[0] : null;
    },

    isBusinessEntityType() {
      if (!this.selectedEntityType) return false;
      return this.entityRequiresCompany[this.selectedEntityType] || false;
    },

    isSelectedDay(date) {
      if (!this.selectedDate || !date) return false;

      let normalizedSelectedDate = this.selectedDate;
      if (!normalizedSelectedDate.includes('-')) {
        const parts = normalizedSelectedDate.split('/');
        if (parts.length >= 3) {
          normalizedSelectedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      return normalizedSelectedDate === date;
    },

    isToday(date) {
      const today = new Date();
      return date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear();
    },

    formatYYYYMMDD(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;
      return formatted;
    },

    formatDate(dateString) {
      if (!dateString) return '';
      const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
      return new Date(dateString).toLocaleDateString(undefined, options);
    },

    async bookAppointment() {
      if (this.isBooking) return;
      this.isBooking = true;

      try {
        const appointmentData = {
          branchId: this.branchId,
          time: this.selectedTime,
          userInfo: {
            name: this.customerName,
            phone: this.phoneNumber,
            email: this.email,
            companyName: this.isBusinessEntityType() ? this.companyName : null
          },
          entityType: this.selectedEntityType,
          serviceType: this.selectedDeal.serviceType,
          service: {
            type: this.selectedDeal.serviceType,
            description: this.selectedDeal.description
          }
        };

        const response = await fetch("http://localhost:5000/api/appointments/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appointmentData)
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || "Booking failed");
        }

        this.appointmentId = responseData.appointment?._id;
        if (!this.appointmentId) {
          throw new Error("Failed to retrieve appointment ID");
        }
        this.appointmentPassword = responseData.password;
        this.qrData = JSON.stringify({
          id: this.appointmentId,
          code: this.appointmentPassword
        });

        await this.refreshBusyTimes();

        if (this.selectedTime && !this.busyTimes.includes(this.selectedTime.trim().replace(/\s+/g, ''))) {
          this.busyTimes.push(this.selectedTime.trim().replace(/\s+/g, ''));
          console.log(`Added ${this.selectedTime} to busy times`);
        }

        this.formattedBookingDate = this.formatDate(this.selectedDate);
        this.bookingSuccess = true;
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        console.error("Booking error:", error);
        alert(`Error: ${error.message || "Failed to book appointment"}`);
      } finally {
        this.isBooking = false;
      }
    },

    async deleteAppointment() {
      if (!this.appointmentId) {
        alert('No appointment to cancel');
        return;
      }

      this.isDeleting = true;
      try {
        const response = await fetch(
            `http://localhost:5000/api/appointments/${this.appointmentId}`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.appointmentPassword.toUpperCase()}`
              }
            }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to cancel appointment');
        }

        await this.refreshBusyTimes();

        this.appointmentId = null;
        this.appointmentPassword = '';
        this.qrData = '';

        alert('Appointment canceled successfully');
        this.resetForm();
      } catch (error) {
        console.error('Deletion error:', error);
        alert(`Error: ${error.message || 'Failed to connect to server'}`);
      } finally {
        this.isDeleting = false;
      }
    },

    resetForm() {
      this.currentStep = 1;
      this.selectedEntityType = null;
      this.selectedDeal = null;
      this.selectedDate = '';
      this.selectedTime = null;
      this.customerName = '';
      this.phoneNumber = '';
      this.email = '';
      this.companyName = '';
      this.bookingSuccess = false;
      this.appointmentId = null;
      this.appointmentPassword = '';
      this.qrData = '';
    }
  }
};
</script>


<style scoped>

.bank-logo {
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 auto;
}

.bank-logo img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

/* Base button styles */
.action-buttons button {
  border: none;
  border-radius: 8px; /* 💬 Adjust corner rounding */
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
  padding: 12px 24px; /* 💬 Base padding */
}

/* Cancel Button */
.cancel-button {
  background: #23915f; /* 💬 Red color */
  color: white;
  min-width: 180px;
  font-size: 0.95em;
}

/* Book Again Button */
.book-again-button {
  background: #23915f; /* 💬 Green color */
  color: white;
  min-width: 220px; /* 💬 Larger width */
  padding: 14px 28px; /* 💬 Bigger padding */
  font-size: 1.1em;
}

/* Home Button */
.home-button {
  background: #23915f; /* 💬 Blue color */
  color: white;
  min-width: 180px;
  font-size: 0.95em;
}
.home-button2 {
  display: block;
  width: 200px;
  margin: 40px auto 20px;
  padding: 12px 24px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  text-align: center;
}

/* If you want it fixed at bottom */
@media (min-height: 600px) {
  .home-button2 {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }
}

/* Hover effects */
.cancel-button:hover { background: #550404; }
.book-again-button:hover { background: #0a4a2d; }
.home-button:hover { background: #0a4a2d; }

/* Disabled state */
.cancel-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }

  .action-buttons button {
    width: 100%;
    min-width: unset;
  }
}





.success-message {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}



.qr-section, .booking-details {
  width: 100%;
  max-width: 500px;
  padding: 1.5rem;
  margin: 0 auto;
  box-sizing: border-box;
}

.qr-section {
  width: 100% !important;
  max-width: 500px !important;
  margin: 2rem auto !important; /* This centers the block */
  padding: 1.5rem !important;
  background: #f8f9fa !important;
  border-radius: 10px !important;
  text-align: center !important;
  display: block !important;
  float: none !important;
}

.booking-details {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.qr-title {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.qr-code {
  margin: 0 auto;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  background: white;
}

.activation-code {
  margin-top: 1.5rem;
  font-size: 1.4rem;
}

.code-label {
  color: #666;
  margin-right: 0.5rem;
}

.code-value {
  color: #42b983;
  font-weight: bold;
  letter-spacing: 2px;
}

.detail-section {
  margin: 2rem 0;
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 8px;
}

.detail-section h3 {
  color: #42b983;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

.action-buttons {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
}

@media (min-width: 768px) {
  .action-buttons {
    grid-template-columns: repeat(3, 1fr);
  }

  .detail-section {
    margin: 1.5rem;
    padding: 2rem;
  }
}

.activation-code {
  font-size: 1.4rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
}



.qr-code {
  margin: 1.5rem auto;
  border: 2px solid #ecf0f1;
  border-radius: 10px;
  padding: 10px;
  background: white;
}

.action-buttons {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
}

@media (min-width: 768px) {
  .action-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}

.qr-section {
  margin: 2rem 0;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  text-align: center;
}

.action-buttons {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.qr-section p {
  margin-bottom: 1rem;
}

.appointment-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
h1 {
  color: #42b983;
  text-align: center;
}
.service-type-header.direct-access {
  background-color: #42b983;  /* A slightly different green */
  padding-right: 20px;  /* Ensure consistent padding */
}
.service-type-header.direct-access::after {
  display: none;  /* Explicitly remove any after pseudo-element */
}
.service-type-header.direct-access:hover {
  background-color: #42b983;  /* Slightly darker on hover */
}
.service-type-header.direct-access .toggle-icon,
.service-type-header.direct-access i,
.service-type-header.direct-access::before {
  display: none;
}

.service-type-header.direct-access {
  background-color: #42b983;  /* A slightly different green */
  cursor: pointer;
}
.service-type-header.direct-access {
  background-color: #42b983;  /* A slightly different green */
  padding-right: 15px;  /* Reduce right padding since there's no icon */
}
.service-type-header.direct-access:hover {
  background-color: #42b983;  /* Slightly darker on hover */
}
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #42b983;
  color: white;
  padding: 12px;
}
.calendar-header h3 {
  margin: 0;
  font-size: 1.2rem;
}
.calendar-nav-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}
.calendar-nav-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: #f5f5f5;
  border-bottom: 1px solid #eee;
}
.calendar-day.weekend {
  color: #ff6b6b;
}
.calendar-day.weekend.disabled {
  color: #ffb3b3;
}

.calendar-day.future-limit {
  position: relative;
}
.calendar-day.future-limit:after {
  content: '';
  position: relative;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
      45deg,
      rgba(200, 200, 200, 0.1),
      rgba(200, 200, 200, 0.1) 5px,
      rgba(200, 200, 200, 0.2) 5px,
      rgba(200, 200, 200, 0.2) 10px
  );
  z-index: 1;
  border-radius: 50%;
}

.calendar-day.weekend {
  background-color: rgba(255, 107, 107, 0.05);
}
.calendar-nav-btn:first-child.disabled-nav:hover:before {
  left: 0;
}
.calendar-nav-btn:last-child.disabled-nav:hover:before {
  right: 0;
}
.calendar-day:not(.disabled):not(.empty):hover {
  background-color: rgba(66, 185, 131, 0.15);
  transform: scale(1.05);
  transition: all 0.2s ease;
}
.calendar-days {
  transition: opacity 0.2s ease;
}
.calendar-day.today {
  border: 2px solid #42b983;
}

.past-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #888;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.weekday {
  text-align: center;
  padding: 8px 0;
  color: #555;
  font-weight: 500;
  font-size: 0.9rem;
}
.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 5px;
  gap: 2px;
}
.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s;
  position: relative;
  font-size: 0.9rem;
}
.calendar-day:hover:not(.disabled):not(.empty) {
  background-color: #f0f8f4;
}
.calendar-day.disabled {
  color: #ccc;
  cursor: not-allowed;
}
.calendar-day.selected {
  background-color: #42b983;
  color: white;
  font-weight: bold;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.3);
}
.calendar-day.selected:empty::before {
  content: attr(data-day); /* Use a data attribute for the day number if span is missing */
  display: block;
  color: white;
  font-weight: bold;
}
.chevron-icon {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-right: 2px solid white;
  border-bottom: 2px solid white;
  transform: rotate(45deg);
  transition: transform 0.3s ease;
}
.chevron-icon.rotated {
  transform: rotate(-135deg);
}
.service-type-header.direct-access {
  background-color: #42b983;  /* A slightly different green */
  border-left: 4px solid rgba(255, 255, 255, 0.5);  /* Add a subtle left border */
}
.service-type-header.direct-access:hover {
  box-shadow: 0 0 10px rgba(66, 185, 131, 0.5);
}
.chevron-icon {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-right: 2px solid white;
  border-bottom: 2px solid white;
  transform: rotate(45deg);
  transition: transform 0.3s ease;
}
.chevron-icon.rotated {
  transform: rotate(-135deg);
}
.service-type-header.direct-access {
  background-color: #42b983;  /* A slightly different green */
  position: relative;
}
.service-type-header.direct-access::after {
  content: "";
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}
.calendar-day.future-limit:first-of-type:hover:before {
  content: 'Booking limited to 1 month ahead';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
}
.calendar-day.selected.today::after {
  background-color: white;
}
.calendar-day.empty {
  cursor: default;
}
.calendar-nav-btn.disabled-nav {
  opacity: 0.3;
  cursor: not-allowed;
}
.date-picker input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
  max-width: 300px;
}
.time-slots ul {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
}

.time-slot-btn:hover:not(.disabled-btn) {
  background: #e0f0e8;
}

.time-slot-btn.disabled-btn {
  position: relative;
  opacity: 0.7;
  cursor: not-allowed;
  background-color: #f8d7da !important;
  color: #721c24 !important;
  border-color: #f5c6cb !important;
}
.booked-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading-times {
  padding: 1rem;
  text-align: center;
  color: #666;
}
button {
  padding: 10px;
  margin: 5px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.minute-slots button.time-slot-btn {
  padding: 10px;
  margin: 5px;
  background-color: #75ba9b; /* Change this to your desired color */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
button:disabled {
  background-color: #ddd;
  cursor: not-allowed;
}
button:active {
  transform: scale(0.95);
}

.success-message {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-left: 4px solid #42b983;
}

.option-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}
.back-button {
  margin-top: 20px; /* Adds space above the button */
  /* Your existing styles */
  background: #dddddd;
  color: #0c0b0b;
  border: 1px solid #afafaf;
  border-radius: 6px;
  padding: 12px 24px;
  min-width: 100px;
}

.back-button:hover {
  background: #e0e0e0;
  border-color: #ccc;
}

.back-button:active {
  transform: translateY(1px);
}

/* For better visual hierarchy */
.action-buttons .back-button {
  order: -1; /* Positions before other buttons */
}
.service-type-header {
  width: 100%;
  padding: 15px;
  margin: 5px 0;
  text-align: left;
  background-color: #42b983;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.toggle-icon {
  margin-left: 10px;
  font-size: 0.9em;
}
.no-options {
  color: #666;
  font-style: italic;
  margin-top: 1rem;
}
.next-button {
  /* Matching the back button proportions */
  padding: 12px 24px;
  min-width: 100px;
  border-radius: 6px;
  margin: 0 10px;

  /* Visual Style */
  background: #42b983;
  color: white;
  border: none;

  /* Typography */
  font-weight: 600;
  font-size: 1rem;

  /* Interactions */
  transition: all 0.3s ease;
  cursor: pointer;
}

.next-button, .back-button {
  /* Shared properties */
  padding: 12px 24px;
  min-width: 100px;
  height: 44px;
  font-size: 1rem;
  box-sizing: border-box;
  vertical-align: top; /* Fixes inline-block misalignment */

  /* Individual styles */
  &.back-button {
    background: #f5f5f5;
    border: 1px solid #ddd;
    margin: 0;
  }

  &.next-button {
    background: #42b983;
    border: none;
    margin: 0;
  }
}

/* Hover/Active States */
.next-button:hover {
  background: #38a169;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.next-button:active {
  transform: translateY(1px);
}

/* Disabled State */
.next-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
}
.navigation-buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 20px;
}
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.form-row label {
  width: 150px;
  text-align: right;
  padding-right: 15px;
  font-weight: 500;
}
.form-row input {
  flex: 1;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ddd;
  transition: border-color 0.2s ease;
}
.form-row input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.2);
}

/* Bank Information Section */
.bank-info-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.bank-logo-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bank-logo {
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.bank-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.bank-info-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.branch-info {
  width: 100%;
}
.info-row i {
  color: #42b983;
  font-size: 1.2rem;
  min-width: 24px;
  text-align: center;
}

/* Appointment Details */
.appointment-details {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600; /* Bold labels */
  color: #333;
  flex: 1;
}

.detail-value {
  font-weight: 400; /* Normal weight values */
  color: #555;
  flex: 1;
  text-align: right;
}

/* Responsive Adjustments */
@media (max-width: 600px) {
  .bank-info-header {
    flex-direction: column;
    text-align: center;
  }

  .bank-logo-container {
    flex-direction: column;
  }

  .detail-row {
    flex-direction: column;
    gap: 0.2rem;
  }

  .detail-value {
    text-align: left;
  }
}
/* Form specific styles */
.appointment-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.appointment-form h3 {
  color: #42b983;
  text-align: center;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  position: relative;
  padding-bottom: 0.5rem;
}

.appointment-form h3:after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 3px;
  background: #42b983;
}

.appointment-form input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.appointment-form input:focus {
  border-color: #42b983;
  outline: none;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.2);
}

/* Summary section */
.appointment-summary {
  display: grid;
  gap: 1rem;
}

.appointment-summary h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .appointment-container {
    padding: 0 15px;
  }

  .appointment-card {
    padding: 1.5rem;
    border-radius: 8px;
  }

  .appointment-form h3 {
    font-size: 1.3rem;
  }
}

/* Animation for better UX */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
}
.form-actions button {
  min-width: 120px;
}
.submit-button {
  /* Size & Spacing - Match back button */
  padding: 12px 24px; /* Adjusted to match back button */
  min-width: 120px; /* Reduced to match typical back button width */
  height: 48px; /* Explicit height to match */
  border-radius: 6px; /* Consistent with back button */

  /* Visual Style */
  background: #42b983;
  color: white;
  border: none;

  /* Typography */
  font-weight: 600; /* Slightly less bold */
  font-size: 1rem; /* Standard size */
  letter-spacing: normal; /* Removed special spacing */

  /* Interactions */
  transition: all 0.2s ease; /* Simpler transition */
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(66, 185, 131, 0.3); /* Subtler shadow */

  /* Alignment */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box; /* Include padding in width/height */
}

/* Hover State */
.submit-button:not(:disabled):hover {
  background: #38a169;
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.4);
  transform: translateY(-1px);
}

/* Active State */
.submit-button:not(:disabled):active {
  transform: translateY(0);
  box-shadow: 0 2px 3px rgba(66, 185, 131, 0.3);
}

/* Disabled State */
.submit-button:disabled {
  background: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

/* Loading State Indicator */
.submit-button:disabled:after {
  content: '...';
  display: inline-block;
  width: 1em;
  text-align: left;
  animation: dots 1.5s steps(5, end) infinite;
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
}
.service-selection-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
}
.service-group {
  margin-bottom: 8px;
}
.service-type-header {
  width: 100%;
  padding: 16px 20px;
  text-align: left;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.service-type-header:hover {
  background-color: #3da876;
}
.service-type-header.expanded {
  border-radius: 6px 6px 0 0;
  box-shadow: none;
}
.chevron-icon {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-right: 2px solid white;
  border-bottom: 2px solid white;
  transform: rotate(-45deg);
  transition: transform 0.3s ease;
}
.service-type-header.expanded .chevron-icon {
  transform: rotate(45deg);
}
.sub-services-container {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  background-color: #c8e6c9;
  border-radius: 0 0 6px 6px;
  border-left: 1px solid #c8e6c9;
  border-right: 1px solid #c8e6c9;
  border-bottom: 1px solid #c8e6c9;
}
.sub-services-container.expanded {
  max-height: 300px; /* Adjust based on your content needs */
}
.sub-services {
  padding: 10px 0;
  display: flex;
  flex-direction: column;
}
.sub-service-button {
  text-align: left;
  padding: 12px 20px 12px 30px;
  background-color: transparent;
  border: none;
  border-radius: 0;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
}
.sub-service-button:hover {
  background-color: #c8e6c9;
}
.sub-service-button.active {
  background-color: #c8e6c9;
  color: #42b983;
  font-weight: 500;
}
.sub-service-button.active:before {
  content: "";
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #42b983;
}

/*33333333333333333333333333333333333333333333333          TIME        3333333333333333333333333333333333333333333333333333333 */
/* Hour grouping styles */
.hour-group {
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
}
.hour-label {
  background-color: #42b983;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 10px;
  color: #f6f6f6;
  font-weight: 600;
  font-size: 0.95rem;
}
.minute-slots {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 8px;
}


/* Existing time slot button styles, updated for minutes */
.time-slot-btn {
  position: relative;
  transition: all 0.2s ease;
  overflow: hidden;
}
.time-slot-btn:not(.disabled-btn):not(.past-time):hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.time-slot-btn:hover:not(.disabled-btn):not(.past-time) {
  background: #42b983;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.time-slot-btn.selected-btn {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(19, 110, 69, 0.2);
}
/* Add this at the END of your style section to ensure it overrides all previous rules */
.minute-slots button.time-slot-btn.selected-btn {
  background-color: #02af49 !important; /* Vibrant green for selected state */
  color: white !important;
}
.time-slot-btn.selected-btn:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: #409a71;
  border-radius: 3px 3px 0 0;
}
.time-slot-btn.past-time {
  background-color: #a8e4c0;
  color: #a8e4c0;
  border-color: #a8e4c0;
  cursor: not-allowed;
}

/*                                   Calendar and Time slots block size matching*/

/* Consistent container sizing for perfect alignment */
.custom-calendar,
.time-slots {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 550px; /* Exact same width for both components */
  margin: 0 auto;
  overflow: hidden;
  transition: all 0.3s ease;
}


.time-slots {
  margin-top: 20px; /* Consistent spacing between components */
}

/* Calendar header styling */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #6AB99C;
  color: white;
  padding: 12px 16px;
  font-weight: 500;
  font-size: 1.2rem;
}

.calendar-header h3 {
  margin: 0;
}

/* Calendar days styling */
.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 10px 15px 20px;
  gap: 8px;
}

.calendar-day {
  aspect-ratio: 1/1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  color: #1c0303; /* Light red for unavailable days */
}

.calendar-day.available {
  color: #333;
}

.calendar-day.selected {
  background-color: #6AB99C;
  color: white;
  border: none;
}






.back-button,
.continue-button {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}


/* Message styling when no times are selected */
.select-date-message {
  padding: 16px;
  text-align: center;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin: 16px;
  border-left: 4px solid #6AB99C;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .custom-calendar,
  .time-slots {
    max-width: 95%;
    margin-left: auto;
    margin-right: auto;
  }

  .calendar-days {
    gap: 4px;
    padding: 10px 10px 20px;
  }
}

/* -----------------------------------------*/
.time-slots-content {
  padding: 10px;
  max-height: 400px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #42b983 #f0f0f0;
}
.time-slots-content::-webkit-scrollbar {
  width: 8px;
}
.time-slots-content::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.time-slots-content::-webkit-scrollbar-thumb {
  background-color: #42b983;
  border-radius: 4px;
}
.hour-group.current-hour {
  position: relative;
}

.hour-group.current-hour:before {
  content: "";
  position: absolute;
  left: -10px;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #42b983;
  border-radius: 2px;
}

.hour-group.current-hour .hour-label {
  background-color: #23915f;
}

.no-times-message, .select-date-message {
  padding: 20px;
  text-align: center;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin: 10px 0;
}
.no-times-message {
  border-left: 4px solid #ff6b6b;
}
.select-date-message {
  border-left: 4px solid #42b983;
}


 /*4444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444444*/

.step-container {
  max-width: 650px;
  margin: 2rem auto;
  padding: 0 20px;
}
h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}
.appointment-summary {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.bank-info-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.bank-logo-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.bank-logo {
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  overflow: hidden;
}
.bank-logo img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}
.bank-info-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}
.branch-info {
  width: 100%;
  margin-top: 0.5rem;
}
.info-row i {
  color: #23915f;
  font-size: 1.2rem;
  min-width: 24px;
  text-align: center;
}
.info-row p {
  margin: 0;
  color: #4a5568;
}
.appointment-details {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 2rem;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 0;
  border-bottom: 1px solid #eee;
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-label {
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
}
.detail-value {
  font-weight: 400;
  color: #4a5568;
  flex: 1;
  text-align: center;
}
.appointment-form {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin-bottom: 1.5rem;
}
.appointment-form h3 {
  color: #23915f;
  text-align: center;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  position: relative;
  padding-bottom: 0.8rem;
}
.appointment-form h3:after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 3px;
  background: #23915f;
}
.form-row {
  display: flex;
  margin-bottom: 1.2rem;
  align-items: center;
}
.form-row label {
  width: 150px;
  text-align: right;
  padding-right: 15px;
  font-weight: 500;
  color: #2c3e50;
}
.form-row input {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}
.form-row input:focus {
  outline: none;
  border-color: #23915f;
  box-shadow: 0 0 0 3px rgba(35, 145, 95, 0.2);
}
.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  align-items: center;
}
.back-button, .submit-button {
  height: 44px;
}
.back-button {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.back-button:hover {
  background: #e8e8e8;
}
.submit-button {
  background: #23915f;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 180px;
}
.submit-button:hover {
  background: #1a7a4e;
  transform: translateY(-1px);
}
.submit-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
}
/* Booking state */
.submit-button:disabled:after {
  content: '';
  display: inline-block;
  width: 1em;
  animation: ellipsis 1.5s infinite;
  text-align: left;
}

@keyframes ellipsis {
  0%, 25% { content: '.'; }
  26%, 50% { content: '..'; }
  51%, 75% { content: '...'; }
  76%, 100% { content: ''; }
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .form-row label {
    width: 100%;
    text-align: left;
    margin-bottom: 0.5rem;
  }
  .bank-logo-container {
    flex-direction: column;
    text-align: center;
  }
  .detail-row {
    flex-direction: column;
    gap: 0.3rem;
  }
  .detail-value {
    text-align: left;
  }
  .form-actions {
    flex-direction: column;
    gap: 1rem;
  }
  .back-button, .submit-button {
    width: 100%;
  }
}

</style>