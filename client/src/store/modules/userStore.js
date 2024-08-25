import { createSlice } from "@reduxjs/toolkit";
import { 
    request, 
    getToken, 
    setToken as _setToken, 
    removeToken,
    getUserEmail,
    setUserEmail as _setUserEmail,
    removeUserEmail,
} from '../../utils'

const userStore = createSlice({
    name: 'user',

    initialState: {
        token: getToken() || '',
        userEmail: getUserEmail() || '',
        userInfo: {},
    },

    reducers: {
        setToken (state, action) {
            state.token = action.payload
            _setToken(action.payload)
        },
        logOut (state) {
            removeToken()
            removeUserEmail()
            state.token = ''
            state.userEmail = ''
            state.userInfo = {}
        },
        setUserEmail (state, action) {
            state.userEmail = action.payload
            _setUserEmail(action.payload)
        },
        setUserInfo (state, action) {
            state.userInfo = action.payload
        }
    }
})

const { setToken, logOut, setUserEmail, setUserInfo } = userStore.actions

const userReducer = userStore.reducer

const Login = (loginForm) => {
    return async (dispatch) => {
        const res = await request.post('/login', { loginForm: loginForm })
        if (res.data.status) {
            dispatch(setToken(res.data.token))
            dispatch(setUserEmail(res.data.user_email))
        }
        return res.data
    }
}

const Register = (registerForm) => {
    return async () => {
        const res = await request.post('/register', { registerForm: registerForm })
        return res.data
    }
}

const sendOTP = (userEmail) => {
    return async () => {
        const res = await request.post(`/sendOTP`, {userEmail: userEmail})
        return res.data
    }
}

const fetchUserInfo = (user_email) => {
    return async (dispatch) => {
        const res = await request.get(`/fetchUserInfo?user_email=${user_email}`)
        if (user_email === getUserEmail()) {
            dispatch(setUserInfo(res.data))
        }
        return res.data
    }
}

const checkAccessForRating = (carpool_id, user_email, uuid) => {
    return async () => {
        const res = await request.get(`/checkAccessForRating?carpool_id=${carpool_id}&user_email=${user_email}&uuid=${uuid}`)
        return res.data
    }
}

const submitRatings = (ratings, carpool_id, user_email, uuid) => {
    return async () => {
        const res = await request.post('/submitRatings', {ratings: ratings, carpool_id: carpool_id, user_email: user_email, uuid: uuid})
        return res.data
    }
}

const updatePhoneNum = (new_phoneNum, user_email) => {
    return async () => {
        const res = await request.post('/updatePhoneNum', { new_phoneNum: new_phoneNum, user_email: user_email })
        return res.data
    }
}

const requestBecomeDriver = (requestForm) => {
    return async () => {
        const res = await request.post('/requestBecomeDriver', { requestForm: requestForm })
        return res.data
    }
}

const getBecomeDriverReqStatus = (user_email) => {
    return async () => {
        const res = await request.get(`/getBecomeDriverReqStatus?user_email=${user_email}`)
        return res.data
    }
}

const updateDriverInfo = (requestForm) => {
    return async () => {
        const res = await request.post('/updateDriverInfo', { requestForm: requestForm })
        return res.data
    }
}

const sendResetPasswordEmail = (user_email) => {
    return async () => {
        const res = await request.post('/sendResetPasswordEmail', { user_email: user_email })
        return res.data
    }
}

const checkResetPasswordAccessibility = (user_email, uuid) => {
    return async () => {
        const res = await request.get(`/checkResetPasswordAccessibility?user_email=${user_email}&uuid=${uuid}`)
        return res.data
    }
}

const resetPassword = (user_email, form_passwords) => {
    return async () => {
        const res = await request.post('/resetPassword', { user_email: user_email, form_passwords: form_passwords })
        return res.data
    }
}

export { 
    Login, 
    Register, 
    sendOTP,
    fetchUserInfo,
    checkAccessForRating,
    submitRatings,
    updatePhoneNum,
    requestBecomeDriver,
    getBecomeDriverReqStatus,
    updateDriverInfo,
    sendResetPasswordEmail,
    checkResetPasswordAccessibility,
    resetPassword,
    setToken, 
    logOut, 
    setUserEmail,
    setUserInfo,
}

export default userReducer