import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux";
import { Box, Button, Stack, Typography } from "@mui/material"
import { orange } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import ErrorTwoToneIcon from '@mui/icons-material/ErrorTwoTone';
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
import { rewardForm } from "../../components/SurveyJS/rewardForm"
import * as SurveyCore from "survey-core";
import { ckeditor } from "surveyjs-widgets";
import { themeJson } from "../../components/SurveyJS/theme"
import { addReward, editReward } from "../../store/modules/rewardStore";
import './index.scss'

ckeditor(SurveyCore)

const MyButton = styled(Button)(({ theme }) => ({
    color: 'white',
    backgroundColor: orange[500],
    '&:hover': {
        backgroundColor: orange[700],
    },
}));

const RewardInfo = () => {

    const params = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { rewards } = useSelector(state => state.reward)
    const rewardInfo = rewards.filter((reward) => reward.id === parseInt(params.reward_id))[0]

    const [showCompletedPage, setShowCompletedPage] = useState(false)
    const [completedContent, setCompletedContent] = useState({ status: true, msg: '' })
    const [counter, setCounter] = useState(5)

    const reward = new Model(rewardForm)
    reward.applyTheme(themeJson)

    reward.onComplete.add(async (sender, options) => {
        let response
        if (params.type === "add") {
            response = await dispatch(addReward(sender.data))
        }
        else if (params.type === 'edit') {
            response = await dispatch(editReward(params.reward_id, sender.data))
        }
        
        setCompletedContent(response)
        setShowCompletedPage(true)
        setTimeout(() => {
            navigate('/adminHome/manageRewards')
        }, 5000)
    })

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

    const rewardPoster = reward.getQuestionByName('reward_poster')
    const rewardCardImage = reward.getQuestionByName('reward_card_image')
    const rewardPosterDisplay = reward.getQuestionByName('reward_poster_display')
    const rewardCardImageDisplay = reward.getQuestionByName('reward_card_image_display')

    if (params.type === "view" || params.type === 'edit') {
        if (params.type === "view") {
            rewardPoster.visible = false
            rewardCardImage.visible = false
        }
        rewardPosterDisplay.imageLink = `${process.env.REACT_APP_API_URL}/rewardImages/${params.reward_id}/poster.jpeg`
        rewardCardImageDisplay.imageLink = `${process.env.REACT_APP_API_URL}/rewardImages/${params.reward_id}/card.jpeg`
        reward.data = {
            "reward_title": rewardInfo.reward_title,
            "reward_category": rewardInfo.reward_category,
            "reward_available_num": rewardInfo.reward_available_num,
            "reward_redeem_points": rewardInfo.reward_redeem_points,
            "reward_description": rewardInfo.reward_description,
        }
        rewardPosterDisplay.visible = true
        rewardCardImageDisplay.visible = true
    }
    else if (params.type === 'add') {
        rewardPosterDisplay.visible = false
        rewardCardImageDisplay.visible = false
    }
    params.type === 'view' ? reward.mode = 'display' : reward.mode = 'edit'

    return (
        <Stack width={'100%'} alignItems={'center'} spacing={2} marginBottom={'1.5rem'}>
            <Typography textAlign={'center'} fontWeight={'bold'} fontSize={'xx-large'} marginBottom={'1rem'} color={'#6f8b90'}>
                {
                    params.type === 'view' ? 
                        'Reward Info' :
                    params.type === 'edit' ?
                        'Edit reward' :
                        'Add new reward'
                }
            </Typography>
            {showCompletedPage ?
                <Stack alignItems={'center'} spacing={3} width={'70%'}>
                    {completedContent.status ?
                        <CheckCircleTwoToneIcon sx={{ fontSize: 150, color: '#00C851' }} />
                        :
                        <ErrorTwoToneIcon sx={{ fontSize: 150, color: '#FF8800' }} />
                    }
                    <Typography fontSize={50} fontWeight={'bold'}>{counter} s</Typography>
                    <Typography fontSize={'large'} textAlign={'justify'}>
                        {completedContent.msg} You will be directed to reward page automatically.
                    </Typography>
                </Stack>
                :
                <>
                    <MyButton startIcon={<ArrowBackIosNewRoundedIcon />} onClick={() => navigate(-1)}>Back to previous page</MyButton>
                    <Box width={'90%'}>
                        <Survey model={reward} />
                    </Box>
                </>
            }
        </Stack>
    )
}

export default RewardInfo