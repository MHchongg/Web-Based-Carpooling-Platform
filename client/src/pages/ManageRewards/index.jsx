import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux"
import { Box } from "@mui/material"
import { getRewards } from "../../store/modules/rewardStore";
import Loading from "../../components/Loading";

const ManageRewards = () => {

    const dispatch = useDispatch()

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRewards = async () => {
            await dispatch(getRewards("All"))
            setIsLoading(false)
        }

        fetchRewards()
    }, [dispatch])

    if (isLoading) {
        return <Loading />
    }

    return (
        <Box width={'100%'}>
            <Outlet />
        </Box>
    )
}

export default ManageRewards