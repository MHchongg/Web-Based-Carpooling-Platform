import { createSlice } from "@reduxjs/toolkit";
import { request } from '../../utils'

const rewardStore = createSlice({
    name: 'reward',

    initialState: {
        rewards: [],
    },

    reducers: {
        setRewards(state, action) {
            state.rewards = action.payload
        }
    }
})

const {
    setRewards,
} = rewardStore.actions

const rewardReducer = rewardStore.reducer

const getRewards = (type="") => {
    return async (dispatch) => {
        const res = await request.get(`/api/reward?type=${type}`)
        dispatch(setRewards(res.data))
    }
}

const redeemReward = (reward_id, reward_title, reward_points, user_email) => {
    return async () => {
        const res = await request.patch('/api/reward/redeemReward', { reward_id: reward_id, reward_title: reward_title, reward_points: reward_points, user_email: user_email })
        return res.data
    }
}

const addReward = (rewardData) => {
    return async () => {
        const res = await request.post('/api/reward/addReward', { rewardData: rewardData })
        return res.data
    }
}

const deleteReward = (reward_id) => {
    return async () => {
        const res = await request.delete(`/api/reward/deleteReward?reward_id=${reward_id}`)
        return res.data
    }
}

const updateRewardAvailability = (reward_id, type) => {
    return async () => {
        const res = await request.patch('/api/reward/updateRewardAvailability', { reward_id: reward_id, type: type })
        return res.data
    }
}

const editReward = (reward_id, newInfo) => {
    return async () => {
        const res = await request.put('/api/reward/editReward', { reward_id: reward_id, newInfo: newInfo })
        return res.data
    }
}

export {
    setRewards,
    getRewards,
    redeemReward,
    addReward,
    deleteReward,
    updateRewardAvailability,
    editReward,
}

export default rewardReducer