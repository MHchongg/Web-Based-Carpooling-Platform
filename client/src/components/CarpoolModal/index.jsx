import { Modal, Box, Typography, Stack, Badge, Button, Alert } from "@mui/material"
import Map from "../Map"
import { orange } from '@mui/material/colors';
import { useState, useEffect } from "react";
import { getCarpoolMembers, requestToJoinCarpool, updateJoinRequest, exitCarpool, formCarpool, updateCarpoolStatus, setCarpoolList } from "../../store/modules/carpoolStore";
import { useDispatch, useSelector } from "react-redux";
import Loading from "../Loading";
import AlertMsg from "../AlertMsg";
import MyDialog from '../MyDialog';
import UserAvatar from "../UserAvatar";
import GroupAddTwoToneIcon from '@mui/icons-material/GroupAddTwoTone';
import GroupRemoveTwoToneIcon from '@mui/icons-material/GroupRemoveTwoTone';
import Diversity3TwoToneIcon from '@mui/icons-material/Diversity3TwoTone';
import NavigationTwoToneIcon from '@mui/icons-material/NavigationTwoTone';
import WhereToVoteTwoToneIcon from '@mui/icons-material/WhereToVoteTwoTone';
import { styled } from '@mui/material/styles';
import "./index.scss"

const MyButton = styled(Button)(({ theme }) => ({
    backgroundColor: orange[500],
    '&:hover': {
        backgroundColor: orange[700],
    },
}));

const StartEndButton = styled(Button)(({ theme }) => ({
    backgroundColor: '#5b277b',
    '&:hover': {
        backgroundColor: '#431C5A',
    },
}));

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '48%',
    transform: 'translate(-50%, -50%)',
    width: '95%',
    overflowY: 'scroll',
    bgcolor: 'background.paper',
    p: 4,
    boxShadow: 'rgba(0, 0, 0, 0.56) 0px 22px 70px 4px',
    borderRadius: '10px',
};

const requestStatusColor = {
    'Pending': '#e7b416',
    'Accept': '#2dc937',
    'Reject': '#cc3232'
}

