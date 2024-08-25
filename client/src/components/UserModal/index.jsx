import { Box, Button, Typography, Rating, Modal, Divider, Stack, Popper, Paper } from '@mui/material';
import ManIcon from '@mui/icons-material/Man';
import WomanIcon from '@mui/icons-material/Woman';
import StarIcon from '@mui/icons-material/Star';
import EmailTwoToneIcon from '@mui/icons-material/EmailTwoTone';
import PhoneAndroidTwoToneIcon from '@mui/icons-material/PhoneAndroidTwoTone';
import PersonOffRoundedIcon from '@mui/icons-material/PersonOffRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserInfo } from "../../store/modules/userStore";
import { updateUserStatus, setUserList } from '../../store/modules/adminStore';
import Zoom from 'react-medium-image-zoom'
import Loading from '../Loading';
import AlertMsg from '../AlertMsg';
import 'react-medium-image-zoom/dist/styles.css'
import './index.scss'

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '95%',
    bgcolor: 'background.paper',
    p: 4,
    boxShadow: 'rgba(0, 0, 0, 0.56) 0px 22px 70px 4px',
    borderRadius: '10px',
};

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

function UserModal({ userModal, handleUserModalClose }) {

    const [isLoading, setIsLoading] = useState(true);
    const [openPopper, setOpenPopper] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null);
    const [userDetails, setUserDetails] = useState()
    const [updateUserStatusAction, setUpdateUserStatusAction] = useState('InActivate')
    const [showAlert, setShowAlert] = useState({ alert: false, status: false, msg: '' })
    const [btnDisabled, setBtnDisabled] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const { userList } = useSelector(state => state.admin)
    const dispatch = useDispatch()

    useEffect(() => {
        async function fetchUser() {
            const response = await dispatch(fetchUserInfo(userModal.userInfo.user_email));
            return response
        }

        fetchUser().then((response) => {
            setUserDetails(response);
            setIsLoading(false)
        });

    }, [dispatch, userModal.userInfo.user_email])

    const handleUpdateUserStatus = async (user_email, user_name) => {
        setOpenPopper(false)
        setBtnDisabled(true)
        setIsProcessing(true)
        const response = await dispatch(updateUserStatus(user_email, user_name, updateUserStatusAction))
        setShowAlert(response)
        setIsProcessing(false)
        if (response.status) {
            dispatch(setUserList(
                userList.map((user) => {
                    if (user.user_email === user_email) {
                        return {
                            ...user,
                            user_status: updateUserStatusAction === "InActivate" ? "InActive" : "Active"
                        }
                    }
                    else {
                        return user
                    }
                })
            ))
        }
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setShowAlert(prevAlert => ({ ...prevAlert, alert: false }));
    };

    if (isLoading) {
        return (
            <Loading />
        )
    }

    const user_rating = Math.round(parseFloat(userDetails.user_rating) * 2) / 2

    return (
        <>
            <Modal
                open={userModal.isDisplay}
                onClose={handleUserModalClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Box id="modal-modal-title" display={'flex'} alignItems={'center'} columnGap={'1rem'} >
                        {userModal.Avatar}
                        <Typography fontWeight={'bold'} color={'#5b277b'} fontSize={'larger'}>
                            {userDetails.user_name} {userDetails.user_gender === 'male' ? <ManIcon /> : <WomanIcon />} ({userDetails.user_role})
                        </Typography>
                        {userModal.isAdmin &&
                            <>
                            {userDetails.user_status === "Active" ?
                                <Button startIcon={<PersonOffRoundedIcon />} disabled={btnDisabled} aria-describedby='simple-popper' variant='contained' color='error' sx={{ marginLeft: 'auto' }} onClick={(event) => {
                                    setAnchorEl(event.currentTarget)
                                    setOpenPopper(!openPopper)
                                    setUpdateUserStatusAction('InActivate')
                                }}>
                                    {isProcessing && <span className="spinner"></span>}
                                    Terminate Account
                                </Button>
                                :
                                <Button startIcon={<HowToRegRoundedIcon />} disabled={btnDisabled} aria-describedby='simple-popper' variant='contained' color='success' sx={{ marginLeft: 'auto' }} onClick={(event) => {
                                    setAnchorEl(event.currentTarget)
                                    setOpenPopper(!openPopper)
                                    setUpdateUserStatusAction("Activate")
                                }}>
                                    {isProcessing && <span className="spinner"></span>}
                                    Activate Account
                                </Button>
                            }
                            <Popper id='simple-popper' open={openPopper} anchorEl={anchorEl} placement='right'>
                                <Paper>
                                    <Button
                                        variant='contained'
                                        sx={{ backgroundColor: '#f7a81b', '&:hover': { backgroundColor: '#de9718' } }}
                                        onClick={() => {
                                            handleUpdateUserStatus(userDetails.user_email, userDetails.user_name)
                                        }}
                                    >
                                        Confirm
                                    </Button>
                                </Paper>
                            </Popper>
                            <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleClose} />
                            </>
                        }
                    </Box>
                    <br />

                    <Divider sx={{ borderWidth: 'medium' }} />
                    <br />

                    <Stack spacing={2}>

                        <Box display={'flex'} columnGap={1}>
                            <Typography fontWeight={'bold'}>Email: </Typography>
                            <EmailTwoToneIcon sx={{ color: '#5b277b' }} />
                            <a href={userDetails.user_email} style={{ textDecoration: 'none', color: 'black' }}>{userDetails.user_email}</a>
                        </Box>

                        <Box display={'flex'} columnGap={1}>
                            <Typography fontWeight={'bold'}>Contact No: </Typography>
                            <PhoneAndroidTwoToneIcon sx={{ color: '#5b277b' }} />
                            <a href={`tel:${userDetails.user_contactNo}`} style={{ textDecoration: 'none', color: 'black' }}>{userDetails.user_contactNo}</a>
                        </Box>

                        <Box display={'flex'}>
                            <Typography fontWeight={'bold'}>Rating: </Typography>
                            <Rating
                                name="text-feedback"
                                value={parseFloat(userDetails.user_rating)}
                                readOnly
                                precision={0.1}
                                emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
                            />
                            <Box sx={{ ml: 2 }} color={labels[user_rating][1]} fontWeight={'bold'}> {userDetails.user_rating} {labels[user_rating][0]} <span style={{ color: '#6f8b90' }}> ({userDetails.user_rated} ratings)</span></Box>
                        </Box>

                        <Box>
                            <Typography fontWeight={'bold'}>Experiences: <span style={{ fontWeight: 'normal' }}>{userDetails.user_exp} carpool experiences</span> </Typography>
                        </Box>
                    </Stack>

                    <br />
                    <Divider sx={{ borderWidth: 'medium' }} />
                    <br />

                    {userDetails.user_role === 'Driver' && 
                        <Zoom>
                            <Box display={'flex'} flexDirection={'column'} alignItems={'center'}>
                                <img src={`${process.env.REACT_APP_API_URL}/driverImages/${userDetails.user_email}/vehiclePhoto.jpeg`} alt="Driver's car" loading='lazy' width={'30%'} height={'10%'}></img>
                                <Typography>{userDetails.car_number} {userDetails.car_model} ({userDetails.car_color})</Typography>
                            </Box>
                        </Zoom>
                    }
                </Box>     
            </Modal>
        </>
    );
}

export default UserModal