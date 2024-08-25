import './index.scss'
import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logOut, fetchUserInfo } from '../../store/modules/userStore';
import { getUserList } from '../../store/modules/adminStore';
import MenuIcon from '@mui/icons-material/Menu';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
import RedeemIcon from '@mui/icons-material/Redeem';
import { ListItemText, ListItemIcon, ListItemButton, ListItem, List, IconButton, Typography, Toolbar, Box, AppBar, Divider, Drawer, Button } from '@mui/material';
import Footer from '../../components/Footer';
import MyDialog from '../../components/MyDialog';
import LogoutIcon from '@mui/icons-material/Logout';
import Loading from "../../components/Loading";
import NotFound from '../../components/NotFound';

const menu = [
    { text: 'Users', icon: <Groups2RoundedIcon htmlColor='#5b277b' />, path: '/adminHome' },
    { text: 'Drivers', icon: <DirectionsCarFilledRoundedIcon htmlColor='#5b277b' />, path: '/adminHome/drivers' },
    { text: 'Manage Rewards', icon: <RedeemIcon htmlColor='#5b277b' />, path: '/adminHome/manageRewards' },
]

function AdminHome() {
    const { userEmail, userInfo } = useSelector(state => state.user)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            await dispatch(fetchUserInfo(userEmail))
            await dispatch(getUserList())
            await setIsLoading(false)
        }

        if (userEmail !== '') {
            fetchUser()
        }

    }, [dispatch, userEmail])

    const [isDrawerOpen, setDrawerOpen] = useState(false)

    const [myDialog, setMyDialog] = useState({ isShow: false, title: '', content: '' })

    const handleMyDialogClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setMyDialog({ isShow: false, title: '', content: '' })
    };

    const handleLogOut = () => {
        dispatch(logOut())
        navigate('/')
    }

    if (isLoading) {
        return (
            <Loading />
        )
    }
    else {
        if (userInfo.user_role === 'Admin') {
            return (
                <Box height={'100%'} display={'flex'} flexDirection={'column'}>
                    <AppBar position="sticky" style={{ backgroundColor: 'white' }}>
                        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <IconButton
                                size="large"
                                edge="start"
                                color="#5b277b"
                                aria-label="menu"
                                onClick={() => setDrawerOpen(true)}
                            >
                                <MenuIcon style={{ color: '#5b277b' }} />
                            </IconButton>
                            <h1 style={{ color: '#5b277b', fontStyle: 'italic', fontSize: '2rem' }}>UniCarpool</h1>
                            <Button startIcon={<LogoutIcon />} onClick={() => setMyDialog({ isShow: true, title: 'Log out confirmation', content: 'Are you sure you want to log out?' })} sx={{ fontWeight: '900', fontSize: '1rem', color: "#5b277b" }}>Log Out</Button>
                        </Toolbar>
                    </AppBar>
                    <MyDialog myDialog={myDialog} action={handleLogOut} handleMyDialogClose={handleMyDialogClose} />

                    <Drawer anchor='left' open={isDrawerOpen} onClose={() => setDrawerOpen(false)}>
                        <Box p={2} width='250px' textAlign='center' role='presentation' color="#5b277b">
                            <Typography variant='h5' component='div' fontWeight='bold'>
                                Menu
                            </Typography>
                            <Divider />
                            <List>
                                {menu.map((item) => (
                                    <ListItem key={item.text} disablePadding>
                                        <ListItemButton onClick={() => {
                                            navigate(item.path)
                                            setDrawerOpen(false)
                                        }}>
                                            <ListItemIcon>
                                                {item.icon}
                                            </ListItemIcon>
                                            <ListItemText primary={item.text} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Drawer>

                    <Outlet />

                    <Footer />
                </Box>
            )
        }
        else {
            return <NotFound />
        }
    }
}

export default AdminHome