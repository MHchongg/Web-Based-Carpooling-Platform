import * as React from 'react';
import EmailIcon from '@mui/icons-material/Email';
import PasswordIcon from '@mui/icons-material/Password';
import PersonIcon from '@mui/icons-material/Person';
import CallIcon from '@mui/icons-material/Call';
import WcIcon from '@mui/icons-material/Wc';
import PinIcon from '@mui/icons-material/Pin';
import { orange } from '@mui/material/colors';
import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { Register, sendOTP } from '../../../store/modules/userStore';
import AlertMsg from '../../../components/AlertMsg';
import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const OTPButton = styled(Button)(({ theme }) => ({
    backgroundColor: orange[500],
    '&:hover': {
        backgroundColor: orange[700],
    },
}));

const emailRegex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/

function RegisterForm() {
    const dispatch = useDispatch()

    const [formData, setFormData] = useState({
        name: '',
        gender: 'male',
        email: '',
        contactNo: '',
        password: '',
        confirmPassword: '',
        otp: '',
    });

    const [isOTPDisabled, setIsOTPDisabled] = useState(false)
    const [OTPbuttonText, setOTPButtonText] = useState("Send OTP");

    const disableOTPButton = () => {
        setIsOTPDisabled(true);
        setOTPButtonText("OTP is valid for 1 minute");
        setTimeout(() => {
            setIsOTPDisabled(false);
            setOTPButtonText("Send OTP");
        }, 60000); // current is 10 seconds, should be 60000 (1 minute)
    };

    const [showAlert, setShowAlert] = useState({ alert: false, status: false, msg: 'haha' })

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleRegister = async (event) => {
        event.preventDefault()
        const response = await dispatch(Register(formData))

        setShowAlert(response)
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setShowAlert(prevAlert => ({ ...prevAlert, alert: false }));
    };

    const handleOTP = async (email) => {
        if (emailRegex.test(email)) {
            disableOTPButton()
            const response = await dispatch(sendOTP(email))
            setShowAlert(response)

            if (!response.status) {
                setIsOTPDisabled(false)
                setOTPButtonText("Send OTP")
            }
        }
        else {
            setShowAlert({ alert: true, status: false, msg: 'Please input valid email address' })
        }
    }

    return (
        <form className="authentication-form" onSubmit={handleRegister}>
            <p>Register</p>

            <label htmlFor="name"><PersonIcon sx={{ color: orange[500] }} />Full Name:</label>
            <input type="text" id="name" name="name" placeholder="Your full name (e.g. John Doe)" autoComplete='name' onChange={handleInputChange} required /><br />

            <p className='label'><WcIcon sx={{ color: orange[500] }} /> Gender:</p>
            <div className='gender-options'>
                <div>
                    <input type="radio" id="male" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleInputChange} />
                    <label htmlFor='male'>Male</label><br />
                </div>

                <div>
                    <input type="radio" id="female" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleInputChange} />
                    <label htmlFor='female'>Female</label><br />
                </div>
            </div>

            <label htmlFor="email"><EmailIcon sx={{ color: orange[500] }} /> Email:</label>
            <input type="email" id="email" name="email" placeholder="Your email e.g. example@gmail.com" autoComplete='email@email.com' onChange={handleInputChange} required /><br />

            <label><CallIcon sx={{ color: orange[500] }} /> Contact Number:</label>
            <PhoneInput international countryCallingCodeEditable={false} placeholder='Enter your phone number' defaultCountry="MY" value={formData.contactNo} onChange={(value) => setFormData({ ...formData, contactNo: value })} /><br />

            <label htmlFor="password"><PasswordIcon sx={{ color: orange[500] }} /> Password:</label>
            <input type="password" id="password" name="password" placeholder="Your password" minLength={8} autoComplete="current-password" onChange={handleInputChange} required /><br />

            <label htmlFor="confirmPassword"><PasswordIcon sx={{ color: orange[500] }} /> Confirm Password:</label>
            <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm your password" minLength={8} autoComplete="current-password" onChange={handleInputChange} required /><br />

            <label htmlFor="otp"><PinIcon sx={{ color: orange[500] }} /> Email OTP: <OTPButton variant="contained" sx={{ color: "white", fontWeight: "bold" }} onClick={() => handleOTP(formData.email)} disabled={isOTPDisabled}>{OTPbuttonText}{isOTPDisabled && <span className="spinner"></span>}</OTPButton></label>
            <input type="text" id="otp" name="otp" placeholder="6 digit OTP" minLength={6} maxLength={6} onChange={handleInputChange} required /><br />

            <div className="actions">
                <input type="submit" value="Register" />
                <input type="reset" value="Clear" />
            </div>

            <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleClose} />
        </form>
    )
}

export default RegisterForm