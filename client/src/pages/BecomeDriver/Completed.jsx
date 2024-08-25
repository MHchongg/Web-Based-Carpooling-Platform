import { Box, Typography } from "@mui/material"

const Completed = () => {
    return (
        <Box display={'flex'} justifyContent={'center'} marginTop={10}>
            <Box sx={{ backgroundColor: '#f2f2f2', width: '80%', borderRadius: '10px' }}>
                <div className="completed-loader">
                    <div className="completed-wrapper">
                        <div className="completed-text">In Progress</div>
                        <div className="completed-box"></div>
                    </div>
                </div>

                <Typography textAlign={'center'} fontWeight={'bold'} fontSize={'large'} marginTop={4} marginBottom={4} color={'#5b277b'}>
                    Your submission has been received. Please wait patiently as our administrators address it shortly.
                </Typography>
            </Box>
        </Box>
    )
}

export default Completed