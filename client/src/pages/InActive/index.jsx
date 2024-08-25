import { Box, Alert, AlertTitle, Typography, Stack } from "@mui/material"
import { Link, Navigate } from 'react-router-dom'
import { useDispatch } from 'react-redux';
import { logOut } from '../../store/modules/userStore';
import Footer from "../../components/Footer"

const InActive = ({ userInfo }) => {

    const dispatch = useDispatch()

    if (userInfo) {
        return (
            <Box display={'flex'} flexDirection={'column'} width={'100%'} height={'100%'} justifyContent={'space-between'}>
                <Box width={'100%'} height={'80%'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                    <Stack width={'70%'} boxShadow={'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px;'} padding={2}>
                        <Alert severity="error">
                            <AlertTitle sx={{ fontWeight: 'bold' }}>Account Termination Notice.</AlertTitle>
                        </Alert>
                        <Box>
                            <br />
                            <Typography>Dear {userInfo.user_name},</Typography>
                            <br />
                            <Typography textAlign={'justify'}>
                                We regret to inform you that your account has been terminated by the administrator.
                                If you have any inquiries or wish to discuss this further,
                                please feel free to reach out to us at <a href="mailto:chongminghong34@gmail.com">Admin's email</a>.
                                We appreciate your understanding.
                            </Typography>
                            <br />
                            <Typography>Sincerely,</Typography>
                            <Typography fontStyle={'italic'} fontWeight={'bold'} sx={{ color: '#5b277b' }}>UniCarpool</Typography>
                            <br />
                            <Box display={'flex'} justifyContent={'center'}>
                                <Link to="/" style={{ textDecoration: 'none', borderRadius: '5px', backgroundColor: '#ff9800', color: 'white', padding: '5px 10px 5px 10px' }} onClick={() => dispatch(logOut())}>Back to Login Page</Link>
                            </Box>
                        </Box>
                    </Stack>
                </Box>
                <Footer />
            </Box>
        )
    }
    else {
        return <Navigate to={'/home'} replace/>
    }
}

export default InActive