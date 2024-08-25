import { configureStore } from "@reduxjs/toolkit";
import userReducer from './modules/userStore'
import carpoolReducer from "./modules/carpoolStore";
import rewardReducer from "./modules/rewardStore";
import groupChatReducer from "./modules/groupChatStore";
import adminReducer from "./modules/adminStore";

const store = configureStore({
   reducer: {
    user: userReducer,
    carpool: carpoolReducer,
    reward: rewardReducer,
    groupChat: groupChatReducer,
    admin: adminReducer,
   }
})

export default store