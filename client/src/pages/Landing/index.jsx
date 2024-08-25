import './index.scss'
import landingImage from '../../assets/landing.svg'
import { useState, useRef } from 'react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Footer from '../../components/Footer'
import { Stepper, Box, Step, StepLabel } from '@mui/material'

const steps = [
    'Register/Login an account',
    'Post/Join a carpool',
    'Connect with your carpool members',
    'Embark on your carpool adventure',
];

function Landing() {
    const [showLoginForm, setShowLoginForm] = useState(true)
    const authenticationRef = useRef(null)

    const scrollToAuthentication = () => {
        if (authenticationRef.current) {
            authenticationRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }

    return (
        <>
            <div className="main">
                <section className="header-container">
                    <h1>
                        UniCarpool
                    </h1>

                    <img src={landingImage} alt="carpool" />

                    <div className="header-desc">

                        <div className="header-subtitle">
                            Are you a college student looking for an efficient, affordable, and eco-friendly way to get around campus
                            and beyond?
                            Look no further than UniCarpool, your ultimate carpooling solution designed exclusively for the college
                            community.
                        </div>

                        <button onClick={scrollToAuthentication}>
                            Get started
                        </button>
                    </div>
                </section>

                <Box sx={{ width: '100%' }}>
                    <h1 className='steps'>Steps to start using UniCarpool</h1>
                    <Stepper activeStep={-1} alternativeLabel>
                        {steps.map((label) => (
                            <Step key={label} active={true}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>

                <section className="authentication" ref={authenticationRef}>
                    <h1>Let's try UniCarpool !</h1>
                    <div className='toggle-form'>
                        <button onClick={() => setShowLoginForm(!showLoginForm)}>
                            { showLoginForm ? 'Switch to Register' : 'Swicth to Login'}
                        </button>
                    </div>
                    { showLoginForm ? <LoginForm /> : <RegisterForm /> }
                </section>
            </div>
            <Footer />
        </>
    )
}

export default Landing