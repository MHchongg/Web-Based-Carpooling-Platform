import { useParams } from "react-router-dom"
import * as React from 'react';
import { Box, Divider, Rating, Typography, Avatar, Badge, Stack } from '@mui/material';
import { useDispatch } from 'react-redux';
import { getCarpoolMembers } from "../../store/modules/carpoolStore";
import { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import AlertMsg from '../../components/AlertMsg'
import Footer from "../../components/Footer"
import NotFound from "../../components/NotFound";
import { orange } from '@mui/material/colors';
import './index.scss'
import { checkAccessForRating, submitRatings } from "../../store/modules/userStore"
import AssignmentTurnedInTwoToneIcon from '@mui/icons-material/AssignmentTurnedInTwoTone';
import { stringAvatar } from "../../utils";

const RateMembers = () => {

    const params = useParams()
    const dispatch = useDispatch()

    const [members, setMembers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [ratings, setRatings] = useState({})
    const [showAlert, setShowAlert] = useState({ alert: false, status: true, msg: '' })
    const [access, setAccess] = useState({ access: false, isRated: false })
    const [submitBtnDisabled, setSubmitBtnDisabled] = useState(false)

    useEffect(() => {
        async function fetchInfo() {
            const access = await dispatch(checkAccessForRating(params.carpool_id, params.user_email, params.uuid))
            let members = []
            if (access.access && !access.isRated) {
                members = await dispatch(getCarpoolMembers(params.carpool_id))
                members = members.filter((member) => {return member.member_email !== params.user_email})
            }
            return { access, members }
        }

        fetchInfo().then(({ access, members }) => {
            setMembers(members);
            setAccess(access)
            setIsLoading(false)

            const initialRatings = {};
            members.forEach(member => {
                initialRatings[member.member_email] = 3.5;
            });
            setRatings(initialRatings);
        })

    }, [dispatch, params.carpool_id, params.user_email, params.uuid])

    const handleRatingChange = (member_email, newRating) => {
        setRatings(prevRatings => ({
            ...prevRatings,
            [member_email]: newRating,
        }));
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setShowAlert(prevAlert => ({ ...prevAlert, alert: false }))
    };

    const submitRating = async (event) => {
        event.preventDefault()

        if (Object.values(ratings).includes(null)) {
            setShowAlert({ alert: true, status: false, msg: "Please enter a valid rating for all members" })
        }
        else {
            setSubmitBtnDisabled(true)
            const response = await dispatch(submitRatings(ratings, params.carpool_id, params.user_email, params.uuid))
            setShowAlert(response)
        }
    }

    if (isLoading) {
        return (
            <Loading />
        )
    }

    if (access.access && !access.isRated) {
        return (
            <Box id="rating-page">
                <form id="rating-container" onSubmit={submitRating}>
                    <Box sx={{ backgroundColor: '#5b277b', color: 'white', padding: '10px 0 10px 0' }}>
                        <Typography textAlign={'center'} fontWeight={'bold'} fontSize={'xx-large'} fontStyle={'italic'}>UniCarpool</Typography>
                    </Box>

                    <Box display={'flex'} flexDirection={'column'} alignItems={'center'}>
                        <br />
                        <Typography sx={{ color: "#5b277b", fontWeight: 'bold', fontSize: 'x-large' }}>Rate your members</Typography>
                        <Typography sx={{ color: orange[500], fontWeight: 'bold', fontSize: 'large' }}>to build a more optimal user experience</Typography>
                        <br />
                    </Box>

                    <Divider sx={{ borderWidth: '3px' }} />

                    {members.map((member) => (
                        member.member_email !== params.user_email &&
                        <Box key={member.member_email}>
                            <br />
                            <Box display={'flex'} justifyContent={'space-around'}>
                                <Box display={'flex'} justifyContent={'center'} alignItems={'center'} width={'30%'}>
                                    {member.isDriver ?
                                        <Badge badgeContent={"D"} color='primary'>
                                            <Avatar {...stringAvatar(member.member_name)} />
                                        </Badge>
                                        :
                                        <Avatar {...stringAvatar(member.member_name)} />
                                    }
                                </Box>

                                <Stack spacing={2} alignItems={'center'} width={'70%'}>
                                    <Typography sx={{ color: '#5b277b', fontWeight: 'bold' }}>{member.member_email}</Typography>
                                    <Typography sx={{ color: '#5b277b', fontWeight: 'bold' }}>{member.member_name}</Typography>
                                    <Rating
                                        name="simple-controlled"
                                        value={ratings[member.member_email]}
                                        onChange={(event, newRating) => handleRatingChange(member.member_email, newRating)}
                                    />
                                </Stack>
                            </Box>
                            <br />

                            <Divider sx={{ borderWidth: '3px' }} />
                        </Box>
                    ))}

                    <Box display={'flex'} justifyContent={'center'} padding={'10px 0 10px 0'}>
                        <input id="rating-submitBtn" type="submit" value="Submit" disabled={submitBtnDisabled} />
                    </Box>

                </form>
                <Footer />
                <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleClose} />
            </Box>
        )
    }
    else if (access.access && access.isRated) {
        return (
            <Box id="rating-page">
                <Box display={'flex'} flexDirection={'column'} alignItems={'center'}>
                    <h1 style={{ color: '#5b277b', marginTop: '3rem' }}>THANK YOU!</h1>
                    <AssignmentTurnedInTwoToneIcon sx={{ fontSize: '10rem', color: orange[500] }} />
                    <Typography fontWeight={600} fontSize={24} textAlign={'center'}>
                        Thanks for your review.
                    </Typography>
                    <Typography fontWeight={600} fontSize={24} textAlign={'center'}>
                        We really appreciate you giving us a moment of your time today. 
                    </Typography>
                    <Typography fontWeight={600} fontSize={24} textAlign={'center'}>
                        Thanks for being you.
                    </Typography>
                </Box>
                <Footer />
            </Box>
        )
    }
    else {
        return <NotFound />
    }
}

export default RateMembers