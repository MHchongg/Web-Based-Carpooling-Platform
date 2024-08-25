import { Avatar, Box, Typography, Rating, Divider, Stack, IconButton } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux'
import { useState, useRef } from 'react';
import StarIcon from '@mui/icons-material/Star';
import Man2RoundedIcon from '@mui/icons-material/Man2Rounded';
import Woman2RoundedIcon from '@mui/icons-material/Woman2Rounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import ContactPhoneTwoToneIcon from '@mui/icons-material/ContactPhoneTwoTone';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import RedeemTwoToneIcon from '@mui/icons-material/RedeemTwoTone';
import CommuteRoundedIcon from '@mui/icons-material/CommuteRounded';
import ThumbsUpDownRoundedIcon from '@mui/icons-material/ThumbsUpDownRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CheckBoxRoundedIcon from '@mui/icons-material/CheckBoxRounded';
import DisabledByDefaultRoundedIcon from '@mui/icons-material/DisabledByDefaultRounded';
import PhoneInput from 'react-phone-number-input'
import AlertMsg from '../../components/AlertMsg';
import Loading from "../../components/Loading";
import './index.scss'
import { updatePhoneNum, setUserInfo } from '../../store/modules/userStore';
import { stringAvatar } from '../../utils';

const labels = {
    0.0: ['Useless', '#e43e3d'],
    0.5: ['Terrible', '#e7313e'],
    1: ['Terrible+', '#fe6d55'],
    1.5: ['Poor', '#ff8641'],
    2: ['Poor+', '#ffa834'],
    2.5: ['Ok', '#fec825'],
    3: ['Ok+', '#fde424'],
    3.5: ['Good', '#d8dc3d'],
    4: ['Good+', '#acd45a'],
    4.5: ['Excellent', '#87d275'],
    5: ['Excellent+', '#56cd8b'],
};

