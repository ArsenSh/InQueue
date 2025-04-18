import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './components/HomePage.vue';
import AppointmentPage from './components/AppointmentPage.vue';
import ManageAppointmentPage from './components/ManageAppointmentPage.vue';
import ContactUsPage from "@/components/ContactUsPage.vue";
import AboutUsPage from "@/components/AboutUsPage.vue";
import PrivacyPolicyPage from "@/components/PrivacyPolicyPage.vue";
import TermsOfServicePage from "@/components/TermsOfServicePage.vue";
import BranchDashboard from "@/components/BranchDashboard.vue";
import BranchAppointments from "@/components/BranchAppointments.vue";
import BranchLogin from "@/components/BranchLogin.vue";
import ReportsComponent from "@/components/ReportsComponent.vue";
import BranchSettings from "@/components/BranchSettings.vue";
import WindowWorkerView from '@/views/WindowWorkerView.vue'
import CheckInView from '@/views/CheckInView.vue'


const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomePage
    },
    {
        path: '/appointment/:bankId/:branchId',
        name: 'Appointment',
        component: AppointmentPage
    },
    {
        path: '/manage-appointment/:appointmentId',
        name: 'ManageAppointment',
        component: ManageAppointmentPage
    },
    {
        path: '/contactus',
        name: 'ContactUs',
        component: ContactUsPage
    },
    {
        path: '/aboutus',
        name: 'AboutUs',
        component: AboutUsPage
    },
    {
        path: '/privacy-policy',
        name: 'PrivacyPolicy',
        component: PrivacyPolicyPage
    },
    {
        path: '/terms',
        name: 'TermsOfService',
        component: TermsOfServicePage
    },
    {
        path: '/branch-login',
        name: 'BranchLogin',
        component: BranchLogin,
        meta: {
            title: 'Branch Login - InQueue'
        }
    },
    {
        path: '/branch-dashboard',
        name: 'BranchDashboard',
        component: BranchDashboard,
        meta: {
            requiresAuth: true,
            roles: ['branch_admin'],
            title: 'Branch Dashboard - InQueue'
        },
        beforeEnter: (to, from, next) => {
            const branchId = localStorage.getItem('branchId');
            const bankId = localStorage.getItem('bankId');
            const role = localStorage.getItem('role');

            console.log('Navigation Guard - branchId:', branchId);
            console.log('Navigation Guard - bankId:', bankId);
            console.log('Navigation Guard - role:', role);

            if (!branchId || !bankId) {
                console.log('Redirecting to login due to missing credentials');
                next({ name: 'BranchLogin' });
            } else if (role !== 'branch_admin') {
                console.log('Access denied: requires branch_admin role');
                next({ name: 'BranchLogin' });
            } else {
                next();
            }
        }
    },
    {
        path: '/branch-appointments',
        name: 'BranchAppointments',
        component: BranchAppointments,
        meta: {
            requiresAuth: true,
            roles: ['branch_admin'],
            title: 'Branch Appointments - InQueue'
        },
        beforeEnter: (to, from, next) => {
            const branchId = localStorage.getItem('branchId');
            const bankId = localStorage.getItem('bankId');
            const role = localStorage.getItem('role');

            console.log('Navigation Guard - branchId:', branchId);
            console.log('Navigation Guard - bankId:', bankId);
            console.log('Navigation Guard - role:', role);

            if (!branchId || !bankId) {
                console.log('Redirecting to login due to missing credentials');
                next({ name: 'BranchLogin' });
            } else if (role !== 'branch_admin') {
                console.log('Access denied: requires branch_admin role');
                next({ name: 'BranchLogin' });
            } else {
                next();
            }
        }
    },
    {
        path: '/branch-reports',
        name: 'BranchReports',
        component: ReportsComponent,
        meta: {
            requiresAuth: true,
            roles: ['branch_admin'],
            title: 'Branch Reports - InQueue'
        },
        beforeEnter: (to, from, next) => {
            const branchId = localStorage.getItem('branchId');
            const bankId = localStorage.getItem('bankId');
            const role = localStorage.getItem('role');

            if (!branchId || !bankId) {
                console.log('Redirecting to login due to missing credentials');
                next({ name: 'BranchLogin' });
            } else if (role !== 'branch_admin') {
                console.log('Access denied: requires branch_admin role');
                next({ name: 'BranchLogin' });
            } else {
                next();
            }
        }
    },
    {
        path: '/branch-settings',
        name: 'BranchSettings',
        component: BranchSettings,
        meta: {
            requiresAuth: true,
            roles: ['branch_admin'],
            title: 'Branch Settings - InQueue'
        },
        beforeEnter: (to, from, next) => {
            const branchId = localStorage.getItem('branchId');
            const bankId = localStorage.getItem('bankId');
            const role = localStorage.getItem('role');

            if (!branchId || !bankId) {
                console.log('Redirecting to login due to missing credentials');
                next({ name: 'BranchLogin' });
            } else if (role !== 'branch_admin') {
                console.log('Access denied: requires branch_admin role');
                next({ name: 'BranchLogin' });
            } else {
                next();
            }
        }
    },
    {
        path: '/window/:windowNumber',
        name: 'WindowWorker',
        component: WindowWorkerView,
        props: true,
        meta: {
            requiresAuth: true,
            roles: ['window_staff'],
            title: 'Staff Window - InQueue'
        },
        beforeEnter: (to, from, next) => {
            const branchId = localStorage.getItem('branchId');
            const token = localStorage.getItem('branchToken');
            const role = localStorage.getItem('role');
            const windowNumber = localStorage.getItem('windowNumber');

            if (!token || !branchId) {
                console.log('Redirecting to login due to missing credentials');
                next({ name: 'BranchLogin' });
            }
            else if (role !== 'window_staff') {
                console.log('Unauthorized access: not a window staff member');
                next({ name: 'BranchLogin' });
            }
            else if (windowNumber !== to.params.windowNumber.toString()) {
                console.log('Unauthorized window access attempt');
                next({ name: 'BranchLogin' });
            }
            else {
                next();
            }
        }
    },
    {
        path: '/checkin',
        name: 'CheckIn',
        component: CheckInView,
        meta: {
            requiresAuth: true,
            roles: ['checkin_staff'],
            title: 'Check-in - InQueue'
        },
        beforeEnter: (to, from, next) => {
            const branchId = localStorage.getItem('branchId');
            const token = localStorage.getItem('branchToken');
            const role = localStorage.getItem('role');

            if (!token || !branchId) {
                console.log('Redirecting to login due to missing credentials');
                next({ name: 'BranchLogin' });
            }
            else if (role !== 'checkin_staff') {
                console.log('Unauthorized access: not a check-in staff member');
                next({ name: 'BranchLogin' });
            }
            else {
                next();
            }
        }
    }
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
});

export default router;