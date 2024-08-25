import { getToken, getUserEmail } from "../../utils"
import { Navigate } from "react-router-dom"

export function AuthUser ({ children }) {
    const token = getToken()
    const userEmail = getUserEmail()

    if (token && userEmail) {
        return <>{ children }</>
    }
    else {
        return <Navigate to={'/'} replace />
    }
}