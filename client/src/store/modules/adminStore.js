import { createSlice } from "@reduxjs/toolkit";
import { request } from '../../utils'

const adminStore = createSlice({
    name: 'admin',

    initialState: {
        userList: [],
    },

    reducers: {
        setUserList(state, action) {
            state.userList = action.payload
        }
    }
})

const {
    setUserList,
} = adminStore.actions

const adminReducer = adminStore.reducer

const getUsers = () => {
    return async (dispatch) => {
        const res = await request.get(`/api/user/getUsers`)
        dispatch(setUserList(res.data))
    }
}

const updateUserStatus = (user_email, user_name, update_action) => {
    return async () => {
        const res = await request.patch('/api/user/updateUserStatus', { user_email: user_email, user_name: user_name, update_action: update_action })
        return res.data
    }
}

const getRequests = () => {
    return async () => {
        const res = await request.get(`/api/driverRequest/getRequests`)
        return res.data
    }
}

const updateBecomeDriverRequest = (type, user_email) => {
    return async () => {
        const res = await request.patch('/api/driverRequest/updateBecomeDriverRequest', { type: type, user_email: user_email })
        return res.data
    }
}

const getDriverUpdateInfo = (user_email) => {
    return async () => {
        const res = await request.get(`/api/driverRequest/getDriverUpdateInfo?user_email=${user_email}`)
        return res.data
    }
}

const handleUpdateDriverInfoRequest = (type, user_email, newInfo) => {
    return async () => {
        const res = await request.patch('/api/driverRequest/handleUpdateDriverInfoRequest', { type: type, user_email: user_email, newInfo: newInfo })
        return res.data
    }
}

export {
    setUserList,
    getUsers,
    updateUserStatus,
    getRequests,
    updateBecomeDriverRequest,
    getDriverUpdateInfo,
    handleUpdateDriverInfoRequest,
}

export default adminReducer