const Profile = () => {

    const { userInfo } = useSelector(state => state.user)
    
    const dispatch = useDispatch()
    const phoneNumRef = useRef(null)

    const user_rating = Math.round(parseFloat(userInfo.user_rating) * 2) / 2

    const [readOnlyPhoneNum, setReadOnlyPhoneNum] = useState(true)
    const [phoneNum, setPhoneNum] = useState('')
    const [displayEditBtn, setDisplayEditBtn] = useState('block')
    const [displayActionBtn, setDisplayActionBtn] = useState('none')
    const [showAlert, setShowAlert] = useState({ alert: false, status: false, msg: '' })

    const handleEditPhoneNum = () => {
        setReadOnlyPhoneNum(false)
        setDisplayEditBtn('none')
        setDisplayActionBtn('block')
        phoneNumRef.current.focus()
    }

    const handleUpdatePhoneNum = async () => {

        if (phoneNum === userInfo.user_contactNo) {
            setShowAlert({ alert: true, status: false, msg: 'Same phone number as previous'})
        }
        else {
            const response = await dispatch(updatePhoneNum(phoneNum, userInfo.user_email))
            setDisplayActionBtn('none')
            setDisplayEditBtn('block')
            setReadOnlyPhoneNum(true)
            setShowAlert(response)

            if (response.status) {
                dispatch(setUserInfo({
                    ...userInfo,
                    user_contactNo: phoneNum
                }))
            }
            else {
                setPhoneNum(userInfo.user_contactNo)
            }
        }
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setShowAlert(prevAlert => ({ ...prevAlert, alert: false }));
    };

    if (!userInfo.user_name) {
        return <Loading />
    }

    return (
        <Box width={'100%'} display={'flex'} justifyContent={'center'}>
            <Box id="profile-container">
                <h1 style={{ color: '#ff9800', textAlign: 'center', padding: '1.5rem 0 1.5rem 0' }}>Profile Info</h1>

                <Box id="basic-info-container">
                    <Box>
                        <Typography sx={{ color: '#5b277b', fontSize: '2rem', fontWeight: 'bold' }}>{userInfo.user_name}</Typography>
                        <Typography className='general-font'>
                            {userInfo.user_gender === 'male' ? <Man2RoundedIcon /> : <Woman2RoundedIcon />}
                            {userInfo.user_gender}
                        </Typography>
                    </Box>
                    <Avatar {...stringAvatar(userInfo.user_name, { height: 110, width: 110, fontSize: '3rem', boxShadow: 'rgba(14, 30, 37, 0.12) 0px 2px 4px 0px, rgba(14, 30, 37, 0.32) 0px 2px 16px 0px;'})} />
                </Box>

                <Stack spacing={1} marginTop={4} marginBottom={4}>
                    <Typography className='general-font'>
                        <CategoryRoundedIcon /> User Role: {userInfo.user_role}
                    </Typography>

                    <Typography className='general-font'>
                        <CommuteRoundedIcon /> Carpool Experiences: {userInfo.user_exp} times
                    </Typography>

                    <Box display={'flex'} columnGap={1} alignItems={'center'} flexWrap={'wrap'}>
                        <Typography className='general-font'>
                            <ThumbsUpDownRoundedIcon /> Rating: 
                        </Typography>
                        <Rating
                            name="text-feedback"
                            value={parseFloat(userInfo.user_rating)}
                            readOnly
                            precision={0.1}
                            emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                        />
                        <Box color={labels[user_rating][1]} fontWeight={'bold'}> {userInfo.user_rating} {labels[user_rating][0]} <span style={{ color: '#6f8b90' }}> ({userInfo.user_rated} ratings)</span></Box>
                    </Box>
                </Stack>

                <Divider sx={{ borderWidth: 'thick', borderRadius: '10px' }} />

                <Stack spacing={3} marginTop={4} marginBottom={4}>
                    <Typography sx={{ color: '#5b277b', fontSize: '2rem', fontWeight: 'bold' }}>Contact Info</Typography>

                    <Typography className='general-font'>
                        <EmailRoundedIcon /> Email: {userInfo.user_email}
                    </Typography>

                    <Box className='general-font'>
                        <ContactPhoneTwoToneIcon /> Contact Number:
                        <PhoneInput 
                            international 
                            countryCallingCodeEditable={false} 
                            placeholder='Enter your phone number' 
                            defaultCountry="MY" 
                            value={phoneNum ? phoneNum : userInfo.user_contactNo} 
                            readOnly={readOnlyPhoneNum}
                            onChange={setPhoneNum}
                            ref={phoneNumRef}
                        />

                        <IconButton 
                            aria-label="edit phone number" 
                            size="medium"
                            onClick={handleEditPhoneNum}
                            sx={{ display: displayEditBtn }}
                        >
                            <EditRoundedIcon fontSize="inherit" />
                        </IconButton>

                        <Box display={displayActionBtn}>
                            <IconButton
                                aria-label='update phone number'
                                size='medium'
                                onClick={handleUpdatePhoneNum}
                            >
                                <CheckBoxRoundedIcon fontSize='inherit' sx={{ color: '#00c851' }} />
                            </IconButton>

                            <IconButton
                                aria-label='cancel'
                                size='medium'
                                onClick={() => {
                                    setPhoneNum(userInfo.user_contactNo)
                                    setDisplayActionBtn('none')
                                    setDisplayEditBtn('block')
                                    setReadOnlyPhoneNum(true)
                                }}
                            >
                                <DisabledByDefaultRoundedIcon fontSize='inherit' sx={{ color: '#ff4444' }} />
                            </IconButton>
                        </Box>

                    </Box>
                </Stack>

                <Divider sx={{ borderWidth: 'thick', borderRadius: '10px' }} />

                <Stack spacing={2} marginTop={4} marginBottom={4}>
                    <Typography sx={{ color: '#5b277b', fontSize: '2rem', fontWeight: 'bold' }}>Others</Typography>

                    <Typography className='general-font'>
                        <RedeemTwoToneIcon /> Points: {userInfo.user_point} points
                    </Typography>
                </Stack>

                <Divider sx={{ borderWidth: 'thick', borderRadius: '10px', marginBottom: '2rem' }} />

            </Box>

            <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleClose} />
        </Box>
    )
}

export default Profile