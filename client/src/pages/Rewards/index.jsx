import { Box, Typography, Button, Tabs, Tab, Divider, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material"
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { useState, Fragment, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux"
import { Carousel } from "react-responsive-carousel"
import Loading from "../../components/Loading";
import AlertMsg from '../../components/AlertMsg';
import { getRewards, redeemReward, setRewards } from "../../store/modules/rewardStore";
import FolderOffTwoToneIcon from '@mui/icons-material/FolderOffTwoTone';
import "./index.scss"

const Rewards = () => {

    const { rewards } = useSelector(state => state.reward)
    const { userInfo } = useSelector(state => state.user)
    const dispatch = useDispatch()

    const [menu, setMenu] = useState('Vouchers');
    const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
    const [redeemDialogScroll, setRedeemDialogScroll] = useState('paper');
    const [isLoading, setIsLoading] = useState(true);
    const [showAlert, setShowAlert] = useState({ alert: false, status: false, msg: '' })
    const [currentReward, setCurrentReward] = useState({})
    const [redeemBtnDisabled, setRedeemBtnDisabled] = useState(false)

    useEffect(() => {
        const fetchRewards = async () => {
            await dispatch(getRewards())
            setIsLoading(false)
        }

        fetchRewards()
    }, [dispatch])

    const handleMenuChange = (event, newValue) => {
        setMenu(newValue);
    };

    const handleClickRedeemDialogOpen = (scrollType, reward) => () => {
        setCurrentReward(reward)
        setRedeemDialogOpen(true);
        setRedeemDialogScroll(scrollType);
    };

    const handleRedeemDialogClose = () => {
        setRedeemDialogOpen(false);
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setShowAlert(prevAlert => ({ ...prevAlert, alert: false }));
    };

    const handleRedeemReward = async () => {
        setRedeemBtnDisabled(true)
        const response = await dispatch(redeemReward(currentReward.id, currentReward.reward_title, currentReward.reward_redeem_points, userInfo.user_email))
        handleRedeemDialogClose()
        setRedeemBtnDisabled(false)
        setShowAlert(response)

        if (response.status) {
            dispatch(setRewards(
                rewards.map(reward => {
                    if (reward.id === currentReward.id) {
                        return {
                            ...reward,
                            reward_available_num: reward.reward_available_num - 1
                        };
                    } else {
                        return reward;
                    }
                })
            ));
        }
    }

    if (isLoading) {
        return <Loading />
    }

    return (
        <Box marginBottom={"3rem"}>
            <h1 style={{ color: '#ff9800', textAlign: 'center', padding: '1.5rem 0 1.5rem 0' }}>Rewards</h1>

            <Box width={'100%'} display={'flex'} justifyContent={'center'}>
                <Box width={'90%'}>
                    <Carousel autoPlay showArrows showIndicators={false} showThumbs={false} showStatus={false} width={'100%'} infiniteLoop>
                        {rewards.filter((reward) => {
                            return reward.reward_poster !== null;
                        }).map((reward) => (
                            <div key={reward.id} onClick={handleClickRedeemDialogOpen('paper', reward)} style={{ cursor: 'pointer' }}>
                                <img className="reward-poster" alt="reward" src={`${process.env.REACT_APP_API_URL}/rewardImages/${reward.id}/poster.jpeg`} loading='lazy' />
                            </div>
                        ))}
                    </Carousel>

                    <Divider sx={{ borderWidth: 'thick', marginTop: '3rem', borderColor: '#ff9800', borderRadius: '5px' }} />

                    <Box sx={{ width: '100%', marginTop: '1.5rem' }}>
                        <Tabs
                            value={menu}
                            onChange={handleMenuChange}
                            textColor="secondary"
                            indicatorColor="secondary"
                            aria-label="secondary tabs example"
                        >
                            <Tab value="Vouchers" label="Vouchers" sx={{ fontWeight: 'bold' }} />
                            <Tab value="Merchandise" label="Merchandise" sx={{ fontWeight: 'bold' }} />
                            <Tab value="Services" label="Services" sx={{ fontWeight: 'bold' }} />
                        </Tabs>
                    </Box>

                    <Box marginTop={2}>
                        {rewards.length <= 0 ?
                            <Box display={'flex'} flexDirection={'column'} alignItems={'center'}>
                                <FolderOffTwoToneIcon sx={{ color: '#ff9800', fontSize: '10rem' }} />
                                <Typography fontWeight={'bold'} fontSize={'large'}>Nothing here...</Typography>
                            </Box>
                        :
                        <Box marginTop={2} display={'flex'} flexWrap={'wrap'} rowGap={5} columnGap={5} justifyContent={'space-evenly'}>
                            {rewards.filter((reward) => {
                                return reward.reward_category === menu;
                            }).map((reward) => (
                                <div key={reward.id} className="reward-card" onClick={handleClickRedeemDialogOpen('paper', reward)}>
                                    <img className="reward-card-image" alt={`Reward: ${reward.reward_title}`} src={`${process.env.REACT_APP_API_URL}/rewardImages/${reward.reward_card_image}`} />
                                    <Typography className="reward-card-title">{reward.reward_title}</Typography>
                                    <Typography className="reward-card-points">{reward.reward_redeem_points} Points ({reward.reward_available_num} left)</Typography>
                                </div>
                            ))}
                        </Box>
                        }
                    </Box>

                    <Fragment>
                        <Dialog
                            open={redeemDialogOpen}
                            onClose={handleRedeemDialogClose}
                            scroll={redeemDialogScroll}
                            aria-labelledby="scroll-dialog-title"
                            aria-describedby="scroll-dialog-description"
                        >
                            <DialogTitle id="scroll-dialog-title" fontWeight={'bold'} color={'#ff9800'}>{currentReward.reward_title} ({currentReward.reward_available_num} left)</DialogTitle>
                            <DialogContent dividers={redeemDialogScroll === 'paper'}>
                                <Box padding={3} className="reward-dialog-content-text">
                                    <div dangerouslySetInnerHTML={{ __html: currentReward.reward_description }} />
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleRedeemDialogClose} sx={{ fontWeight: 'bold', color: '#5b277b' }}>Cancel</Button>
                                <Button onClick={handleRedeemReward} sx={{ fontWeight: 'bold', color: '#5b277b' }} disabled={redeemBtnDisabled}>{redeemBtnDisabled && <span className="spinner"></span>}Redeem</Button>
                            </DialogActions>
                        </Dialog>
                    </Fragment>

                </Box>
            </Box>
            <AlertMsg open={showAlert.alert} status={showAlert.status} msg={showAlert.msg} handleClose={handleClose} />
        </Box>
    )
}

export default Rewards