import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux"
import { Box, IconButton, Menu, MenuItem, Pagination, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material"
import { deleteReward, setRewards, updateRewardAvailability } from "../../store/modules/rewardStore";
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import PowerSettingsNewRoundedIcon from '@mui/icons-material/PowerSettingsNewRounded';
import MyDialog from "../../components/MyDialog";
import AlertMsg from '../../components/AlertMsg';
import emptyBox from "../../assets/empty-box.png";

const RewardList = () => {
    
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { rewards } = useSelector(state => state.reward)

    const [myDialog, setMyDialog] = useState({ isShow: false, title: '', content: '', action: "" })
    const [showAlert, setShowAlert] = useState({ alert: false, status: false, msg: '' })
    const [anchorEl, setAnchorEl] = useState(null);
    const openCategoryFilter = Boolean(anchorEl);
    const [filterValue, setFilterValue] = useState("All")
    const [page, setPage] = useState(1)
    const [rewardID, setRewardID] = useState(0)
    const rewardsPerPage = 5

    const displayRewards = () => {
        const startIndex = (page - 1) * rewardsPerPage;
        const endIndex = startIndex + rewardsPerPage;

        if (filterValue !== "All") {
            return rewards.filter((reward) => reward.reward_category === filterValue).slice(startIndex, endIndex)
        }
        else {
            return rewards.slice(startIndex, endIndex)
        }
    }

    const applyFilter = (value) => {
        setFilterValue(value)
        setPage(1)
        setAnchorEl(null)
    }

    const handleMyDialogClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setMyDialog({ isShow: false, title: '', content: '' })
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setShowAlert(prevAlert => ({ ...prevAlert, alert: false }));
    };

    const handleDeleteReward = async () => {
        const response = await dispatch(deleteReward(rewardID))
        setShowAlert(response)

        if (response.status) {
            dispatch(setRewards(rewards.filter((reward) => reward.id !== rewardID)))
        }

        handleMyDialogClose()
    }

    const handleUpdateRewardAvailability = async () => {
        const status = rewards.filter((reward) => reward.id === rewardID)[0].reward_status
        const type = status === "Available" ? "Unavailable" : "Available"
        const response = await dispatch(updateRewardAvailability(rewardID, type))
        setShowAlert(response)

        if (response.status) {
            dispatch(setRewards(rewards.map((reward) => {
                if (reward.id === rewardID) {
                    return {
                        ...reward,
                        reward_status: type
                    }
                }
                else {
                    return reward
                }
            })))
        }

        handleMyDialogClose()
    }

    return (
        <Box width={'100%'} display={'flex'} justifyContent={'center'} marginBottom={'1.5rem'} marginTop={'1.5rem'}>
            <Stack width={'95%'} spacing={2} alignItems={'center'}>
                <Typography textAlign={'center'} fontWeight={'bold'} fontSize={'xx-large'} marginBottom={'1rem'} color={'#6f8b90'}>Rewards</Typography>

                    <Box width={'100%'} display={'flex'} alignItems={'center'} justifyContent={'flex-end'}>
                        <Tooltip title="add new reward" placement="top">
                            <IconButton onClick={() => navigate('/adminHome/manageRewards/rewardInfo/add')}>
                                <AddIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="filter by category" placement="top">
                            <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
                                <FilterListIcon />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            anchorEl={anchorEl}
                            open={openCategoryFilter}
                            onClose={() => setAnchorEl(null)}
                            sx={{ width: '180px' }}
                        >
                            <MenuItem onClick={() => applyFilter("All")}>All</MenuItem>
                            <MenuItem onClick={() => applyFilter("Vouchers")}>Vouchers</MenuItem>
                            <MenuItem onClick={() => applyFilter("Merchandise")}>Merchandise</MenuItem>
                            <MenuItem onClick={() => applyFilter("Services")}>Services</MenuItem>
                        </Menu>
                    </Box>

                    {displayRewards().length <= 0 ?
                        <Stack width={'100%'} alignItems={'center'} spacing={2}>
                            <Typography variant="h5" fontWeight={'bold'}>No reward</Typography>
                            <img src={emptyBox} alt='no rewards' style={{ width: '20rem' }}></img>
                        </Stack>
                    :
                        <TableContainer sx={{ boxShadow: 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px', borderRadius: 2 }}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#5b277b' }}>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 'medium', color: 'white' }}>Title</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 'medium', color: 'white' }}>Category</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 'medium', color: 'white' }}>Status</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {displayRewards().map((reward) => (
                                        <TableRow key={reward.id} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f4f4f6' }, '&:hover': { bgcolor: '#ececec' } }}>
                                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 'medium' }}>{reward.reward_title}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 'medium' }}>{reward.reward_category}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: 'medium', color: reward.reward_status === "Available" ? 'green' : 'red' }}>{reward.reward_status}</TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="View reward" placement="top">
                                                    <IconButton sx={{ color: '#5b277b' }} onClick={() => navigate(`/adminHome/manageRewards/rewardInfo/view/${reward.id}`)}>
                                                        <VisibilityRoundedIcon />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Edit reward" placement="top">
                                                    <IconButton sx={{ color: '#3d8bb9' }} onClick={() => navigate(`/adminHome/manageRewards/rewardInfo/edit/${reward.id}`)}>
                                                        <EditRoundedIcon />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Delete reward" placement="top">
                                                    <IconButton
                                                        sx={{ color: '#db4d3a' }}
                                                        onClick={() => {
                                                            setRewardID(reward.id)
                                                            setMyDialog({ isShow: true, title: 'Delete reward confirmation', content: 'Are you sure you want to delete this reward?', action: 'delete' })
                                                        }}>
                                                        <DeleteRoundedIcon />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title={reward.reward_status === "Available" ? "Make reward unavailable" : "Make reward available"} placement="top">
                                                    <IconButton
                                                        color={reward.reward_status === "Available" ? "error" : "success"}
                                                        onClick={() => {
                                                            setRewardID(reward.id)
                                                            setMyDialog(
                                                                {
                                                                    isShow: true,
                                                                    title: (reward.reward_status === "Available" ? 'Disable' : 'Enable').concat(' reward availability confirmation'),
                                                                    content: ('Are you sure you want to ').concat(reward.reward_status === "Available" ? 'disable' : 'enable').concat(' this reward?'),
                                                                    action: 'availability'
                                                                })
                                                        }}
                                                    >
                                                        <PowerSettingsNewRoundedIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    }

                    <Pagination
                        count={rewards.filter((reward) => filterValue !== "All" ? reward.reward_category === filterValue : reward).length > rewardsPerPage ? Math.ceil(rewards.filter((reward) => filterValue !== "All" ? reward.reward_category === filterValue : reward).length / rewardsPerPage) : 1}
                        color="secondary"
                        page={page}
                        onChange={(event, value) => setPage(value)}
                    />
            </Stack>

            <MyDialog myDialog={myDialog} action={myDialog.action === 'delete' ? handleDeleteReward : handleUpdateRewardAvailability} handleMyDialogClose={handleMyDialogClose} />

            <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleClose} />
        </Box>
    )
}

export default RewardList