import { Avatar } from "@mui/material"
import UserModal from "../UserModal";
import { useState } from "react";
import { stringAvatar } from "../../utils";

const UserAvatar = ({ user_email, user_name }) => {

    const [userModal, setUserModal] = useState({ isDisplay: false, isAdmin: false, userInfo: {}, Avatar: <></> })

    const handleUserModalClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setUserModal({ isDisplay: false, isAdmin: false, userInfo: {}, Avatar: <></> })
    };

    return (
        <>
            <button
                className='avatar-btn'
                onClick={() => setUserModal({
                    isDisplay: true,
                    isAdmin: false,
                    userInfo: {
                        user_email: user_email,
                        user_name: user_name,
                    },
                    Avatar: <Avatar {...stringAvatar(user_name)} />
                })}
            >
                <Avatar {...stringAvatar(user_name)} />
            </button>
            {userModal.isDisplay && <UserModal userModal={userModal} handleUserModalClose={handleUserModalClose} />}
        </>
    )
}

export default UserAvatar