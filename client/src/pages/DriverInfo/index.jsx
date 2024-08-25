import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import ErrorTwoToneIcon from '@mui/icons-material/ErrorTwoTone';
import { orange } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { driverForm } from "../../components/SurveyJS/driverForm"
import { themeJson } from "../../components/SurveyJS/theme"
import { getBecomeDriverReqStatus } from "../../store/modules/userStore";
import { handleBecomeDriverRequest, getDriverUpdateInfo, handleUpdateDriverInfoRequest } from "../../store/modules/adminStore";
import Loading from "../../components/Loading";
import NotFound from "../../components/NotFound";
import { stringAvatar } from "../../utils";
import "survey-core/defaultV2.min.css";
import "./index.scss"

const MyButton = styled(Button)(({ theme }) => ({
    color: 'white',
    backgroundColor: orange[500],
    '&:hover': {
        backgroundColor: orange[700],
    },
}));

const DriverInfo = () => {

    const params = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [isLoading, setIsLoading] = useState(true);
    const [driverInfo, setDriverInfo] = useState()
    const [driverUpdateInfo, setDriverUpdateInfo] = useState()
    const [btnDisabled, setBtnDisabled] = useState(false)
    const [showCompletedPage, setShowCompletedPage] = useState(false)
    const [completedContent, setCompletedContent] = useState({ status: true, msg: '' })
    const [counter, setCounter] = useState(5)

    const info = new Model(driverForm)
    info.applyTheme(themeJson)
    info.mode = "display"

    const updateInfo = new Model(driverForm)
    updateInfo.applyTheme(themeJson)
    updateInfo.mode = "display"

    useEffect(() => {
        async function fetchDriverInfo() {
            const response = await dispatch(getBecomeDriverReqStatus(params.driverEmail))
            return response
        }

        async function fetchDriverUpdateInfo() {
            const response = await dispatch(getDriverUpdateInfo(params.driverEmail))
            return response
        }

        if (params.driverEmail) {
            fetchDriverInfo().then((response) => {
                setDriverInfo(response)
                if (response["request_status"] === "Update") {
                    fetchDriverUpdateInfo().then((response) => {
                        setDriverUpdateInfo(response)
                        setIsLoading(false)
                    })
                }
                else {
                    setIsLoading(false)
                }
            })
        }
    }, [dispatch, params.driverEmail])

    useEffect(() => {
        let timer;
        if (showCompletedPage && counter > 0) {
            timer = setInterval(() => setCounter(counter - 1), 1000);
        }
        else if (counter === 0) {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [counter, showCompletedPage]);

    const becomeDriverRequest = async (type) => {
        setBtnDisabled(true)
        setIsLoading(true)
        const response = await dispatch(handleBecomeDriverRequest(type, params.driverEmail))
        setIsLoading(false)
        setCompletedContent(response)
        setShowCompletedPage(true)
        setTimeout(() => {
            navigate('/adminHome/drivers')
        }, 5000)
    }

    const updateDriverInfoRequest = async (type) => {
        setBtnDisabled(true)
        setIsLoading(true)

        let newInfo = {}

        if (type === "Accept") {
            const { vehicle_model, vehicle_year, vehicle_color, vehicle_vin, vehicle_number, license_exp_date, license_issue_country } = driverUpdateInfo;
            newInfo = { vehicle_model, vehicle_year, vehicle_color, vehicle_vin, vehicle_number, license_exp_date, license_issue_country }
        }
        const response = await dispatch(handleUpdateDriverInfoRequest(type, params.driverEmail, newInfo))
        setIsLoading(false)
        setCompletedContent(response)
        setShowCompletedPage(true)
        setTimeout(() => {
            navigate('/adminHome/drivers')
        }, 5000)
    }

    if (isLoading) {
        return <Loading />
    }
    else if (!showCompletedPage) {
        info.data = {
            "vehicle_model": driverInfo.vehicle_model,
            "vehicle_year": driverInfo.vehicle_year,
            "vehicle_color": driverInfo.vehicle_color,
            "vehicle_vin": driverInfo.vehicle_vin,
            "vehicle_number": driverInfo.vehicle_number,
            "vehicle_photo": driverInfo.vehicle_photo,
            "license_exp_date": {
                "exp_date": driverInfo.license_exp_date
            },
            "license_issue_country": driverInfo.license_issue_country,
            "license_photo": driverInfo.license_photo,
        }
        if (driverInfo["request_status"] === "Update") {
            updateInfo.data = {
                "vehicle_model": driverUpdateInfo.vehicle_model,
                "vehicle_year": driverUpdateInfo.vehicle_year,
                "vehicle_color": driverUpdateInfo.vehicle_color,
                "vehicle_vin": driverUpdateInfo.vehicle_vin,
                "vehicle_number": driverUpdateInfo.vehicle_number,
                "vehicle_photo": driverUpdateInfo.vehicle_photo,
                "license_exp_date": {
                    "exp_date": driverUpdateInfo.license_exp_date
                },
                "license_issue_country": driverUpdateInfo.license_issue_country,
                "license_photo": driverUpdateInfo.license_photo,
            }
        }
    }

    if (showCompletedPage) {
        return (
            <Box width={'100%'} display={'flex'} justifyContent={'center'} marginTop={3}>
                <Stack alignItems={'center'} spacing={3} width={'70%'}>
                    {completedContent.status ?
                        <CheckCircleTwoToneIcon sx={{ fontSize: 150, color: '#00C851' }} />
                        :
                        <ErrorTwoToneIcon sx={{ fontSize: 150, color: '#FF8800' }} />
                    }
                    <Typography fontSize={50} fontWeight={'bold'}>{counter} s</Typography>
                    <Typography fontSize={'large'} textAlign={'justify'}>
                        {completedContent.msg} You will be directed to drivers page automatically.
                    </Typography>
                </Stack>
            </Box>
        )
    }
    else if (Object.keys(driverInfo).length !== 0 && (params.type === "view" || params.type === "request")) {
        return (
            <Box width={'100%'} display={'flex'} justifyContent={'center'} marginBottom={'2rem'}>
                <Stack width={'90%'} spacing={1} marginTop={'1rem'}>
                    <Stack width={'100%'} alignItems={'center'} margin={'1rem 0 1rem 0'} spacing={1}>
                        <Avatar {...stringAvatar(driverInfo.user_name, { height: 110, width: 110, fontSize: '3rem', boxShadow: 'rgba(14, 30, 37, 0.12) 0px 2px 4px 0px, rgba(14, 30, 37, 0.32) 0px 2px 16px 0px;' })} />
                        <Typography sx={{ color: '#6f8b90', fontWeight: 'bold', fontSize: 'large' }}>{driverInfo.user_name}</Typography>
                        <Typography sx={{ color: '#6f8b90', fontWeight: 'bold', fontSize: 'large' }}>{params.driverEmail}</Typography>
                        <MyButton startIcon={<ArrowBackIosNewRoundedIcon />} onClick={() => navigate(-1)}>Back to previous page</MyButton>
                    </Stack>

                    {(driverInfo["request_status"] === "Update" && params.type === "request") ?
                        <Stack>
                            <Box width={'100%'} display={'flex'} columnGap={1} rowGap={5} flexWrap={'wrap'} justifyContent={'center'}>
                                <Box id="update-info-container">
                                    <Typography variant="h5" fontWeight={'bold'} textAlign={'center'} bgcolor={'yellow'}>New Driver Info</Typography>
                                    <Survey model={updateInfo} />
                                </Box>
                                <Box id="current-info-container">
                                    <Typography variant="h5" fontWeight={'bold'} textAlign={'center'} bgcolor={'orange'}>Current Driver Info</Typography>
                                    <Survey model={info} />
                                </Box>
                            </Box>
                            <Box width={'100%'} display={'flex'} justifyContent={'space-around'} marginTop={'4rem'}>
                                <Button disabled={btnDisabled} variant="contained" color="success" sx={{ width: '40%' }} onClick={() => updateDriverInfoRequest('Accept')}>{btnDisabled && <span className="spinner"></span>} Accept New Info</Button>
                                <Button disabled={btnDisabled} variant="contained" color="error" sx={{ width: '40%' }} onClick={() => updateDriverInfoRequest('Reject')}>{btnDisabled && <span className="spinner"></span>} Reject New Info</Button>
                            </Box>
                        </Stack>
                        :
                        <Survey model={info} />
                    }

                    {driverInfo.request_status === 'Pending' &&
                        <Box width={'100%'} display={'flex'} justifyContent={'space-around'}>
                            <Button disabled={btnDisabled} variant="contained" color="success" sx={{ width: '40%' }} onClick={() => becomeDriverRequest('Accept')}>
                                Accept Request
                            </Button>
                            <Button disabled={btnDisabled} variant="contained" color="error" sx={{ width: '40%' }} onClick={() => becomeDriverRequest('Reject')}>
                                Reject Request
                            </Button>
                        </Box>
                    }
                </Stack>
            </Box>
        )
    }
    else {
        return <NotFound />
    }
}

export default DriverInfo