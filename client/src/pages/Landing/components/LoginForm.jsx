import * as React from 'react';
import EmailIcon from '@mui/icons-material/Email';
import PasswordIcon from '@mui/icons-material/Password';
import { orange } from '@mui/material/colors';
import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { Login } from '../../../store/modules/userStore';
import { useNavigate, Link } from 'react-router-dom'
import AlertMsg from '../../../components/AlertMsg';

function LoginForm() {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [showAlert, setShowAlert] = useState({ alert: false, status: true, msg: '' })

    const handleInputChange = async (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value })
    };

    const handleLogin = async (event) => {
        event.preventDefault()
        const response = await dispatch(Login(formData))
        setShowAlert(response)
        if (response.status && (response.user_role === 'Driver' || response.user_role === 'Student')) {
            navigate('/home')
        }
        else if (response.status && response.user_role === 'Admin') {
            navigate('/adminHome')
        }
        else {
            navigate('/')
        }
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setShowAlert(prevAlert => ({ ...prevAlert, alert: false }))
    };

    return (
        <form className="authentication-form" onSubmit={handleLogin}>
            <p>Log In</p>

            <label htmlFor="email"><EmailIcon sx={{ color: orange[500] }} /> Email:</label>
            <input type="email" id="email" name="email" placeholder="Your email e.g example@gmail.com" autoComplete='email@email.com' onChange={handleInputChange} required /><br />

            <label htmlFor="password"><PasswordIcon sx={{ color: orange[500] }} /> Password:</label>
            <input type="password" id="password" name="password" placeholder="Your password" autoComplete="current-password" onChange={handleInputChange} required /><br />

            <div style={{ width: '100%', textAlign: 'right' }}>
                <Link to="/forgotPassword" style={{ fontWeight: 'bold', color: '#5b277b' }}>Forgot password?</Link>
            </div>

            <div className="actions">
                <input type="submit" value="Login" />
                <input type="reset" value="Clear" />
            </div>

            <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleClose} />
        </form>
    )
}

export default LoginForm