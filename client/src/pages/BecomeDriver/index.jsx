import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import { Box, Typography, Button, Stack } from '@mui/material';
import "survey-core/defaultV2.min.css";
import { driverForm } from "../../components/SurveyJS/driverForm"
import { themeJson } from "../../components/SurveyJS/theme";
import './index.scss'
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux'
import { requestBecomeDriver, getBecomeDriverReqStatus, updateDriverInfo } from "../../store/modules/userStore";
import AlertMsg from '../../components/AlertMsg';
import Loading from "../../components/Loading";
import { orange } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import CancelTwoToneIcon from '@mui/icons-material/CancelTwoTone';
import Completed from "./Completed"
import lodash from "lodash"

const MyButton = styled(Button)(({ theme }) => ({
    color: 'white',
    backgroundColor: orange[500],
    '&:hover': {
        backgroundColor: orange[700],
    },
}));

const BecomeDriver = () => {

    const { userInfo } = useSelector(state => state.user)
    const dispatch = useDispatch()

    const [showCompletedPage, setShowCompletedPage] = useState(false)
    const [isLoading, setIsLoading] = useState(true);
    const [showAlert, setShowAlert] = useState({ alert: false, status: false, msg: '' })
    const [reqInfo, setReqInfo] = useState()
    const [updateBtnText, setUpdateBtnText] = useState('Update your driver info')
    const [editBtnText, setEditBtnText] = useState('Edit your driver info')
    const [requestMode, setRequestMode] = useState('edit')

    useEffect(() => {
        async function fetchReqInfo() {
            const response = await dispatch(getBecomeDriverReqStatus(userInfo.user_email))
            return response
        }

        if (userInfo.user_email) {
            fetchReqInfo().then((response) => {
                setReqInfo(response)
                if (Object.keys(response).length > 0) {
                    setRequestMode('display')
                }
                setIsLoading(false)
            })
        }
    }, [dispatch, userInfo.user_email])

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setShowAlert(prevAlert => ({ ...prevAlert, alert: false }));
    };

    const request = new Model(driverForm)
    request.applyTheme(themeJson);

    request.onComplete.add(async (sender, options) => {

        let isImage = true
        let isImage2 = true

        if (sender.data["vehicle_photo"]) {
            isImage = sender.data["vehicle_photo"][0].type.startsWith("image/")
        }

        if (sender.data["license_photo"]) {
            isImage2 = sender.data["license_photo"][0].type.startsWith("image/")  
        }

        if (isImage && isImage2) {
            if (reqInfo.request_status === 'Accepted') {

                let requestData = {
                    license_exp_date: sender.data["license_exp_date"]["exp_date"],
                    license_issue_country: sender.data["license_issue_country"],
                    license_photo: sender.data["license_photo"],
                    vehicle_color: sender.data["vehicle_color"],
                    vehicle_number: sender.data["vehicle_number"],
                    vehicle_model: sender.data["vehicle_model"],
                    vehicle_vin: sender.data["vehicle_vin"],
                    vehicle_year: sender.data["vehicle_year"],
                    vehicle_photo: sender.data["vehicle_photo"],
                    request_status: reqInfo.request_status,
                    user_name: reqInfo.user_name,
                }

                if (lodash.isEqual(reqInfo, requestData)) {
                    setShowAlert({ alert: true, status: false, msg: 'Nothing changed'})
                }
                else {
                    requestData["vehicle_photo"] = sender.data["vehicle_photo"][0]
                    requestData["license_photo"] = sender.data["license_photo"][0]
                    const response = await dispatch(updateDriverInfo(requestData, userInfo.user_email))
                    setShowAlert(response)

                    if (response.status) setShowCompletedPage(true)
                }
            }
            else if (reqInfo.request_status === 'Rejected') {
                const response = await dispatch(requestBecomeDriver({
                    license_exp_date: sender.data["license_exp_date"]["exp_date"],
                    license_issue_country: sender.data["license_issue_country"],
                    license_photo: sender.data["license_photo"][0],
                    vehicle_color: sender.data["vehicle_color"],
                    vehicle_car_num: sender.data["vehicle_number"],
                    vehicle_model: sender.data["vehicle_model"],
                    vehicle_vin: sender.data["vehicle_vin"],
                    vehicle_year: sender.data["vehicle_year"],
                    vehicle_photo: sender.data["vehicle_photo"][0],
                    user_email: userInfo.user_email,
                    status: reqInfo.request_status,
                }))
                setShowAlert(response)

                if (response.status) setShowCompletedPage(true)
            }
            else {
                const response = await dispatch(requestBecomeDriver({
                    license_exp_date: sender.data["license_exp_date"]["exp_date"],
                    license_issue_country: sender.data["license_issue_country"],
                    license_photo: sender.data["license_photo"][0],
                    vehicle_color: sender.data["vehicle_color"],
                    vehicle_car_num: sender.data["vehicle_number"],
                    vehicle_model: sender.data["vehicle_model"],
                    vehicle_vin: sender.data["vehicle_vin"],
                    vehicle_year: sender.data["vehicle_year"],
                    vehicle_photo: sender.data["vehicle_photo"][0],
                    user_email: userInfo.user_email,
                }))
                setShowAlert(response)

                if (response.status) setShowCompletedPage(true)
            }
        }
        else {
            setShowAlert({ alert: true, status: false, msg: 'The file type is not accepted' })
        }
    })
    request.mode = requestMode

    const toggleMode = () => {
        if (requestMode === 'edit') {
            setRequestMode('display')
            setUpdateBtnText('Update your driver info')
            setEditBtnText('Edit your driver info')
        }
        else {
            setRequestMode('edit')
            setUpdateBtnText('Cancel')
            setEditBtnText('Cancel')
        }
    }

    if (isLoading) {
        return (
            <Loading />
        )
    }
    else {
        if (Object.keys(reqInfo).length > 0) {
            request.data = {
                "vehicle_model": reqInfo.vehicle_model,
                "vehicle_year": reqInfo.vehicle_year,
                "vehicle_color": reqInfo.vehicle_color,
                "vehicle_vin": reqInfo.vehicle_vin,
                "vehicle_number": reqInfo.vehicle_number,
                "vehicle_photo": reqInfo.vehicle_photo,
                "license_exp_date": {
                    "exp_date": reqInfo.license_exp_date
                },
                "license_issue_country": reqInfo.license_issue_country,
                "license_photo": reqInfo.license_photo,
            }
        }
    }

    if (reqInfo.request_status === 'Pending' || reqInfo.request_status === "Update") {
        return (
            <>
                <h1 style={{ color: '#ff9800', textAlign: 'center', padding: '1.5rem 0 1.5rem 0' }}>Become Driver Request ({reqInfo.request_status})</h1>
                <Completed />
            </>
        )
    }
    else if (reqInfo.request_status === 'Accepted') {
        return (
            <Box marginBottom={"1.5rem"}>
                <h1 style={{ color: '#ff9800', textAlign: 'center', padding: '1.5rem 0 1.5rem 0' }}>Your Driver Info</h1>

                {showCompletedPage ?
                    <Completed />
                    :
                    (
                        <>
                            <Stack marginBottom={4} spacing={1} alignItems={'center'}>
                                <Typography fontWeight={'bold'} fontSize={'1.5rem'} color={'#6f8b90'} textAlign={'center'}>You are already a driver.</Typography>

                                <MyButton sx={{ width: '50%' }} onClick={toggleMode} startIcon={requestMode === 'edit' && <CancelTwoToneIcon />}>
                                    {updateBtnText}
                                </MyButton>

                            </Stack>

                            <Box display={'flex'} justifyContent={'center'}>
                                <Box width={'95%'}>
                                    <Survey model={request} />
                                </Box>
                            </Box>
                        </>
                    )
                }

                <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleClose} />
            </Box>
        )
    }
    else if (reqInfo.request_status === 'Rejected') {
        return (
            <Box marginBottom={'1.5rem'}>
                <h1 style={{ color: '#ff9800', textAlign: 'center', padding: '1.5rem 0 1.5rem 0' }}>Your request is rejected</h1>
                
                {showCompletedPage ?
                    <Completed />
                    :
                    (
                        <>
                            <Stack marginBottom={4} spacing={1} alignItems={'center'}>
                                <Typography fontWeight={'bold'} fontSize={'1.5rem'} color={'#6f8b90'} textAlign={'center'}>You can choose to request again.</Typography>

                                <MyButton sx={{ width: '50%' }} onClick={toggleMode} startIcon={requestMode === 'edit' && <CancelTwoToneIcon />}>
                                    {editBtnText}
                                </MyButton>

                            </Stack>

                            <Box display={'flex'} justifyContent={'center'}>
                                <Box width={'95%'}>
                                    <Survey model={request} />
                                </Box>
                            </Box>
                        </>
                    )
                }
                
                <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleClose} />
            </Box>
        )
    }
    else {
        return (
            <Box marginBottom={"1.5rem"}>
                <h1 style={{ color: '#ff9800', textAlign: 'center', padding: '1.5rem 0 1.5rem 0' }}>Become Driver Request Form</h1>
                <Box display={'flex'} justifyContent={'center'}>
                    <Box width={'95%'}>
                        {showCompletedPage ?
                            <Completed />
                            :
                            <Survey model={request} />
                        }
                    </Box>
                </Box>

                <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleClose} />
            </Box>
        )
    }
}

export default BecomeDriver