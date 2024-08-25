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

const getUserList = () => {
    return async (dispatch) => {
        const res = await request.get(`/getUserList`)
        dispatch(setUserList(res.data))
    }
}

const updateUserStatus = (user_email, user_name, update_action) => {
    return async () => {
        const res = await request.post('/updateUserStatus', { user_email: user_email, user_name: user_name, update_action: update_action })
        return res.data
    }
}

const getRequests = () => {
    return async () => {
        const res = await request.get(`/getRequests`)
        return res.data
    }
}

const handleBecomeDriverRequest = (type, user_email) => {
    return async () => {
        const res = await request.post('/handleBecomeDriverRequest', { type: type, user_email: user_email })
        return res.data
    }
}

const getDriverUpdateInfo = (user_email) => {
    return async () => {
        const res = await request.get(`/getDriverUpdateInfo?user_email=${user_email}`)
        return res.data
    }
}

const handleUpdateDriverInfoRequest = (type, user_email, newInfo) => {
    return async () => {
        const res = await request.post('/handleUpdateDriverInfoRequest', { type: type, user_email: user_email, newInfo: newInfo })
        return res.data
    }
}

export {
    setUserList,
    getUserList,
    updateUserStatus,
    getRequests,
    handleBecomeDriverRequest,
    getDriverUpdateInfo,
    handleUpdateDriverInfoRequest,
}

export default adminReducer