import { Box, Tabs, Tab, Typography, Stack, IconButton, Tooltip, Drawer, List, ListItem } from '@mui/material'
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom'
import io from "socket.io-client";
import Chat from './Chat';
import Loading from "../../components/Loading";
import chatGroupImage from "../../assets/chatgroup.png"
import WorkspacesRoundedIcon from '@mui/icons-material/WorkspacesRounded';
import './index.scss'
import { getMyGroupChatGroups } from '../../store/modules/groupChatStore';
import { getCarpoolList } from '../../store/modules/carpoolStore';

const socket = io.connect(process.env.REACT_APP_API_URL);

const GroupChat = () => {

    const { userEmail } = useSelector(state => state.user)
    const { groupChatGroup } = useSelector(state => state.groupChat)
    const { carpoolList } = useSelector(state => state.carpool)
    const dispatch = useDispatch()

    const [tabIndex, setTabIndex] = useState(0);
    const [groupID, setGroupID] = useState(0)
    const [isLoading, setIsLoading] = useState(true);
    const [carpool, setCarpool] = useState()
    const [openDrawer, setOpenDrawer] = useState(false);

    const handleTabIndex = (event, id) => {
        setTabIndex(id);
    };

    const toggleDrawer = (newOpen) => () => {
        setOpenDrawer(newOpen);
    };

    const joinGroupChat = async (groupID) => {
        if (groupID !== 0) {
            setGroupID(groupID)
            setCarpool(carpoolList.filter((carpool) => { return carpool.carpool_id === groupID })[0])
            socket.emit("join_groupChat", groupID)
        }
    }

    useEffect(() => {
        async function fetchMyGroupChatGroups() {
            await dispatch(getCarpoolList())
            await dispatch(getMyGroupChatGroups(userEmail))
        }

        if (userEmail !== "") {
            fetchMyGroupChatGroups()
            setIsLoading(false)
        }
    }, [dispatch, userEmail]);

    if (isLoading) {
        return (
            <Loading />
        )
    }

    if (groupChatGroup.length <= 0) {
        return (
            <Box width={'100%'} flex={'1 1 auto'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                <Stack alignItems={'center'} spacing={3}>
                    <img src={chatGroupImage} alt='join chat group' style={{ width: '65%' }}></img>
                    <Typography textAlign={'center'} fontSize={'larger'} fontWeight={'bold'} sx={{ color: '#5b277b' }}>You haven't joined any groups yet.</Typography>
                    <Link to="/home" style={{ textAlign: 'center', background: '#ff9800', color: 'white', textDecoration: 'none', padding: '5px', width: '30%', borderRadius: '10px', fontWeight: 'bold' }}>Home page</Link>
                </Stack>
            </Box>
        )
    }
    else {
        return (
            <Box sx={{ bgcolor: 'background.paper', height: '80%', width: '100%', display: 'flex', flex: '1 1 auto' }}>

                <Tooltip title="Your carpool groups" placement='bottom'>
                    <IconButton id="carpool-grp-btn" onClick={toggleDrawer(true)}>
                        <WorkspacesRoundedIcon sx={{ color: '#ff9800' }} />
                    </IconButton>
                </Tooltip>

                <Drawer open={openDrawer} anchor='top' onClose={toggleDrawer(false)}>
                    <List>
                        {groupChatGroup.map((group, index) => (
                            <ListItem key={group.carpool_id} sx={{ cursor: 'pointer' }} className={groupID === group.carpool_id ? "selected-carpool-grp" : "not-selected-carpool-grp"} onClick={() => {
                                setTabIndex(index)
                                joinGroupChat(group.carpool_id)
                                setOpenDrawer(false)
                            }}>
                                <Typography fontWeight={'bold'}>
                                    {group.carpool_title}
                                </Typography>
                            </ListItem>
                        ))}
                    </List>
                </Drawer>

                <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={tabIndex}
                    onChange={handleTabIndex}
                    aria-label="carpool group tab"
                    sx={{ borderRight: 1, borderColor: 'divider', width: '15%', height: '100%' }}
                    id="carpool-grp-tab"
                >
                    {groupChatGroup.map((group) => (
                        <Tab key={group.carpool_id} label={group.carpool_title} sx={{ fontWeight: 'bold' }} onClick={() => joinGroupChat(group.carpool_id)} />
                    ))}
                </Tabs>

                <Chat groupID={groupID} socket={socket} carpool={carpool} />
            </Box>
        )
    }
}

export default GroupChat