import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { Box, Paper, InputBase, IconButton, Divider, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MessageBox } from "react-chat-elements";
import "react-chat-elements/dist/main.css"
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import InsertPhotoRoundedIcon from '@mui/icons-material/InsertPhotoRounded';
import PinDropRoundedIcon from '@mui/icons-material/PinDropRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import Zoom from 'react-medium-image-zoom'
import AlertMsg from '../../components/AlertMsg';
import CarpoolModal from '../../components/CarpoolModal';
import dayjs from "dayjs"
import { saveMessage, getMessageHistory } from '../../store/modules/groupChatStore';

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

const Chat = ({ groupID, socket, carpool }) => {

    const { userInfo } = useSelector(state => state.user)
    const dispatch = useDispatch()

    const [messageList, setMessageList] = useState([]);
    const [msgText, setMsgText] = useState("")
    const [showAlert, setShowAlert] = useState({ alert: false, status: false, msg: '' })
    const [showCarpoolModal, setShowCarpoolModal] = useState(false)
    const [btnDisabled, setBtnDisabled] = useState(false)

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setShowAlert(prevAlert => ({ ...prevAlert, alert: false }));
    };

    const handleSendMessage = async (e, type) => {

        setBtnDisabled(true)

        let msgData = {
            carpool_id: groupID,
            message_type: type,
            sender_email: userInfo.user_email,
            dateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }

        switch (type) {
            case 'text':
                if (msgText.trim() !== "") {
                    msgData["message_content"]  = msgText
                    const response = await dispatch(saveMessage(msgData))
                    msgData = response
                    setMsgText("")
                }
                else {
                    setShowAlert({ alert: true, status: false, msg: 'Cannot send empty message' })
                }
                break;

            case 'photo':
                const image = e.target.files[0];
                
                if (image) {
                    const reader = new FileReader()
                    reader.onload = async (event) => {
                        msgData["message_content"] = event.target.result
                        const response = await dispatch(saveMessage(msgData))
                        msgData = response
                    }
                    reader.readAsDataURL(image)
                }
                else {
                    setShowAlert({ alert: true, status: false, msg: 'Cannot send empty message' })
                }
                
                break;

            case 'location':
                if ("geolocation" in navigator) {
                    navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
                        if (permissionStatus.state === 'denied') {
                            alert('Geolocation access is denied. Please enable it in your browser settings to use sending location feature.');
                        }
                        else if (permissionStatus.state === 'prompt') {
                            navigator.geolocation.getCurrentPosition((position) => {
                                setShowAlert({ alert: true, status: true, msg: 'You can send your location now' })
                            }, (error) => {
                                if (error.code === error.PERMISSION_DENIED) {
                                    alert('Access denied. Enable geolocation for sending location')
                                } else {
                                    alert('Error getting location')
                                }
                            });
                        }
                        else {
                            navigator.geolocation.getCurrentPosition(
                                async position => {
                                    msgData["message_content"] = `https://www.google.com/maps/search/?api=1&query=${position.coords.latitude},${position.coords.longitude}`;
                                    const response = await dispatch(saveMessage(msgData))
                                    msgData = response
                                },
                                error => {
                                    alert('Error getting location: ', error)
                                },
                                { enableHighAccuracy: true }
                            );
                        }
                    });
                } else {
                    alert('Geolocation is not supported by your browser.');
                }
                break;

            default:
                setShowAlert({ alert: true, status: false, msg: 'Invalid message input type' })
                break;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
        if (msgData.message_id) {
            setMessageList((list) => [...list, msgData])
            await socket.emit("send_message", msgData)
        }

        setBtnDisabled(false)
    }

    const handleCarpoolModalClose = () => {
        setShowCarpoolModal(false)
    };

    useEffect(() => {
        const fetchOldMessages = async () => {
            const response = await dispatch(getMessageHistory(groupID))
            setMessageList(response)
        }

        if (groupID !== 0) {
            fetchOldMessages()
        }

    }, [dispatch, groupID])

    useEffect(() => {
        socket.on("receive_message", (data) => {
            setMessageList((list) => [...list, data]);
        });
    }, [socket]);

    if (groupID === 0) {
        return (
            <Box id="chat-container">
                <Box id="chat-body">
                    <Box width={'100%'} height={'100%'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                        <Typography color={'white'} fontWeight={'bold'} fontSize={'larger'}>Select a carpool group to chat.</Typography>
                    </Box>
                </Box>
            </Box>
        )
    }
    else {
        return (
            <Box id="chat-container">
                <Box width={'100%'} display={'flex'} justifyContent={'flex-end'} position={'sticky'} sx={{ backgroundColor: '#2b5278' }} >
                    <Tooltip title="Group Info" placement='bottom'>
                        <IconButton onClick={() => setShowCarpoolModal(true)}>
                            <InfoRoundedIcon sx={{ color: '#ff9800' }} />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Box id="chat-body">
                    {messageList.map((message) => (
                        message.message_type === 'text'
                            ?
                            <MessageBox
                                key={message.message_id}
                                position={message.sender_email === userInfo.user_email ? "right" : "left"}
                                type={message.message_type}
                                title={message.sender_email}
                                text={message.message_content}
                                date={message.dateTime}
                            />
                            :
                            message.message_type === 'photo' ?
                                <Zoom key={message.message_id}>
                                    <MessageBox
                                        position={message.sender_email === userInfo.user_email ? "right" : "left"}
                                        type={message.message_type}
                                        title={message.sender_email}
                                        data={{
                                            uri: message.message_content,
                                            width: 350,
                                            height: 100,
                                        }}
                                        date={message.dateTime}
                                    />
                                </Zoom>
                                :
                                <MessageBox
                                    key={message.message_id}
                                    position={message.sender_email === userInfo.user_email ? "right" : "left"}
                                    type={message.message_type}
                                    title={message.sender_email}
                                    src="https://cdn.pixabay.com/photo/2016/03/22/04/23/map-1272165_1280.png"
                                    href={message.message_content}
                                    date={message.dateTime}
                                />
                    ))}
                </Box>

                <Paper
                    component="div"
                    sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: '100%', borderRadius: 0, backgroundColor: '#2b5278' }}
                >
                    <InputBase
                        sx={{ ml: 1, flex: 1, fontWeight: 'bold', color: 'white' }}
                        placeholder="Type something..."
                        inputProps={{ 'aria-label': 'message-box' }}
                        onChange={(e) => setMsgText(e.target.value)}
                        value={msgText}
                        onKeyPress={(event) => { (event.key === "Enter" && !btnDisabled) && handleSendMessage(event, 'text') }}
                    />

                    <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />

                    <Tooltip title="Send Photo" placement='top'>
                        <IconButton component="label" sx={{ p: '10px', color: '#ff9800' }} aria-label="message-image" disabled={btnDisabled}>
                            <VisuallyHiddenInput type="file" accept='image/*' name='message-img' onChange={(e) => handleSendMessage(e, 'photo')} />
                            <InsertPhotoRoundedIcon />
                        </IconButton>
                    </Tooltip>

                    <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />


                    <Tooltip title="Send your location" placement='top'>
                        <IconButton sx={{ p: '10px', color: '#ff9800' }} aria-label="message-location" disabled={btnDisabled} onClick={(e) => handleSendMessage(e, 'location')}>
                            <PinDropRoundedIcon />
                        </IconButton>
                    </Tooltip>

                    <Divider sx={{ height: 28, m: 0.5, borderColor: 'white', borderWidth: 2, borderRadius: 3 }} orientation="vertical" />

                    <Tooltip title="Send Message" placement="top">
                        <IconButton sx={{ p: '10px', color: '#ff9800' }} aria-label="message-send" disabled={btnDisabled} onClick={(e) => handleSendMessage(e, 'text')}>
                            <SendRoundedIcon />
                        </IconButton>
                    </Tooltip>
                </Paper>

                <CarpoolModal carpoolModal={{isDisplay: showCarpoolModal, carpoolInfo: {
                    carpool: carpool,
                    category: -1,
                    myCarpoolList: [],
                    myCarpoolJoinRequests: [],
                    myJoinRequests: [],
                    driverIsMeGroup: [],
                    searchResult: [],
                    index: -1,
                }}} handleCarpoolModalClose={handleCarpoolModalClose} />

                <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleClose} />
            </Box>
        )
    }
}

export default Chat