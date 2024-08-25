import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom"
import { getRequests } from "../../store/modules/adminStore";
import { Avatar, Box, IconButton, InputBase, List, ListItem, ListItemAvatar, ListItemText, Paper, Pagination, Stack, Tabs, Tab, Tooltip, Typography } from "@mui/material"
import { orange } from '@mui/material/colors';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { stringAvatar } from '../../utils';
import Loading from "../../components/Loading";
import emptyBox from "../../assets/empty-box.png"
import "./index.scss"

const Drivers = () => {

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { userList } = useSelector(state => state.admin)

    const driverList = userList.filter((user) => user.user_role === "Driver")

    const [requestsList, setRequestsList] = useState([])
    const [tabValue, setTabValue] = useState("drivers")
    const [searchValue, setSearchValue] = useState("")
    const [page, setPage] = useState(1)
    const [isLoading, setIsLoading] = useState(true);
    const itemsPerPage = 4

    useEffect(() => {
        const fetchRequests = async () => {
            const response = await dispatch(getRequests())
            setRequestsList(response)
        }

        fetchRequests()
        setIsLoading(false)
    }, [dispatch])

    if (isLoading) {
        return <Loading />
    }
    else {
        return (
            <Stack width={'100%'} spacing={2} alignItems={'center'} margin={'1rem 0 1.5rem 0'}>
                <Typography textAlign={'center'} fontWeight={'bold'} fontSize={'xx-large'} marginBottom={'1rem'} color={'#6f8b90'}>{tabValue.charAt(0).toUpperCase() + tabValue.slice(1)}</Typography>

                <Tabs textColor="secondary" indicatorColor="secondary" aria-label="drivers and requests tab" value={tabValue} onChange={(event, value) => setTabValue(value)}>
                    <Tab value="drivers" label="drivers" sx={{ fontWeight: 'bold' }} />
                    <Tab value="requests" label="requests" sx={{ fontWeight: 'bold' }} />
                </Tabs>

                <Paper id="search-input-div" component="div">
                    <InputBase
                        sx={{ ml: 1, flex: 1, fontWeight: 'bold' }}
                        placeholder="Search Driver by email"
                        inputProps={{ 'aria-label': 'search driver' }}
                        onChange={(event) => setSearchValue(event.target.value)}
                        value={searchValue}
                    />

                    <IconButton type="button" sx={{ p: '10px' }} aria-label="search" disabled>
                        <SearchRoundedIcon />
                    </IconButton>
                </Paper>

                <Box>
                    <List>
                        {tabValue === "drivers" ?
                            driverList.length === 0 ?
                                <Stack width={'100%'} alignItems={'center'} spacing={2}>
                                    <Typography variant="h5" fontWeight={'bold'}>No driver</Typography>
                                    <img src={emptyBox} alt='no drivers' style={{ width: '65%' }}></img>
                                </Stack>
                                :
                                driverList.filter((user) => user.user_email.includes(searchValue)).slice((page - 1) * itemsPerPage, ((page - 1) * itemsPerPage) + itemsPerPage).map((user) => (
                                    <Tooltip key={user.id} title="View Driver Info" placement="right">
                                        <ListItem
                                            sx={{ cursor: 'pointer', border: 3, borderColor: orange[500], borderRadius: 5, boxShadow: 2, marginBottom: '1rem', transition: '0.3s', '&:hover': { boxShadow: 5 } }}
                                            onClick={() => navigate(`/adminHome/driverInfo/${user.user_email}/view`)}
                                        >
                                            <ListItemAvatar>
                                                <Avatar {...stringAvatar(user.user_name)} />
                                            </ListItemAvatar>
                                            <ListItemText>
                                                <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', color: '#5b277b', fontWeight: 'bold' }}>
                                                    {user.user_email}
                                                </Typography>
                                            </ListItemText>
                                        </ListItem>
                                    </Tooltip>
                                ))
                            :
                            requestsList.length === 0 ?
                                <Stack width={'100%'} alignItems={'center'} spacing={2}>
                                    <Typography variant="h5" fontWeight={'bold'}>No request</Typography>
                                    <img src={emptyBox} alt='no requests' style={{ width: '65%' }}></img>
                                </Stack>
                                :
                                requestsList.filter((request) => request.driver_email.includes(searchValue)).slice((page - 1) * itemsPerPage, ((page - 1) * itemsPerPage) + itemsPerPage).map((request) => (
                                    <Tooltip key={request.id} title="View Details" placement="right">
                                        <ListItem
                                            sx={{ cursor: 'pointer', border: 3, borderColor: orange[500], borderRadius: 5, boxShadow: 2, marginBottom: '1rem', transition: '0.3s', '&:hover': { boxShadow: 5 } }}
                                            onClick={() => navigate(`/adminHome/driverInfo/${request.driver_email}/request`)}
                                        >
                                            <ListItemAvatar>
                                                <Avatar {...stringAvatar(userList.filter((user) => user.user_email === request.driver_email)[0].user_name)} />
                                            </ListItemAvatar>
                                            <ListItemText>
                                                <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', color: '#5b277b', fontWeight: 'bold' }}>
                                                    {request.driver_email}
                                                </Typography>
                                                <Typography>
                                                    Request Type: {request.status === 'Pending' ? "Request to become driver" : "Update driver info"}
                                                </Typography>
                                            </ListItemText>
                                        </ListItem>
                                    </Tooltip>
                                ))
                        }
                    </List>
                </Box>

                <Pagination
                    count={tabValue === "drivers" ? driverList.filter((user) => user.user_email.includes(searchValue)).length > itemsPerPage ? Math.ceil(driverList.filter((user) => user.user_email.includes(searchValue)).length / itemsPerPage) : 1 : requestsList.filter((request) => request.driver_email.includes(searchValue)).length > itemsPerPage ? Math.ceil(requestsList.filter((request) => request.driver_email.includes(searchValue)).length / itemsPerPage) : 1}
                    color="secondary"
                    page={page}
                    onChange={(event, value) => setPage(value)}
                />
            </Stack>
        )
    }
}

export default Drivers