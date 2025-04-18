<template>
  <div class="app-container">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <h1 class="logo">InQueue</h1>
      <ul>
        <li><router-link to="/aboutus">About Us</router-link></li>
        <li><router-link to="/contactus">Contact Us</router-link></li>
      </ul>
    </nav>

    <!-- Hero Section -->
    <section id="home" class="hero">
      <h1>Welcome to InQueue</h1>
      <p>Book your bank appointments hassle-free.</p>
    </section>

    <!-- Bank Selection -->
    <div class="container">
      <h2>Select a Bank</h2>
      <div v-if="banks.length === 0" class="no-banks">No banks available</div>
      <div v-else class="bank-grid">
        <!-- Bank Card -->
        <div v-for="bank in banks" :key="bank._id" class="bank-card" @click="toggleBranches(bank._id)">
          <div class="bank-card-content">
            <div class="bank-logo">
              <img :src="getBankLogo(bank.name)" :alt="bank.name + ' logo'" />
            </div>
            <h3>{{ bank.name }}</h3>
          </div>

          <!-- Branch List (appears when bank is selected) -->
          <div v-if="selectedBank === bank._id" class="branch-list">
            <div class="branch-list-header">
              <h4>Branches</h4>
              <button class="map-button" @click.stop="openBranchesMap(bank)">
                <i class="map-icon"></i> View on Map
              </button>
            </div>

            <!-- Loading state -->
            <div v-if="isLoading" class="loading-state">
              <div class="navigation-loader">
                <div class="navigation-container">
                  <div class="navigation-path"></div>
                  <div class="start-point"></div>
                  <div class="end-point"></div>
                  <div class="navigation-marker">
                    <div class="marker-icon"></div>
                  </div>
                </div>
              </div>
              <p>Finding nearest branches...</p>
            </div>

            <!-- Error state -->
            <div v-else-if="locationError" class="error-state">
              <p class="error-message">{{ locationError }}</p>
              <p class="branches-title">All branches:</p>
            </div>

            <!-- Branches list -->
            <ul>
              <li v-for="branch in bank.branches" :key="branch.id" @click.stop="goToAppointmentPage(bank._id, branch.id)">
                <strong>{{ branch.name }}</strong> - {{ branch.address }}
                <span v-if="branch.distance && branch.distance !== Infinity" class="distance" :class="{ 'estimated': branch.isEstimated }">
                  ({{ (branch.distance/1000).toFixed(1) }} km<span v-if="branch.isEstimated">*</span>)
                </span>
                <span v-else class="distance unavailable">
                  (... km)
                </span>
              </li>
            </ul>

            <!-- Distance note -->
            <div v-if="bank.branches.some(b => b.isEstimated)" class="distance-note">
              * Distances marked with an asterisk are estimates based on direct line calculations.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Modal -->
    <div v-if="showMap" class="map-modal">
      <div class="map-modal-content">
        <div class="map-modal-header">
          <h3>{{ currentBank ? currentBank.name : '' }} Branches</h3>
          <button class="close-button" @click="closeMap">&times;</button>
        </div>
        <div class="map-container">
          <iframe
              v-if="currentBank && bankMaps[currentBank.name]"
              :src="bankMaps[currentBank.name]"
              width="100%"
              height="100%"
              style="border:0;"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade">
          </iframe>
          <div v-else class="map-fallback">
            <p>No map available for this bank. Please try another bank.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- About Us Section -->
    <section id="about" class="about">
      <h2>About QueueLess</h2>
      <p>QueueLess is designed to help you schedule bank appointments seamlessly, reducing wait times and improving customer experience.</p>
    </section>

    <!-- Contact Us Section -->
    <section id="contact" class="contact">
      <h2>Contact Us</h2>
      <p>Email: inqueueue@gmail.com</p>
      <p>Phone: +374 98 011 164</p>
    </section>

    <!-- Footer -->
    <footer class="site-footer">
      <div class="footer-content">
        <div class="footer-links">
          <a href="/terms">Terms of Service</a>
          <a href="/privacy-policy">Privacy Policy</a>
        </div>
        <div class="copyright">
          © {{ new Date().getFullYear() }} InQueue. All Rights Reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  data() {
    return {
      banks: [],
      selectedBank: null,
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
      },
      isLoading: false,
      locationError: null,
      showMap: false,
      currentBank: null,
      map: null,
      markers: [],
      bankMaps: {
        'AMIO bank': 'https://www.google.com/maps/d/u/2/embed?mid=1HYblzWGr69-U7GuU-3uEkybvHCe00lM&ehbc',
        'Acba Bank': 'https://www.google.com/maps/d/u/2/embed?mid=1MEBfWchrwJqZzMZgY_NPvmmuVH2nDEM&ehbc',
        'Idram': 'https://www.google.com/maps/d/u/2/embed?mid=1JIi7CCRLvIkFJwi6L4Yn6S94LcQfsjM&ehbc',
        'ID Bank': 'https://www.google.com/maps/d/u/2/embed?mid=1oYQ6oOV1ct71WgDfFX6P0BX5OQczjgE&ehbc',
        'Fast Bank': 'https://www.google.com/maps/d/u/2/embed?mid=1LfvcC16FkOklCJe-FXBejm26r88OAlg&ehbc',
        'Evocabank': 'https://www.google.com/maps/d/u/2/embed?mid=1a-xriRPlDXwPl1IJ-udL3ZrDQhR49_M&ehbc',
        'Converse Bank': 'https://www.google.com/maps/d/u/2/embed?mid=18bXi8g5plRyI9Hd49J1hrEUOBAW5D2s&ehbc',
        'Byblos Bank Armenia': 'https://www.google.com/maps/d/u/2/embed?mid=1PzU6PkBUqrwcsEBFgodx9R_whSDy3c0&ehbc',
        'Artsakhbank': 'https://www.google.com/maps/d/u/2/embed?mid=1nxx6oLiahjvP-B1pxbcx7P55xL09S9Y&ehbc',
        'Armeconombank': 'https://www.google.com/maps/d/u/2/embed?mid=1wEyTZgRSrr_4ONdUV0L0y1_rxSvSizE&ehbc',
        'Ardshininvestbank': 'https://www.google.com/maps/d/u/2/embed?mid=1eh7aurNP57Dl6ObFRK3O2tdtlT6R3gg&ehbc',
        'Ardshinbank': 'https://www.google.com/maps/d/u/2/embed?mid=1QM87y30ADJMMsi-huTyTiv9QCAHmMWs&ehbc',
        'Araratbank': 'https://www.google.com/maps/d/u/2/embed?mid=1WhniF5bQHAJfuA5f_b_AwRncY5hmlGI&ehbc',
        'Ameriabank': 'https://www.google.com/maps/d/u/2/embed?mid=1OMdnBlRC4uy48nL4JMActlgnBek9nw4&ehbc',
        'VTB Bank (Armenia)': 'https://www.google.com/maps/d/u/2/embed?mid=17o3Nh8aJ1TPMrlcSJk-aj6uxsVKRA58&ehbc',
        'Inecobank': 'https://www.google.com/maps/d/u/2/embed?mid=1hmEVBHxbEJqTqaEf2spSeN68uynktjA&ehbc'
      }
    };
  },
  created() {
    this.fetchBanks();
  },
  methods: {

    async fetchBanks() {
      try {
        const response = await fetch("http://localhost:5000/api/banks");
        const data = await response.json();
        this.banks = data;
      } catch (error) {
        console.error("Error fetching bank data:", error);
      }
    },

    goToAppointmentPage(bankId, branchId) {
      this.$router.push({
        name: 'Appointment',
        params: {bankId, branchId}
      });
    },

    getBankLogo(bankName) {
      // Improved logo retrieval with better error handling
      if (this.bankLogos[bankName]) {
        return this.bankLogos[bankName];
      }

      // Try case-insensitive match if direct match fails
      const bankKey = Object.keys(this.bankLogos).find(
          key => key.toLowerCase() === bankName.toLowerCase()
      );

      if (bankKey) {
        return this.bankLogos[bankKey];
      }

      // Return default logo if no match is found
      console.warn(`No logo found for bank: ${bankName}`);
      return '/logos/default-bank.png';
    },

    // Helper method for standardizing addresses
    standardizeAddress(address) {
      // If address doesn't include country/region, add it
      if (!address.toLowerCase().includes('armenia')) {
        return `${address}, Armenia`;
      }
      return address;
    },

    // Map opening method - replaced with custom map implementation
    openBranchesMap(bank) {
      this.currentBank = bank;
      this.showMap = true;
    },

    closeMap() {
      this.showMap = false;
      this.currentBank = null;
    },

    async initMap(bank) {
      try {
        // Make sure Google Maps is loaded
        await this.loadGoogleMaps();

        // Get user location
        let userLocation;
        try {
          userLocation = await this.getUserLocation();
        } catch (error) {
          console.warn("Couldn't get user location:", error);
          // Default to center of Armenia if user location fails
          userLocation = { lat: 40.1872, lng: 44.5152 }; // Yerevan coordinates
        }

        // Create the map
        const mapElement = this.$refs.mapContainer;
        this.map = new window.google.maps.Map(mapElement, {
          center: userLocation,
          zoom: 10,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true
        });

        // Add user location marker
        new window.google.maps.Marker({
          position: userLocation,
          map: this.map,
          title: "Your Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          }
        });

        // Bounds to fit all markers
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(userLocation);

        // Loop through branches and add markers
        const markerPromises = bank.branches.map(async (branch) => {
          try {
            // Try to geocode if we don't have coordinates yet
            if (!branch.lat || !branch.lng) {
              await this.geocodeBranchAddress(branch);
            }

            if (branch.lat && branch.lng) {
              const position = { lat: branch.lat, lng: branch.lng };

              // Determine color based on distance
              let markerColor = "#42b983"; // Default green
              if (branch.isEstimated) {
                markerColor = "#f0ad4e"; // Orange for estimated distances
              } else if (branch.distance === Infinity) {
                markerColor = "#888888"; // Grey for unavailable distances
              }

              // Create marker
              const marker = new window.google.maps.Marker({
                position: position,
                map: this.map,
                title: branch.name,
                animation: window.google.maps.Animation.DROP,
                icon: {
                  path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                  scale: 6,
                  fillColor: markerColor,
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 2,
                }
              });

              // Add info window
              const distanceText = branch.distance !== Infinity
                  ? `(${(branch.distance/1000).toFixed(1)} km${branch.isEstimated ? '*' : ''})`
                  : "(Distance unavailable)";

              const infoWindow = new window.google.maps.InfoWindow({
                content: `<div class="info-window">
                  <b>${branch.name}</b><br>
                  ${branch.address}<br>
                  <span style="color: ${markerColor};">${distanceText}</span><br>
                  <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(branch.address)}', '_blank')" style="margin-top: 8px; background-color: #42b983; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Directions</button>
                </div>`
              });

              marker.addListener("click", () => {
                infoWindow.open(this.map, marker);
              });

              this.markers.push(marker);
              bounds.extend(position);

              return true;
            }
            return false;
          } catch (error) {
            console.error(`Error adding marker for ${branch.name}:`, error);
            return false;
          }
        });

        // Wait for all markers to be processed
        await Promise.all(markerPromises);

        // Fit the map to include all markers
        this.map.fitBounds(bounds);

        // If we have just one marker (plus user location), zoom out a bit
        if (this.markers.length <= 1) {
          this.map.setZoom(13);
        }

      } catch (error) {
        console.error("Error initializing map:", error);
        alert("There was an error loading the map. Please try again.");
        this.closeMap();
      }
    },

    // Add geocoding for branch addresses
    async geocodeBranchAddress(branch) {
      return new Promise((resolve, reject) => {
        // Skip if already geocoded
        if (branch.lat && branch.lng) {
          resolve({ lat: branch.lat, lng: branch.lng });
          return;
        }

        // Standardize the address
        const address = this.standardizeAddress(branch.address);

        // Create geocoder
        const geocoder = new window.google.maps.Geocoder();

        // Set geocoding options with region biasing and viewport biasing
        const options = {
          address: address,
          region: 'am', // Armenia country code
          componentRestrictions: { country: 'am' },
          // Center of Armenia for viewport biasing
          bounds: new window.google.maps.LatLngBounds(
              new window.google.maps.LatLng(38.8, 43.4), // SW
              new window.google.maps.LatLng(41.3, 46.6)  // NE
          )
        };

        // Geocode the address
        geocoder.geocode(options, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const location = results[0].geometry.location;

            // Cache the coordinates on the branch object
            branch.lat = location.lat();
            branch.lng = location.lng();

            resolve({ lat: branch.lat, lng: branch.lng });
          } else {
            console.warn(`Geocoding failed for branch: ${branch.name}, address: "${branch.address}", status: ${status}`);
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
    },

    // Add Haversine distance calculation as a fallback
    calculateHaversineDistance(origin, destination) {
      // Radius of the Earth in meters
      const R = 6371000;

      // Convert latitude and longitude from degrees to radians
      const lat1Rad = this.deg2rad(origin.lat);
      const lon1Rad = this.deg2rad(origin.lng);
      const lat2Rad = this.deg2rad(destination.lat);
      const lon2Rad = this.deg2rad(destination.lng);

      // Haversine formula
      const dLat = lat2Rad - lat1Rad;
      const dLon = lon2Rad - lon1Rad;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1Rad) * Math.cos(lat2Rad) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      // Distance in meters
      return R * c;
    },

    deg2rad(deg) {
      return deg * (Math.PI/180);
    },

    // Update your toggleBranches method to ensure google is available
    async toggleBranches(bankId) {
      // If clicking the already selected bank, just close it
      if (this.selectedBank === bankId) {
        this.selectedBank = null;
        return;
      }

      // Find the bank first
      const bank = this.banks.find(b => b._id === bankId);
      if (!bank) {
        console.error("Bank not found");
        return;
      }

      // Set the selected bank immediately to show branches
      this.selectedBank = bankId;

      // Show loading state
      this.isLoading = true;
      this.locationError = null;

      // Start distance calculation in the background
      this.calculateBranchDistances(bank);
    },

    // Enhanced distance calculation method
    async calculateBranchDistances(bank, retryCount = 0) {
      try {
        // Load Google Maps with retry mechanism
        try {
          await this.loadGoogleMaps();
        } catch (error) {
          if (retryCount < 2) {
            console.log(`Retrying Google Maps load, attempt ${retryCount + 1}`);
            return this.calculateBranchDistances(bank, retryCount + 1);
          } else {
            throw error;
          }
        }

        // Check ifgoogle is properly loaded
        if (!window.google || !window.google.maps) {
          throw new Error("Google Maps failed to load. Please refresh the page and try again.");
        }

        let userLocation;
        try {
          userLocation = await this.getUserLocation();
        } catch (error) {
          console.warn("Using default location due to error:", error.message);
          userLocation = { lat: 40.212473, lng: 44.532825 }; // Yerevan coordinates
          this.locationError = "Defaulting to Yerevan center. " + error.message;
        }

        // Get branches
        const branches = bank.branches;

        // Calculate distances in batches
        const BATCH_SIZE = 8; // Smaller batch size
        const DELAY_BETWEEN_BATCHES = 600; // Slightly longer delay

        // Function to delay execution
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Track if any distances were successfully calculated
        let successfulDistances = 0;
        let failedAddresses = [];

        // Process branches in batches
        for (let i = 0; i < branches.length; i += BATCH_SIZE) {
          const batchBranches = branches.slice(i, i + BATCH_SIZE);

          // First, try to geocode all addresses in the batch
          const geocodedBranches = [];
          const nonGeocodedBranches = [];

          for (const branch of batchBranches) {
            try {
              await this.geocodeBranchAddress(branch);
              geocodedBranches.push(branch);
            } catch (error) {
              nonGeocodedBranches.push(branch);
            }
          }

          // Standardize addresses for Distance Matrix API
          const batchDestinations = batchBranches.map(b => this.standardizeAddress(b.address));

          // Try with Distance Matrix API first
          try {
            const response = await new Promise((resolve, reject) => {
              const service = new window.google.maps.DistanceMatrixService();
              service.getDistanceMatrix({
                origins: [new window.google.maps.LatLng(userLocation.lat, userLocation.lng)],
                destinations: batchDestinations,
                travelMode: 'DRIVING',
                unitSystem: window.google.maps.UnitSystem.METRIC,
                region: 'am',
                avoidHighways: Math.random() > 0.5
              }, (result, status) => {
                if (status === 'OK') {
                  resolve(result);
                } else {
                  console.error(`Distance Matrix batch ${i}-${i+BATCH_SIZE} failed:`, status);
                  reject(new Error(`Distance calculation failed: ${status}`));
                }
              });
            });

            // Update branches with distance information
            batchBranches.forEach((branch, batchIndex) => {
              const element = response.rows[0].elements[batchIndex];
              if (element && element.status === 'OK') {
                branch.distance = element.distance.value;
                branch.isEstimated = false;
                successfulDistances++;
              } else {
                console.warn(`Distance calculation failed for branch: ${branch.name}, address: "${branch.address}", standardized to: "${batchDestinations[batchIndex]}", status: ${element ? element.status : 'unknown'}`);

                // Try using Haversine distance for geocoded branches
                if (branch.lat && branch.lng) {
                  branch.distance = this.calculateHaversineDistance(userLocation, { lat: branch.lat, lng: branch.lng });
                  branch.isEstimated = true;
                  successfulDistances++;
                } else {
                  failedAddresses.push(branch.address);
                  branch.distance = Infinity;
                }
              }
            });
          } catch (error) {
            console.error(`Error processing batch ${i}-${i+BATCH_SIZE}:`, error);

            // Use Haversine distance for geocoded branches as fallback
            batchBranches.forEach(branch => {
              if (branch.lat && branch.lng) {
                branch.distance = this.calculateHaversineDistance(userLocation, { lat: branch.lat, lng: branch.lng });
                branch.isEstimated = true;
                successfulDistances++;
              } else {
                failedAddresses.push(branch.address);
                branch.distance = Infinity;
              }
            });
          }

          // After each batch, re-sort branches to show distances as they become available
          this.sortBranchesByDistance(bank.branches);

          // If this isn't the last batch, wait before next request
          if (i + BATCH_SIZE < branches.length) {
            await delay(DELAY_BETWEEN_BATCHES);
          }
        }

        // Log all failed addresses for analysis
        if (failedAddresses.length > 0) {
          console.log('Failed addresses:', failedAddresses);
        }

        // Set a warning if some distances failed
        if (successfulDistances === 0 && branches.length > 0) {
          this.locationError = "Unable to calculate distances to any branches. Please check that the Distance Matrix API is enabled for your Google Maps API key.";
        } else {
          // Clear any error message if we have at least some successful calculations
          this.locationError = null;
        }

        // Final sort after all batches are processed
        this.sortBranchesByDistance(bank.branches);

      } catch (error) {
        console.error("Error calculating distances:", error);
        this.locationError = error.message || "Failed to calculate distances. Please try again.";
      } finally {
        this.isLoading = false;
      }
    },

    // Helper method for sorting branches by distance
    sortBranchesByDistance(branches) {
      branches.sort((a, b) => {
        // If both have valid distances, compare them
        if (a.distance !== Infinity && b.distance !== Infinity) {
          return a.distance - b.distance;
        }
        // If only a has a valid distance, a comes first
        if (a.distance !== Infinity) {
          return -1;
        }
        // If only b has a valid distance, b comes first
        if (b.distance !== Infinity) {
          return 1;
        }
        // If neither has a valid distance, maintain original order
        return 0;
      });
    },

    // In your methods, update the loadGoogleMaps function:
    async loadGoogleMaps() {
      return new Promise((resolve, reject) => {
        // If Google Maps is already loaded, resolve immediately
        if (window.google && window.google.maps) {
          resolve();
          return;
        }

        // Create a unique callback name
        const callbackName = `gmapsCallback_${Date.now()}`;

        // Create an error handler for the gm_authFailure event
        window.gm_authFailure = () => {
          console.error('Google Maps authentication failed - API key issue');
          reject(new Error('Google Maps authorization failed. There might be an issue with the API key or permissions.'));
        };

        // Success callback
        window[callbackName] = () => {
          delete window[callbackName];
          resolve();
        };

        // Create script element with recommended loading pattern
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBmYabEAqA2S5A4-C4DYQWUpA96MbpBe_0&libraries=places&callback=${callbackName}&loading=async`;
        script.async = true;

        // Error handling for script loading
        script.onerror = (error) => {
          delete window[callbackName];
          console.error('Google Maps failed to load:', error);
          reject(new Error('Failed to load Google Maps. Please check your internet connection and try again.'));
        };

        // Set a timeout for script loading
        const timeoutId = setTimeout(() => {
          delete window[callbackName];
          script.remove();
          reject(new Error('Google Maps took too long to load. Please try again.'));
        }, 15000); // 15 second timeout

        // Modify the callback to clear the timeout when successful
        const originalCallback = window[callbackName];
        window[callbackName] = () => {
          clearTimeout(timeoutId);
          originalCallback();
        };

        // Add script to document
        document.head.appendChild(script);
      });
    },

    async getUserLocation() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Your browser doesn't support geolocation. Distances can't be calculated."));
          return;
        }

        navigator.geolocation.getCurrentPosition(
            position => resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }),
            error => {
              let errorMessage;
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = "Location permission denied. Please enable location services to see branch distances.";
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = "Location information is unavailable.";
                  break;
                case error.TIMEOUT:
                  errorMessage = "Location request timed out.";
                  break;
                default:
                  errorMessage = "An unknown error occurred getting your location.";
              }
              reject(new Error(errorMessage));
            },
            {
              timeout: 10000,  // 10 second timeout
              maximumAge: 5 * 60 * 1000,  // Accept positions up to 5 minutes old
              enableHighAccuracy: false  // Faster, less battery usage
            }
        );
      });
    }
  }
};
</script>

<style scoped>
/* Loading and error states */
.loading-state {
  text-align: center;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center; /* Horizontally centers the loader */
  justify-content: center; /* Vertically centers the content if needed */
}

/* Enhanced Circular Spinner */
.navigation-loader {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 250px;
  height: 100px;
}

.navigation-container {
  position: relative;
  width: 100%;
  height: 60px;
}

.navigation-path {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(to right, transparent, #42b983 10%, #42b983 90%, transparent);
  transform: translateY(-50%);
  overflow: hidden;
}

.navigation-marker {
  position: absolute;
  top: 50%;
  left: 0;
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%);
  animation:
      moveMarker 3s cubic-bezier(0.45, 0, 0.55, 1) infinite,
      pulsate 2s ease-in-out infinite alternate;
}

.marker-icon {
  width: 100%;
  height: 100%;
  background-color: #42b983;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E");
  mask-size: cover;
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E");
  -webkit-mask-size: cover;
}

@keyframes moveMarker {
  0%, 10% {
    left: 0%;
    transform: translate(-50%, -50%) rotate(0deg);
  }
  50% {
    left: 100%;
    transform: translate(-50%, -50%) rotate(360deg);
  }
  90%, 100% {
    left: 100%;
    transform: translate(-50%, -50%) rotate(720deg);
  }
}

@keyframes pulsate {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
}

.start-point, .end-point {
  position: absolute;
  top: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #42b983;
  opacity: 0.5;
  transform: translateY(-50%);
}

.start-point {
  left: 0;
}

.end-point {
  right: 0;
}

/* Loading text styling */
.loading-state p {
  color: #42b983;
  font-weight: 500;
  margin-top: 10px;
  text-align: center;
}

.error-state {
  padding: 10px;
  margin-bottom: 10px;
}

.error-message {
  color: #e53935;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.branches-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.distance {
  color: #42b983;
  font-weight: bold;
  margin-left: 5px;
}

.distance.unavailable {
  color: #888;
  font-style: italic;
}

.distance.estimated {
  color: #f0ad4e; /* Orange color for estimated distances */
}

/* Branch list header with map button */
.branch-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid #d4e9d9;
}

.branch-list-header h4 {
  margin: 0;
  color: #2c3e50;
}

.map-button {
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.map-button:hover {
  background-color: #3aa876;
}

.map-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

/* Map Modal */
.map-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.map-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #f5f5f5;
  color: #666;
  font-size: 1.2rem;
  text-align: center;
  padding: 20px;
}

.map-modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 1000px;
  height: 80%;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.map-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.map-modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.close-button:hover {
  color: #333;
}

.map-container {
  flex: 1;
  width: 100%;
  height: 100%;
}

/* Info window styling */
.gm-style .gm-style-iw-c {
  padding: 12px !important;
}

/* General Styles */
body, html {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* Navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #42b983;
  padding: 15px 30px;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar ul {
  list-style: none;
  display: flex;
  gap: 20px;
  margin: 0;
}

.navbar ul li a {
  color: white;
  text-decoration: none;
  font-weight: bold;
  transition: opacity 0.3s;
}

.navbar ul li a:hover {
  opacity: 0.8;
}

/* Hero Section */
.hero {
  text-align: center;
  padding: 30px 20px;
  background: #e8f5e9;
  margin-bottom: 0;
}

.hero h1 {
  color: #2c3e50;
  margin-top: 0;
}

.hero p {
  font-size: 1.2rem;
  margin-bottom: 0;
}

/* App Container */
.app-container {
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* Container */
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px 20px;
  background-color: #f8f9fa;
}

/* Bank Grid */
.bank-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  align-items: start;
  background-color: #f8f9fa;
}

/* Bank Cards */
.bank-card {
  background: white;
  padding: 20px;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  height: fit-content;
  display: flex;
  flex-direction: column;
}

.bank-card:hover {
  transform: translateY(-5px);
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.15);
}

.bank-card-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.bank-logo {
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}

.bank-logo img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}

.bank-card h3 {
  margin: 0;
  color: #2c3e50;
}

.branch-list {
  margin-top: 15px;
  border-top: 1px solid #c8e6c9;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 0 0 8px 8px;
}

.branch-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.branch-list li {
  padding: 10px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #d4e9d9;
}

.branch-list li:last-child {
  border-bottom: none;
}

.branch-list li:hover {
  background: #c8e6c9;
}

/* Distance note */
.distance-note {
  font-size: 0.8rem;
  color: #666;
  padding: 10px;
  border-top: 1px solid #d4e9d9;
  margin-top: 10px;
}

/* About and Contact Sections */
.about, .contact {
  text-align: center;
  padding: 40px 20px;
  background: #f8f9fa;
  margin-top: 40px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .bank-grid {
    grid-template-columns: 1fr;
  }

  .navbar {
    flex-direction: column;
    padding: 10px;
  }

  .navbar ul {
    margin-top: 10px;
  }

  .map-modal-content {
    width: 95%;
    height: 90%;
  }
}

.site-footer {
  background-color: #42b983;
  color: white;
  padding: 20px;
  text-align: center;
}

.footer-content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.footer-links {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.footer-links a {
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  transition: opacity 0.3s;
}

.footer-links a:hover {
  opacity: 0.8;
}

.copyright {
  font-size: 0.8rem;
  opacity: 0.9;
}

</style>