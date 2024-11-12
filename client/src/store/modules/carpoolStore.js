import { createSlice } from "@reduxjs/toolkit";
import { request } from '../../utils'

const carpoolStore = createSlice({
    name: 'carpool',

    initialState: {
        carpoolList: [],
        myCarpoolList: [],
        myCarpoolJoinRequests: [],
        myJoinRequests: [],
        driverIsMeGroup: [],
    },

    reducers: {
        setCarpoolList(state, action) {
            state.carpoolList = action.payload
        },

        setMyCarpoolList(state, action) {
            state.myCarpoolList = action.payload
        },

        setMyCarpoolJoinRequests(state, action) {
            state.myCarpoolJoinRequests = action.payload
        },

        setMyJoinRequests(state, action) {
            state.myJoinRequests = action.payload
        },

        setDriverIsMeGroup(state, action) {
            state.driverIsMeGroup = action.payload
        }
    }
})

const {
    setCarpoolList,
    setMyCarpoolList,
    setMyCarpoolJoinRequests,
    setMyJoinRequests,
    setDriverIsMeGroup,
} = carpoolStore.actions

const carpoolReducer = carpoolStore.reducer

const postCarpool = (carpoolForm) => {
    return async () => {
        const res = await request.post(`/api/carpool/postCarpool`, { carpoolForm: carpoolForm })
        return res.data
    }
}

const getCarpools = () => {
    return async (dispatch) => {
        const res = await request.get(`/api/carpool`)
        dispatch(setCarpoolList(res.data))
    }
}

const getMyCarpools = (userEmail) => {
    return async (dispatch) => {
        const res = await request.get(`/api/carpool/myCarpools?userEmail=${userEmail}`)
        dispatch(setMyCarpoolList(res.data))
    }
}

const getMyCarpoolJoinRequest = (member_email) => {
    return async (dispatch) => {
        const res = await request.get(`/api/joinRequest/myCarpools?member_email=${member_email}`)
        dispatch(setMyCarpoolJoinRequests(res.data))
    }
}

const getDriverGroups = (user_email) => {
    return async (dispatch) => {
        const res = await request.get(`/api/carpool/driverGroups?user_email=${user_email}`)
        dispatch(setDriverIsMeGroup(res.data))
    }
}

const getMyJoinRequests = (user_email) => {
    return async (dispatch) => {
        const res = await request.get(`/api/joinRequest/myJoinRequests?user_email=${user_email}`)
        dispatch(setMyJoinRequests(res.data))
    }
}

const getCarpoolMembers = (carpool_id) => {
    return async () => {
        const res = await request.get(`/api/carpool/carpoolMembers?carpool_id=${carpool_id}`)
        return res.data
    }
}

const requestToJoinCarpool = (carpoolInfo, user_email, user_name, driver_email) => {
    return async () => {
        const res = await request.post(`/api/joinRequest`, { carpoolInfo: carpoolInfo, user_email: user_email, user_name: user_name, driver_email: driver_email })
        return res.data
    }
}

const updateJoinRequest = (request_id, carpoolInfo, user_email, user_name, type) => {
    return async () => {
        const res = await request.patch(`/api/joinRequest/updateJoinRequest`, {
            request_id: request_id,
            carpoolInfo: carpoolInfo,
            member_email: user_email,
            member_name: user_name,
            type: type,
        })
        return res.data
    }
}

const exitCarpool = (user_email, carpoolInfo, driver_email) => {
    return async () => {
        const res = await request.delete(`/api/carpool/exitCarpool?user_email=${user_email}&carpoolInfo=${JSON.stringify(carpoolInfo)}&driver_email=${driver_email}`)
        return res.data
    }
}

const formCarpool = (carpoolInfo, user_email, user_name, member_email) => {
    return async () => {
        const res = await request.post('/api/carpool/formCarpool', { carpoolInfo: carpoolInfo, user_email: user_email, user_name: user_name, member_email: member_email })
        return res.data
    }
}

const searchCarpools = (fromAddress, toAddress, dateTime, type) => {
    return async () => {
        const res = await request.get(`/api/carpool/searchCarpools?fromAddress=${JSON.stringify(fromAddress)}&toAddress=${JSON.stringify(toAddress)}&dateTime=${dateTime}&type=${type}`)
        return res.data
    }
}

const updateCarpoolStatus = (carpool_id, carpool_title, carpool_from, carpool_to, carpool_dateTime, members_email, carpool_status) => {
    return async () => {
        const res = await request.patch('/api/carpool/updateCarpoolStatus', {
            carpool_id: carpool_id,
            carpool_title: carpool_title,
            carpool_from: carpool_from,
            carpool_to: carpool_to,
            carpool_dateTime: carpool_dateTime,
            members_email: members_email,
            carpool_status: carpool_status,
        })
        return res.data
    }
}

export {
    setCarpoolList,
    setMyCarpoolList,
    setMyCarpoolJoinRequests,
    postCarpool,
    getCarpools,
    getMyCarpools,
    getCarpoolMembers,
    requestToJoinCarpool,
    getMyCarpoolJoinRequest,
    getDriverGroups,
    getMyJoinRequests,
    updateJoinRequest,
    exitCarpool,
    formCarpool,
    searchCarpools,
    updateCarpoolStatus,
}

export default carpoolReducer