const CarpoolModal = ({ carpoolModal, handleCarpoolModalClose }) => {

    const dispatch = useDispatch()
    const [isLoading, setIsLoading] = useState(true);
    const [members, setMembers] = useState()
    const [showAlert, setShowAlert] = useState({ alert: false, status: true, msg: '' })
    const { userInfo } = useSelector(state => state.user)
    const { carpoolList } = useSelector(state => state.carpool)
    const [acceptReject, setAcceptReject] = useState('Accept')
    const [btnDisabled, setBtnDisable] = useState(false)
    const [isBtnProcess, setIsBtnProcess] = useState(false)

    useEffect(() => {
        async function fetchMembers() {
            const response = await dispatch(getCarpoolMembers(carpoolModal.carpoolInfo.carpool.carpool_id));
            return response
        }

        if (carpoolModal.carpoolInfo.carpool.carpool_id !== 0) {
            fetchMembers().then((response) => {
                if (response.length > 0) {
                    setMembers(response);
                    setIsLoading(false)
                }
                else {
                    window.location.reload()
                }
            });
        }
        else {
            setIsLoading(false)
        }

    }, [dispatch, carpoolModal.carpoolInfo.carpool.carpool_id])

    const requestToJoin = async () => {
        setBtnDisable(true)
        setIsBtnProcess(true)
        setMyDialog({ isShow: false, title: '', content: '' })

        const driver_email = members.filter((member) => {
            return member.isDriver
        })[0].member_email

        const response = await dispatch(requestToJoinCarpool(
            carpoolModal.carpoolInfo.carpool,
            userInfo.user_email,
            userInfo.user_name,
            driver_email
        ))

        setIsBtnProcess(false)
        setShowAlert(response)
    }

    const handleAlertClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setShowAlert(prevAlert => ({ ...prevAlert, alert: false }))
    };

    const [myDialog, setMyDialog] = useState({ isShow: false, title: '', content: '' })

    const handleMyDialogClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setMyDialog({ isShow: false, title: '', content: '' })
    };

    const handleJoinRequests = async () => {
        setBtnDisable(true)
        setIsBtnProcess(true)
        setMyDialog({ isShow: false, title: '', content: '' })

        const response = await dispatch(updateJoinRequest(
            carpoolModal.carpoolInfo.myCarpoolJoinRequests[carpoolModal.carpoolInfo.index].request_id,
            carpoolModal.carpoolInfo.carpool,
            carpoolModal.carpoolInfo.myCarpoolJoinRequests[carpoolModal.carpoolInfo.index].user_email,
            carpoolModal.carpoolInfo.myCarpoolJoinRequests[carpoolModal.carpoolInfo.index].user_name,
            acceptReject,
        ))

        setIsBtnProcess(false)
        setShowAlert(response)
    }

    const handleExitCarpool = async () => {
        setBtnDisable(true)
        setIsBtnProcess(true)
        setMyDialog({ isShow: false, title: '', content: '' })

        const driver = members.filter((member) => {
            return member.isDriver
        })

        let driver_email = null

        if (driver.length > 0) {
            driver_email = driver[0].member_email
        }

        const response = await dispatch(exitCarpool(userInfo.user_email, carpoolModal.carpoolInfo.carpool, driver_email))

        setIsBtnProcess(false)
        setShowAlert(response)
    }

    const formCarpoolFromStuReq = async () => {
        setBtnDisable(true)
        setIsBtnProcess(true)
        setMyDialog({ isShow: false, title: '', content: '' })

        const member_email = members[0].member_email

        const response = await dispatch(formCarpool(carpoolModal.carpoolInfo.carpool, userInfo.user_email, userInfo.user_name, member_email))

        setIsBtnProcess(false)
        setShowAlert(response)
    }

    const [carpoolStatus, setCarpoolStatus] = useState('available')
    const [isStarting, setIsStarting] = useState(false)
    const [isEnding, setIsEnding] = useState(false)
    const [isStartBtnDisabled, setIsStartBtnDisabled] = useState(carpoolModal.carpoolInfo.carpool.carpool_status === 'InProgress' || carpoolModal.carpoolInfo.carpool.carpool_status === 'End')
    const [startBtnText, setStartBtnText] = useState(carpoolModal.carpoolInfo.carpool.carpool_status === 'InProgress' ? 'Departed' : 'Depart');
    const [isEndBtnDisabled, setIsEndBtnDisabled] = useState(carpoolModal.carpoolInfo.carpool.carpool_status === 'End' || carpoolModal.carpoolInfo.carpool.carpool_status === 'available' || carpoolModal.carpoolInfo.carpool.carpool_status === 'full')
    const [endBtnText, setEndBtnText] = useState(carpoolModal.carpoolInfo.carpool_status === 'End' ? 'Ended' : 'End');

    const startEndCarpool = async () => {
        const members_email = members.map(member => member.member_email)
        let response;

        setMyDialog({ isShow: false, title: '', content: '' })

        if (carpoolStatus === 'InProgress') {
            setIsStartBtnDisabled(true);
            setIsStarting(true)
            setStartBtnText("Starting");
            response = await dispatch(updateCarpoolStatus(carpoolModal.carpoolInfo.carpool.carpool_id, carpoolModal.carpoolInfo.carpool.carpool_title, carpoolModal.carpoolInfo.carpool.carpool_from, carpoolModal.carpoolInfo.carpool.carpool_to, carpoolModal.carpoolInfo.carpool.carpool_dateTime, members_email, carpoolStatus))
            setStartBtnText("Departed");
            setIsStarting(false)
            setIsEndBtnDisabled(false)
            setShowAlert(response)
            if (response.status) {
                dispatch(setCarpoolList(
                    carpoolList.map((carpool) => {
                        if (carpool.carpool_id === carpoolModal.carpoolInfo.carpool.carpool_id) {
                            return {
                                ...carpool,
                                carpool_status: "InProgress"
                            }
                        }
                        else {
                            return carpool
                        }
                    })
                ))
            }
        }
        else {
            setIsEndBtnDisabled(true);
            setIsEnding(true)
            setEndBtnText("Ending");
            response = await dispatch(updateCarpoolStatus(carpoolModal.carpoolInfo.carpool.carpool_id, carpoolModal.carpoolInfo.carpool.carpool_title, carpoolModal.carpoolInfo.carpool.carpool_from, carpoolModal.carpoolInfo.carpool.carpool_to, carpoolModal.carpoolInfo.carpool.carpool_dateTime, members_email, carpoolStatus))
            setEndBtnText("End");
            setIsEnding(false)
            setShowAlert(response)
            if (response.status) {
                dispatch(setCarpoolList(
                    carpoolList.map((carpool) => {
                        if (carpool.carpool_id === carpoolModal.carpoolInfo.carpool.carpool_id) {
                            return {
                                ...carpool,
                                carpool_status: "End"
                            }
                        }
                        else {
                            return carpool
                        }
                    })
                ))
            }
        }
    }

    if (isLoading) {
        return (
            <Loading />
        )
    }

    return (
        <>
            <Modal
                open={carpoolModal.isDisplay}
                onClose={handleCarpoolModalClose}
                aria-labelledby="parent-modal-title"
                aria-describedby="parent-modal-description"
            >
                <Box sx={{ ...modalStyle, margin: 1, display: 'flex', justifyContent: 'space-between', columnGap: '0.5rem', flexWrap: 'wrap' }}>
                    {
                        carpoolModal.carpoolInfo.carpool.carpool_status === "Expired" ?
                            <Alert severity="info" sx={{ fontWeight: 'bold', width: '100%', marginBottom: '1rem' }}>
                                This carpool has expired and is no longer available. Please exit the carpool or withdraw request.
                            </Alert>
                            :
                            carpoolModal.carpoolInfo.carpool.carpool_status === "End" ?
                                <Alert severity="info" sx={{ fontWeight: 'bold', width: '100%', marginBottom: '1rem' }}>
                                    Carpool ended. Check email to rate members. Thanks for joining!
                                </Alert>
                                :
                                carpoolModal.carpoolInfo.carpool.carpool_status === "InProgress" ?
                                    <Alert severity="info" sx={{ fontWeight: 'bold', width: '100%', marginBottom: '1rem' }}>
                                        The carpool is currently in progress. Safe travels!
                                    </Alert>
                                    :
                                    <></>
                    }

                    <Map
                        from={{
                            address: carpoolModal.carpoolInfo.carpool.carpool_from,
                            lat: carpoolModal.carpoolInfo.carpool.carpool_fromLat,
                            lon: carpoolModal.carpoolInfo.carpool.carpool_fromLon,
                        }}

                        to={{
                            address: carpoolModal.carpoolInfo.carpool.carpool_to,
                            lat: carpoolModal.carpoolInfo.carpool.carpool_toLat,
                            lon: carpoolModal.carpoolInfo.carpool.carpool_toLon,
                        }}
                    />

                    <Box id="carpool-info-container">
                        <br />
                        <Typography fontWeight={'bold'} color={orange[500]}>Pickup:</Typography>
                        <Typography>{carpoolModal.carpoolInfo.carpool.carpool_from}</Typography>
                        <br />

                        <Typography fontWeight={'bold'} color={orange[500]}>Dropoff:</Typography>
                        <Typography>{carpoolModal.carpoolInfo.carpool.carpool_to}</Typography>


                        <Typography textAlign={'center'} fontWeight={'bold'} sx={{ textDecoration: 'underline', marginBottom: '1rem' }} color={orange[700]}>Carpool Members</Typography>

                        <Stack direction="row" spacing={2} justifyContent={'center'}>
                            {members.map((member) => (
                                <div key={member.member_email}>
                                    {member.isDriver && member.member_email === userInfo.user_email ? (
                                        <Badge badgeContent={"D&You"} color='primary'>
                                            <UserAvatar user_email={member.member_email} user_name={member.member_name} />
                                        </Badge>
                                    )
                                        : member.isDriver ? (
                                            <Badge badgeContent={"D"} color='primary'>
                                                <UserAvatar user_email={member.member_email} user_name={member.member_name} />
                                            </Badge>
                                        )
                                            : member.member_email === userInfo.user_email ? (
                                                <Badge badgeContent={"You"} color='secondary'>
                                                    <UserAvatar user_email={member.member_email} user_name={member.member_name} />
                                                </Badge>
                                            )
                                                : (
                                                    <UserAvatar user_email={member.member_email} user_name={member.member_name} />
                                                )}
                                </div>
                            ))}
                        </Stack>

                        <br />

                        {(carpoolModal.carpoolInfo.category === 0 || (carpoolModal.carpoolInfo.category === 5 && carpoolModal.carpoolInfo.searchResult[carpoolModal.carpoolInfo.index].carpool_type === 'fromDriver')) &&
                            <Box textAlign={'center'}>
                                <MyButton
                                    variant='contained'
                                    startIcon={<GroupAddTwoToneIcon />}
                                    onClick={() => setMyDialog({ isShow: true, title: 'Join confirmation', content: 'Are you sure you want to join?' })}
                                    disabled={btnDisabled}
                                >
                                    Request to join {isBtnProcess && <span className="spinner"></span>}
                                </MyButton>
                                {myDialog.isShow && <MyDialog myDialog={myDialog} action={requestToJoin} handleMyDialogClose={handleMyDialogClose} />}
                            </Box>
                        }

                        {((!carpoolModal.carpoolInfo.myCarpoolList.includes(carpoolModal.carpoolInfo.carpool.carpool_id)) && (carpoolModal.carpoolInfo.category === 1 || (carpoolModal.carpoolInfo.category === 5 && carpoolModal.carpoolInfo.searchResult[carpoolModal.carpoolInfo.index].carpool_type === 'fromStudent'))) &&
                            <Box textAlign={'center'}>
                                <MyButton
                                    variant='contained'
                                    startIcon={<Diversity3TwoToneIcon />}
                                    disabled={btnDisabled}
                                    onClick={() => setMyDialog({ isShow: true, title: 'Form carpool confirmation', content: 'Are you sure you want to form the carpool?' })}
                                >
                                    Form carpool{isBtnProcess && <span className="spinner"></span>}
                                </MyButton>
                                {myDialog.isShow && <MyDialog myDialog={myDialog} action={formCarpoolFromStuReq} handleMyDialogClose={handleMyDialogClose} />}
                            </Box>
                        }

                        {(carpoolModal.carpoolInfo.carpool.carpool_status === "Expired" || (carpoolModal.carpoolInfo.category === 2 && !carpoolModal.carpoolInfo.driverIsMeGroup.includes(carpoolModal.carpoolInfo.carpool.carpool_id) && (carpoolModal.carpoolInfo.carpool.carpool_status !== 'InProgress' && carpoolModal.carpoolInfo.carpool.carpool_status !== 'End'))) && (
                            <Box textAlign={'center'}>
                                <MyButton
                                    variant='contained'
                                    startIcon={<GroupRemoveTwoToneIcon />}
                                    onClick={() => setMyDialog({ isShow: true, title: 'Exit confirmation', content: 'Are you sure you want to exit this carpool?' })}
                                    disabled={btnDisabled}
                                >
                                    {carpoolModal.carpoolInfo.category === 4 ? "Withdraw Request" : "Exit"}
                                    {isBtnProcess && <span className="spinner"></span>}
                                </MyButton>
                                {myDialog.isShow && <MyDialog myDialog={myDialog} action={handleExitCarpool} handleMyDialogClose={handleMyDialogClose} />}
                            </Box>
                        )
                        }

                        {(carpoolModal.carpoolInfo.category === 2 && carpoolModal.carpoolInfo.driverIsMeGroup.includes(carpoolModal.carpoolInfo.carpool.carpool_id) && carpoolModal.carpoolInfo.carpool.carpool_status !== "Expired") && (
                            <Box display={'flex'} justifyContent={'center'} columnGap={5}>
                                <StartEndButton
                                    variant='contained'
                                    startIcon={<NavigationTwoToneIcon />}
                                    onClick={() => {
                                        setCarpoolStatus('InProgress')
                                        setMyDialog({ isShow: true, title: 'Start carpool confirmation', content: 'Are you sure you want to start the carpool?' })
                                    }
                                    }
                                    disabled={isStartBtnDisabled}
                                >
                                    {startBtnText}{isStarting && <span className="spinner"></span>}
                                </StartEndButton>

                                <StartEndButton
                                    variant='contained'
                                    startIcon={<WhereToVoteTwoToneIcon />}
                                    onClick={() => {
                                        setCarpoolStatus('End')
                                        setMyDialog({ isShow: true, title: 'End carpool confirmation', content: 'Are you sure you want to end the carpool?' })
                                    }
                                    }
                                    disabled={isEndBtnDisabled}
                                >
                                    {endBtnText}{isEnding && <span className="spinner"></span>}
                                </StartEndButton>
                                {myDialog.isShow && <MyDialog myDialog={myDialog} action={startEndCarpool} handleMyDialogClose={handleMyDialogClose} />}
                            </Box>
                        )
                        }

                        {(carpoolModal.carpoolInfo.category === 3 && carpoolModal.carpoolInfo.carpool.carpool_status !== "Expired") &&
                            <Box display={'flex'} justifyContent={'center'} columnGap={1}>
                                <Typography fontWeight={'bold'}>Request from:</Typography>
                                <UserAvatar user_email={carpoolModal.carpoolInfo.myCarpoolJoinRequests[carpoolModal.carpoolInfo.index].user_email} user_name={carpoolModal.carpoolInfo.myCarpoolJoinRequests[carpoolModal.carpoolInfo.index].user_name} />
                                <Button
                                    variant="contained"
                                    color="success"
                                    disabled={btnDisabled}
                                    onClick={() => {
                                        setMyDialog({ isShow: true, title: 'Accept join request confirmation', content: 'Are you sure you want to accept this join request?' })
                                        setAcceptReject('Accept')
                                    }}>
                                    Accept{isBtnProcess && <span className="spinner"></span>}
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    disabled={btnDisabled}
                                    onClick={() => {
                                        setMyDialog({ isShow: true, title: 'Reject join request confirmation', content: 'Are you sure you want to reject this join request?' })
                                        setAcceptReject('Reject')
                                    }}>
                                    Reject{isBtnProcess && <span className="spinner"></span>}
                                </Button>

                                {myDialog.isShow && <MyDialog myDialog={myDialog} action={handleJoinRequests} handleMyDialogClose={handleMyDialogClose} />}
                            </Box>
                        }

                        {carpoolModal.carpoolInfo.category === 4 &&
                            <Box textAlign={'center'}>
                                <Typography fontWeight={'bold'}>Request Status:</Typography>
                                <Typography fontWeight={'bold'} color={requestStatusColor[carpoolModal.carpoolInfo.myJoinRequests[carpoolModal.carpoolInfo.index].request_status]}>{carpoolModal.carpoolInfo.myJoinRequests[carpoolModal.carpoolInfo.index].request_status}</Typography>
                            </Box>
                        }
                    </Box>
                </Box>
            </Modal>
            <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleAlertClose} />
        </>
    )
}

export default CarpoolModal