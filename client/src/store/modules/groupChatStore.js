import { createSlice } from "@reduxjs/toolkit";
import { request } from '../../utils'

const groupChatStore = createSlice({
    name: 'groupChat',

    initialState: {
        groupChatGroup: [],
    },

    reducers: {
        setGroupChatGroup(state, action) {
            state.groupChatGroup = action.payload
        }
    }
})

const {
    setGroupChatGroup,
} = groupChatStore.actions

const groupChatReducer = groupChatStore.reducer

const getMyGroupChatGroups = (user_email) => {
    return async (dispatch) => {
        const res = await request.get(`/getMyGroupChatGroups?user_email=${user_email}`)
        dispatch(setGroupChatGroup(res.data))
    }
}

const saveMessage = (data) => {
    return async () => {
        const res = await request.post('/saveMessage', { data: data })
        return res.data
    }
}

const getMessageHistory = (groupID) => {
    return async () => {
        const res = await request.get(`/getMessageHistory?groupID=${groupID}`)
        return res.data
    }
}

export {
    saveMessage,
    getMyGroupChatGroups,
    getMessageHistory,
    setGroupChatGroup,
}

export default groupChatReducer