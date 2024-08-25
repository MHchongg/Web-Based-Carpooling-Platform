import Landing from '../pages/Landing'
import Home from '../pages/Home';
import NotFound from '../components/NotFound';
import Carpools from '../pages/Carpools'
import GroupChat from '../pages/GroupChat'
import Profile from '../pages/Profile'
import BecomeDriver from '../pages/BecomeDriver'
import Rewards from '../pages/Rewards'
import RateMembers from '../pages/RateMembers';
import AdminHome from '../pages/AdminHome';
import Users from '../pages/Users';
import Drivers from '../pages/Drivers';
import ManageRewards from '../pages/ManageRewards';
import DriverInfo from '../pages/DriverInfo';
import RewardInfo from '../pages/RewardInfo';
import RewardList from '../pages/RewardList';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import { createBrowserRouter } from "react-router-dom"
import { AuthUser } from '../components/Auth/AuthUser';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Landing />
    },
    {
        path: '/home',
        element: <AuthUser><Home /></AuthUser>,
        children: [
            {
                index: true,
                element: <Carpools />
            },
            {
                path: 'groupChat',
                element: <GroupChat />
            },
            {
                path: 'profile',
                element: <Profile />
            },
            {
                path: 'becomeDriver',
                element: <BecomeDriver />
            },
            {
                path: 'rewards',
                element: <Rewards />
            },
        ]
    },
    {
        path: '/adminHome',
        element: <AuthUser><AdminHome /></AuthUser>,
        children: [
            {
                index: true,
                element: <Users />
            },
            {
                path: 'drivers',
                element: <Drivers />
            },
            {
                path: 'manageRewards',
                element: <ManageRewards />,
                children: [
                    {
                        index: true,
                        element: <RewardList />,
                    },
                    {
                        path: 'rewardInfo/:type/:reward_id?',
                        element: <RewardInfo />
                    }
                ],
            },
            {
                path: 'driverInfo/:driverEmail/:type',
                element: <DriverInfo />
            },
        ]
    },
    {
        path: '/rateMembers/:carpool_id/:user_email/:uuid',
        element: <RateMembers />
    },
    {
        path: '/forgotPassword',
        element: <ForgotPassword />
    },
    {
        path: '/resetPassword/:user_email/:uuid',
        element: <ResetPassword />
    },
    {
        path: '*',
        element: <NotFound />
    }
])

export default router