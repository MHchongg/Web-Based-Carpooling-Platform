import { Box, Button } from "@mui/material"
import { useNavigate } from "react-router-dom"

const Forbidden = () => {

    const navigate = useNavigate()

    return (
        <Box width={'100%'} height={'100%'} display={'flex'} flexDirection={'column'} justifyContent={'center'} alignItems={'center'} gap={3}>
            <h1>403 Access Denied</h1>
            <p>
                Please check with the site <a href="mailto:chongminghong34@gmail.com">admin</a> if you believe this is a mistake.
            </p>
            <Button variant="contained" onClick={() => navigate(-1)}>Back</Button>
        </Box>
    )
}

export default Forbidden