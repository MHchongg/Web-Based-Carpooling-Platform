import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"
import { Box, Button, Stack, Typography } from "@mui/material"
import { styled } from '@mui/material/styles';
import { orange } from '@mui/material/colors';
import Footer from '../../components/Footer'
import AlertMsg from '../../components/AlertMsg';
import Loading from "../../components/Loading";
import NotFound from "../../components/NotFound";
import { checkResetPasswordAccessibility, resetPassword } from "../../store/modules/userStore"
import "./index.scss"

const MyButton = styled(Button)(({ theme }) => ({
    backgroundColor: orange[500],
    color: 'white',
    '&:hover': {
        backgroundColor: orange[700],
    },
    '&:disabled': {
        backgroundColor: "#ccc",
    }
}));

const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/

const ResetPassword = () => {

    const params = useParams()
    const dispatch = useDispatch()

    const [showAlert, setShowAlert] = useState({ alert: false, status: false, msg: '' })
    const [formPasswords, setFormPasswords] = useState({ password: '', confirmPassword: '' })
    const [btnDisabled, setBtnDisabled] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [accessibility, setAccessibility] = useState(false)

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setShowAlert(prevAlert => ({ ...prevAlert, alert: false }));
    };

    const handlePasswordsChange = (event) => {
        const { name, value } = event.target
        setFormPasswords({
            ...formPasswords,
            [name]: value,
        })
    }

    const handleResetPassword = async (event) => {
        event.preventDefault()

        if (formPasswords["password"] !== formPasswords["confirmPassword"]) {
            setShowAlert({ alert: true, status: false, msg: 'Password and Confirm Password must match' })
        }
        else if (!pwdRegex.test(formPasswords["confirmPassword"])) {
            setShowAlert({ alert: true, status: false, msg: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number' })
        }
        else {
            setBtnDisabled(true)
            setIsProcessing(true)
            const response = await dispatch(resetPassword(params.user_email, formPasswords))
            setShowAlert(response)
            setIsProcessing(false)
        }
    }

    useEffect(() => {
        const checkAccessibility = async () => {
            const response = await dispatch(checkResetPasswordAccessibility(params.user_email, params.uuid))
            setAccessibility(response)
            setIsLoading(false)
        }
        checkAccessibility()
    }, [dispatch, params.user_email, params.uuid])

    if (isLoading) {
        return <Loading />
    }

    if (accessibility) {
        return (
            <Box height={'100%'} display={'flex'} flexDirection={'column'} justifyContent={'space-between'}>
                <Box width={'100%'} display={'flex'} justifyContent={'center'}>
                    <Stack width={'90%'} spacing={20} alignItems={'center'}>
                        <Typography textAlign={'center'} fontSize={40} fontWeight={'bold'} fontStyle={'italic'} sx={{ color: '#5b277b' }}>
                            UniCarpool
                        </Typography>

                        <Stack spacing={2}>
                            <Typography variant="h5" fontWeight={'bold'} textAlign={'center'}>Reset your password</Typography>

                            <Typography textAlign={'center'}>
                                Enter a new password below to change your password.
                            </Typography>

                            <form style={{ display: 'flex', flexDirection: 'column', rowGap: '10px' }} onSubmit={handleResetPassword}>
                                <div style={{ display: 'none' }}>
                                    <input id="user-email" name="user-email" className="input-cal input-base input" placeholder="" type="text" autoComplete="user-email" hidden />
                                    <label htmlFor="user-email" className="label-input">User email</label>
                                </div>

                                <div className="input-group">
                                    <input id="password" name="password" className="input-cal input-base input" placeholder="" type="password" autoComplete="new-password" required onChange={handlePasswordsChange} />
                                    <label htmlFor="password" className="label-input">New password*</label>
                                </div>

                                <div className="input-group">
                                    <input id="confirmPassword" name="confirmPassword" className="input-cal input-base input" placeholder="" type="password" autoComplete="new-reenter-password" required onChange={handlePasswordsChange} />
                                    <label htmlFor="confirmPassword" className="label-input">Confirm new password*</label>
                                </div>

                                <Box display={'flex'} justifyContent={'space-around'}>
                                    <MyButton sx={{ width: "40%" }} type="submit" disabled={btnDisabled}>{isProcessing && <span className="spinner"></span>}Reset password</MyButton>
                                    <MyButton sx={{ width: '40%' }} type="reset">Clear</MyButton>
                                </Box>
                            </form>
                        </Stack>
                    </Stack>
                </Box>
                <Footer />
                <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleClose} />
            </Box>
        )
    }
    else {
        return <NotFound />
    }
}

export default ResetPassword