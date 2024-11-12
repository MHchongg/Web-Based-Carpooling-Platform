import { useState } from "react"
import { useDispatch } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { Box, Button, Stack, Typography } from "@mui/material"
import { styled } from '@mui/material/styles';
import { orange } from '@mui/material/colors';
import Footer from '../../components/Footer'
import AlertMsg from '../../components/AlertMsg';
import { forgotPassword } from "../../store/modules/userStore";
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

const emailRegex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/

const ForgotPassword = () => {

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [emailAddress, setEmailAddress] = useState('')
    const [showAlert, setShowAlert] = useState({ alert: false, status: false, msg: '' })
    const [btnDisabled, setBtnDisabled] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setShowAlert(prevAlert => ({ ...prevAlert, alert: false }));
    };

    const continueResetPassword = async () => {
        if (emailRegex.test(emailAddress)) {
            setBtnDisabled(true)
            setIsProcessing(true)
            const response = await dispatch(forgotPassword(emailAddress))
            setShowAlert(response)
            setIsProcessing(false)
        }
        else {
            setShowAlert({ alert: true, status: false, msg: 'Invalid email address' })
        }
    }

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
                            Enter your email address and we will send you instructions to reset your password.
                        </Typography>

                        <div>
                            <div className="input-group">
                                <input className="input-cal input-base" id="input" placeholder="" type="email" onChange={(event) => setEmailAddress(event.target.value)} required />
                                <label id="label-input">Email address*</label>
                            </div>
                        </div>

                        <Box display={'flex'} justifyContent={'space-around'}>
                            <MyButton sx={{ width: '35%' }} disabled={btnDisabled} variant="contained" onClick={continueResetPassword}>{isProcessing && <span className="spinner"></span>}Send email</MyButton>
                            <MyButton sx={{ width: '35%' }} onClick={() => navigate(-1)}>Back</MyButton>
                        </Box>
                    </Stack>
                </Stack>
            </Box>

            <Footer />
            <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleClose} />
        </Box>
    )
}

export default ForgotPassword